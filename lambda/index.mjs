import { DynamoDBClient, ScanCommand, PutItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

const db = new DynamoDBClient({ region: "us-east-2" });

// Tamaño máximo del body: 1.5 MB (para imágenes base64)
const MAX_BODY_BYTES = 1_500_000;

// Longitudes máximas de campos de texto
const LIMITS = { name: 80, phone: 15, address: 150 };

function stripHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

function validateOrder(order) {
  if (!order || typeof order !== 'object') return 'Pedido inválido.';
  if (!order.customer || typeof order.customer !== 'object') return 'Datos de cliente faltantes.';

  const { name, phone, address } = order.customer;
  if (!name || typeof name !== 'string' || name.trim().length < 2)   return 'Nombre inválido.';
  if (!phone || typeof phone !== 'string' || !/^\d{6,15}$/.test(phone.trim())) return 'Teléfono inválido.';
  if (!address || typeof address !== 'string' || address.trim().length < 3) return 'Dirección inválida.';
  if (name.length > LIMITS.name)    return 'Nombre demasiado largo.';
  if (phone.length > LIMITS.phone)  return 'Teléfono demasiado largo.';
  if (address.length > LIMITS.address) return 'Dirección demasiado larga.';

  if (!Array.isArray(order.items) || order.items.length === 0) return 'El pedido no tiene productos.';
  if (order.items.length > 50) return 'Demasiados productos en el pedido.';

  if (!['contraentrega', 'transferencia'].includes(order.payment)) return 'Método de pago inválido.';
  if (!['tgu', 'fuera'].includes(order.zone)) return 'Zona de envío inválida.';

  // Limitar tamaño de imagen a ~1 MB en base64
  if (order.transferImg && order.transferImg.length > 1_400_000) return 'Imagen demasiado grande (máx 1 MB).';

  return null; // sin errores
}

function sanitizeOrder(order) {
  order.customer.name    = stripHtml(order.customer.name);
  order.customer.phone   = order.customer.phone.replace(/\D/g, '').slice(0, 15);
  order.customer.address = stripHtml(order.customer.address);
  order.items = order.items.map(item => ({
    id:    Number(item.id),
    name:  stripHtml(String(item.name)).slice(0, 100),
    qty:   Math.min(Math.max(1, Number(item.qty)), 99),
    price: Math.max(0, Number(item.price)),
  }));
  order.subtotal = Math.max(0, Number(order.subtotal));
  order.shipping = Math.max(0, Number(order.shipping));
  order.total    = Math.max(0, Number(order.total));
  return order;
}

export const handler = async (event) => {
  const method = event.requestContext?.http?.method || event.httpMethod;
  const path   = event.rawPath || event.path || '/';

  // Rechazar bodies excesivamente grandes
  if (event.body && event.body.length > MAX_BODY_BYTES) {
    return { statusCode: 413, body: JSON.stringify({ error: 'Payload demasiado grande.' }) };
  }

  try {
    // ── GET /products ──────────────────────────────────────────────────────
    if (method === 'GET' && path.startsWith('/products')) {
      const r = await db.send(new ScanCommand({ TableName: 'alera-products' }));
      return { statusCode: 200, body: JSON.stringify((r.Items || []).map(i => unmarshall(i))) };
    }

    // ── PUT /products ──────────────────────────────────────────────────────
    if (method === 'PUT' && path.startsWith('/products')) {
      const products = JSON.parse(event.body);
      if (!Array.isArray(products)) return { statusCode: 400, body: JSON.stringify({ error: 'Se esperaba un array.' }) };
      for (const p of products.slice(0, 200)) {
        await db.send(new PutItemCommand({ TableName: 'alera-products', Item: marshall(p, { removeUndefinedValues: true }) }));
      }
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    // ── GET /orders ────────────────────────────────────────────────────────
    if (method === 'GET' && path.startsWith('/orders')) {
      const r = await db.send(new ScanCommand({ TableName: 'alera-orders' }));
      const items = (r.Items || []).map(i => unmarshall(i)).sort((a, b) => b.id - a.id);
      return { statusCode: 200, body: JSON.stringify(items) };
    }

    // ── POST /orders ───────────────────────────────────────────────────────
    if (method === 'POST' && path.startsWith('/orders')) {
      let order;
      try { order = JSON.parse(event.body); } catch { return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido.' }) }; }

      const err = validateOrder(order);
      if (err) return { statusCode: 400, body: JSON.stringify({ error: err }) };

      order = sanitizeOrder(order);
      order.id      = Number(order.id) || Date.now();
      order.status  = 'pendiente'; // siempre pendiente al crear, nunca confiar en el cliente

      await db.send(new PutItemCommand({ TableName: 'alera-orders', Item: marshall(order, { removeUndefinedValues: true }) }));
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    // ── PATCH /orders/:id ──────────────────────────────────────────────────
    if (method === 'PATCH' && path.includes('/orders/')) {
      const id = Number(path.split('/orders/')[1]);
      if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'ID inválido.' }) };

      let body;
      try { body = JSON.parse(event.body); } catch { return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido.' }) }; }

      const validStatuses = ['pendiente', 'entregado', 'cancelado'];
      if (!validStatuses.includes(body.status)) return { statusCode: 400, body: JSON.stringify({ error: 'Estado inválido.' }) };

      await db.send(new UpdateItemCommand({
        TableName: 'alera-orders',
        Key: marshall({ id }),
        UpdateExpression: 'SET #s = :s',
        ExpressionAttributeNames:  { '#s': 'status' },
        ExpressionAttributeValues: marshall({ ':s': body.status }),
      }));
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 404, body: JSON.stringify({ error: 'Not found.' }) };

  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: JSON.stringify({ error: 'Error interno del servidor.' }) };
  }
};
