import { createHmac, timingSafeEqual } from 'crypto';
import { DynamoDBClient, ScanCommand, PutItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const db          = new DynamoDBClient({ region: 'us-east-2' });
const MAX_BODY    = 1_500_000;           // 1.5 MB máximo por request
const TOKEN_TTL   = 8 * 60 * 60 * 1000; // 8 horas
const LIMITS      = { name: 80, phone: 15, address: 150 };

// ── Helpers de token ──────────────────────────────────────────────────────────
function secret() {
  return process.env.JWT_SECRET || 'alera-cambia-esto-en-produccion';
}

function createToken(payload) {
  const data = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + TOKEN_TTL }))
                     .toString('base64url');
  const sig  = createHmac('sha256', secret()).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifyToken(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const dot   = token.lastIndexOf('.');
  if (dot === -1) return null;

  const data     = token.slice(0, dot);
  const sig      = token.slice(dot + 1);
  const expected = createHmac('sha256', secret()).update(data).digest('base64url');

  try {
    const a = Buffer.from(sig,      'base64url');
    const b = Buffer.from(expected, 'base64url');
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch { return null; }

  const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
  if (payload.exp < Date.now()) return null;
  return payload;
}

// Comparación timing-safe: hashea ambos antes de comparar (evita ataques de tiempo)
function safeEq(a, b) {
  const ha = createHmac('sha256', 'cmp').update(String(a)).digest();
  const hb = createHmac('sha256', 'cmp').update(String(b)).digest();
  return timingSafeEqual(ha, hb);
}

// ── Helpers de seguridad ──────────────────────────────────────────────────────
function stripHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

function validateOrder(order) {
  if (!order || typeof order !== 'object')               return 'Pedido inválido.';
  if (!order.customer || typeof order.customer !== 'object') return 'Datos de cliente faltantes.';

  const { name, phone, address } = order.customer;
  if (!name    || name.trim().length < 2)                return 'Nombre inválido.';
  if (!phone   || !/^\d{6,15}$/.test(phone.trim()))     return 'Teléfono inválido.';
  if (!address || address.trim().length < 3)             return 'Dirección inválida.';
  if (name.length    > LIMITS.name)                      return 'Nombre demasiado largo.';
  if (phone.length   > LIMITS.phone)                     return 'Teléfono demasiado largo.';
  if (address.length > LIMITS.address)                   return 'Dirección demasiado larga.';

  if (!Array.isArray(order.items) || order.items.length === 0) return 'El pedido no tiene productos.';
  if (order.items.length > 50)                           return 'Demasiados productos.';
  if (!['contraentrega','transferencia'].includes(order.payment)) return 'Método de pago inválido.';
  if (!['tgu','fuera'].includes(order.zone))             return 'Zona inválida.';
  if (order.transferImg?.length > 1_400_000)             return 'Imagen demasiado grande (máx 1 MB).';

  return null;
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

function unauth() {
  return { statusCode: 401, body: JSON.stringify({ error: 'No autorizado.' }) };
}

// ── Handler principal ─────────────────────────────────────────────────────────
export const handler = async (event) => {
  const method = event.requestContext?.http?.method || event.httpMethod;
  const path   = event.rawPath || event.path || '/';
  const auth   = event.headers?.authorization || event.headers?.Authorization || '';

  if (event.body && event.body.length > MAX_BODY)
    return { statusCode: 413, body: JSON.stringify({ error: 'Payload demasiado grande.' }) };

  try {

    // ── POST /auth/login ────────────────────────────────────────────────────
    if (method === 'POST' && path === '/auth/login') {
      let body;
      try { body = JSON.parse(event.body); }
      catch { return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido.' }) }; }

      const { user, password } = body || {};
      if (!user || !password)
        return { statusCode: 400, body: JSON.stringify({ error: 'Credenciales requeridas.' }) };

      const adminUser = process.env.ADMIN_USER || 'admin';
      const adminPass = process.env.ADMIN_PASS || 'alera2025';
      const vendUser  = process.env.VEND_USER  || 'vendedor';
      const vendPass  = process.env.VEND_PASS  || 'vendedor2025';

      let role = null;
      if (safeEq(user, adminUser) && safeEq(password, adminPass)) role = 'admin';
      else if (safeEq(user, vendUser) && safeEq(password, vendPass))  role = 'vendedor';

      if (!role) {
        await new Promise(r => setTimeout(r, 400)); // frena brute-force
        return { statusCode: 401, body: JSON.stringify({ error: 'Usuario o contraseña incorrectos.' }) };
      }

      return { statusCode: 200, body: JSON.stringify({ token: createToken({ user, role }), role }) };
    }

    // ── GET /products  (público) ────────────────────────────────────────────
    if (method === 'GET' && path.startsWith('/products')) {
      const r = await db.send(new ScanCommand({ TableName: 'alera-products' }));
      return { statusCode: 200, body: JSON.stringify((r.Items || []).map(i => unmarshall(i))) };
    }

    // ── PUT /products  (solo admin) ─────────────────────────────────────────
    if (method === 'PUT' && path.startsWith('/products')) {
      const claims = verifyToken(auth);
      if (!claims || claims.role !== 'admin') return unauth();

      const products = JSON.parse(event.body);
      if (!Array.isArray(products))
        return { statusCode: 400, body: JSON.stringify({ error: 'Se esperaba un array.' }) };

      for (const p of products.slice(0, 200))
        await db.send(new PutItemCommand({ TableName: 'alera-products', Item: marshall(p, { removeUndefinedValues: true }) }));

      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    // ── POST /orders  (público — clientes) ─────────────────────────────────
    if (method === 'POST' && path.startsWith('/orders')) {
      let order;
      try { order = JSON.parse(event.body); }
      catch { return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido.' }) }; }

      const err = validateOrder(order);
      if (err) return { statusCode: 400, body: JSON.stringify({ error: err }) };

      order          = sanitizeOrder(order);
      order.id       = Number(order.id) || Date.now();
      order.status   = 'pendiente'; // el cliente nunca puede cambiar el estado

      await db.send(new PutItemCommand({ TableName: 'alera-orders', Item: marshall(order, { removeUndefinedValues: true }) }));
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    // ── GET /orders  (admin o vendedor) ────────────────────────────────────
    if (method === 'GET' && path.startsWith('/orders')) {
      const claims = verifyToken(auth);
      if (!claims) return unauth();

      const r     = await db.send(new ScanCommand({ TableName: 'alera-orders' }));
      const items = (r.Items || []).map(i => unmarshall(i)).sort((a, b) => b.id - a.id);
      return { statusCode: 200, body: JSON.stringify(items) };
    }

    // ── PATCH /orders/:id  (admin o vendedor) ───────────────────────────────
    if (method === 'PATCH' && path.includes('/orders/')) {
      const claims = verifyToken(auth);
      if (!claims) return unauth();

      const id = Number(path.split('/orders/')[1]);
      if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'ID inválido.' }) };

      let body;
      try { body = JSON.parse(event.body); }
      catch { return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido.' }) }; }

      const validStatuses = ['pendiente', 'entregado', 'cancelado'];
      if (!validStatuses.includes(body.status))
        return { statusCode: 400, body: JSON.stringify({ error: 'Estado inválido.' }) };

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
