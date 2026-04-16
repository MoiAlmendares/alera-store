import { createHmac, timingSafeEqual } from 'crypto';
import {
  DynamoDBClient, ScanCommand, PutItemCommand, UpdateItemCommand,
  GetItemCommand, DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const db  = new DynamoDBClient({ region: 'us-east-2' });
const ses = new SESClient({ region: 'us-east-1' });

const MAX_BODY        = 1_500_000;
const TOKEN_TTL       = 8 * 60 * 60 * 1000;
const LIMITS          = { name: 80, phone: 15, address: 150 };
const SETTINGS_ID     = 0;
const ALLOWED_ORIGIN  = 'https://moialmendares.github.io';
const RL_TABLE        = 'alera-ratelimit';
const RL_MAX_ATTEMPTS = 5;
const RL_WINDOW_SECS  = 300; // 5 minutos

// ── Headers de seguridad + CORS ───────────────────────────────────────────────
function responseHeaders() {
  return {
    'Access-Control-Allow-Origin':  ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'X-Content-Type-Options':       'nosniff',
    'X-Frame-Options':              'DENY',
    'Referrer-Policy':              'strict-origin-when-cross-origin',
    'Strict-Transport-Security':    'max-age=31536000; includeSubDomains',
  };
}

function resp(status, body) {
  return { statusCode: status, headers: responseHeaders(), body: JSON.stringify(body) };
}

function unauth() { return resp(401, { error: 'No autorizado.' }); }

// ── Rate limiting ─────────────────────────────────────────────────────────────
async function checkRateLimit(ip) {
  if (!ip) return false;
  try {
    const r = await db.send(new GetItemCommand({ TableName: RL_TABLE, Key: marshall({ ip }) }));
    if (!r.Item) return false;
    return unmarshall(r.Item).attempts >= RL_MAX_ATTEMPTS;
  } catch { return false; } // fail open: si DynamoDB falla, no bloqueamos
}

async function recordFailedAttempt(ip) {
  if (!ip) return;
  try {
    const ttl = Math.floor(Date.now() / 1000) + RL_WINDOW_SECS;
    await db.send(new UpdateItemCommand({
      TableName: RL_TABLE,
      Key: marshall({ ip }),
      UpdateExpression: 'ADD attempts :one SET #ttl = if_not_exists(#ttl, :ttl)',
      ExpressionAttributeNames:  { '#ttl': 'ttl' },
      ExpressionAttributeValues: marshall({ ':one': 1, ':ttl': ttl }),
    }));
  } catch (e) { console.error('recordFailedAttempt:', e); }
}

async function clearRateLimit(ip) {
  if (!ip) return;
  try {
    await db.send(new DeleteItemCommand({ TableName: RL_TABLE, Key: marshall({ ip }) }));
  } catch {}
}

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

function safeEq(a, b) {
  const ha = createHmac('sha256', 'cmp').update(String(a)).digest();
  const hb = createHmac('sha256', 'cmp').update(String(b)).digest();
  return timingSafeEqual(ha, hb);
}

function hashCred(value) {
  return createHmac('sha256', secret() + ':cred-v1').update(String(value)).digest('hex');
}

function safeHashEq(input, storedHash) {
  try {
    const a = Buffer.from(hashCred(input), 'hex');
    const b = Buffer.from(storedHash,      'hex');
    return a.length === b.length && timingSafeEqual(a, b);
  } catch { return false; }
}

// ── Credenciales almacenadas (DynamoDB) ───────────────────────────────────────
async function getStoredCreds() {
  try {
    const r = await db.send(new GetItemCommand({
      TableName: 'alera-products',
      Key: marshall({ id: SETTINGS_ID }),
    }));
    return r.Item ? unmarshall(r.Item) : null;
  } catch (e) { console.error('getStoredCreds:', e); return null; }
}

async function saveStoredCreds(creds) {
  await db.send(new PutItemCommand({
    TableName: 'alera-products',
    Item: marshall({ ...creds, id: SETTINGS_ID }, { removeUndefinedValues: true }),
  }));
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

async function sendOrderEmail(order) {
  const to   = process.env.NOTIFY_EMAIL;
  const from = process.env.NOTIFY_EMAIL;
  if (!to) return;

  const zonaLabel = order.zone === 'tgu' ? 'Dentro de TGU — L 70' : 'Fuera de TGU — L 90-120';
  const pagoLabel = order.payment === 'contraentrega' ? 'Contra entrega' : 'Transferencia';
  const num       = String(order.orderNum).padStart(3, '0');

  const itemsHtml = order.items.map(i =>
    `<tr>
      <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0">${i.qty}x ${i.name}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600">L ${i.price * i.qty}</td>
    </tr>`
  ).join('');

  const html = `
  <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7">
    <div style="background:#14b8a6;padding:24px 28px">
      <h1 style="margin:0;color:#fff;font-size:20px">Nuevo pedido #${num}</h1>
      <p style="margin:4px 0 0;color:#ccfbef;font-size:13px">${order.date}</p>
    </div>
    <div style="padding:24px 28px">
      <h3 style="margin:0 0 12px;font-size:14px;color:#71717a;text-transform:uppercase;letter-spacing:.05em">Cliente</h3>
      <p style="margin:0;font-size:15px;font-weight:700">${order.customer.name}</p>
      <p style="margin:2px 0;font-size:14px;color:#52525b">Tel: ${order.customer.phone}</p>
      <p style="margin:2px 0;font-size:14px;color:#52525b">Dir: ${order.customer.address}</p>
      <h3 style="margin:20px 0 12px;font-size:14px;color:#71717a;text-transform:uppercase;letter-spacing:.05em">Productos</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        ${itemsHtml}
        <tr>
          <td style="padding:6px 12px;color:#71717a">Envio (${zonaLabel})</td>
          <td style="padding:6px 12px;text-align:right;color:#71717a">L ${order.shipping}</td>
        </tr>
        <tr style="background:#f4fdfb">
          <td style="padding:10px 12px;font-weight:800;font-size:15px">Total</td>
          <td style="padding:10px 12px;text-align:right;font-weight:800;font-size:15px;color:#14b8a6">L ${order.total}</td>
        </tr>
      </table>
      <p style="margin:16px 0 0;font-size:14px">Pago: <strong>${pagoLabel}</strong></p>
      ${order.transferImg ? '<p style="margin:4px 0 0;font-size:13px;color:#14b8a6">Comprobante de transferencia adjunto en el panel.</p>' : ''}
      <div style="margin-top:24px;text-align:center">
        <a href="https://moialmendares.github.io/alera-store/admin.html"
           style="background:#14b8a6;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:14px;display:inline-block">
          Ver en el panel
        </a>
      </div>
    </div>
  </div>`;

  await ses.send(new SendEmailCommand({
    Source:      from,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: `Alera - Nuevo pedido #${num} de ${order.customer.name}`, Charset: 'UTF-8' },
      Body:    { Html: { Data: html, Charset: 'UTF-8' } },
    },
  }));
}

// ── Handler principal ─────────────────────────────────────────────────────────
export const handler = async (event) => {
  const method = event.requestContext?.http?.method || event.httpMethod;
  const path   = event.rawPath || event.path || '/';
  const auth   = event.headers?.authorization || event.headers?.Authorization || '';
  const ip     = event.requestContext?.http?.sourceIp || null;

  // Preflight CORS
  if (method === 'OPTIONS') {
    return { statusCode: 200, headers: responseHeaders(), body: '' };
  }

  if (event.body && event.body.length > MAX_BODY)
    return resp(413, { error: 'Payload demasiado grande.' });

  try {

    // ── POST /auth/login ────────────────────────────────────────────────────
    if (method === 'POST' && path === '/auth/login') {
      let body;
      try { body = JSON.parse(event.body); }
      catch { return resp(400, { error: 'JSON inválido.' }); }

      const { user, password } = body || {};
      if (!user || !password)
        return resp(400, { error: 'Credenciales requeridas.' });

      // Verificar rate limit antes de cualquier otra cosa
      if (await checkRateLimit(ip)) {
        await new Promise(r => setTimeout(r, 400));
        return resp(429, { error: 'Demasiados intentos fallidos. Intentá en 5 minutos.' });
      }

      const stored = await getStoredCreds();

      // Sin fallbacks hardcodeados: si no hay env var ni DynamoDB, el login falla
      const adminUser  = stored?.adminUser  || process.env.ADMIN_USER  || null;
      const adminPassE = process.env.ADMIN_PASS  || null;
      const admin2User = stored?.admin2User || process.env.ADMIN2_USER2 || process.env.ADMIN2_USER || null;
      const admin2PassE = process.env.ADMIN2_PASS2 || process.env.ADMIN2_PASS || null;
      const vendUser   = stored?.vendUser   || process.env.VEND_USER   || null;
      const vendPassE  = process.env.VEND_PASS   || null;

      let role = null;

      if (adminUser && safeEq(user, adminUser)) {
        const passOk = stored?.adminPassHash
          ? safeHashEq(password, stored.adminPassHash)
          : (adminPassE && safeEq(password, adminPassE));
        if (passOk) role = 'admin';
      }

      if (!role && admin2User && safeEq(user, admin2User)) {
        const passOk = stored?.admin2PassHash
          ? safeHashEq(password, stored.admin2PassHash)
          : (admin2PassE && safeEq(password, admin2PassE));
        if (passOk) role = 'admin';
      }

      if (!role && vendUser && safeEq(user, vendUser)) {
        const passOk = stored?.vendPassHash
          ? safeHashEq(password, stored.vendPassHash)
          : (vendPassE && safeEq(password, vendPassE));
        if (passOk) role = 'vendedor';
      }

      if (!role) {
        await Promise.all([
          new Promise(r => setTimeout(r, 400)),
          recordFailedAttempt(ip),
        ]);
        return resp(401, { error: 'Usuario o contraseña incorrectos.' });
      }

      await clearRateLimit(ip);
      return resp(200, { token: createToken({ user, role }), role });
    }

    // ── GET /settings  (admin) ──────────────────────────────────────────────
    if (method === 'GET' && path.startsWith('/settings')) {
      const claims = verifyToken(auth);
      if (!claims || claims.role !== 'admin') return unauth();

      const stored = await getStoredCreds();
      return resp(200, {
        adminUser:  stored?.adminUser  || process.env.ADMIN_USER  || '',
        admin2User: stored?.admin2User || process.env.ADMIN2_USER2 || process.env.ADMIN2_USER || '',
        vendUser:   stored?.vendUser   || process.env.VEND_USER   || '',
      });
    }

    // ── PUT /settings  (admin) ──────────────────────────────────────────────
    if (method === 'PUT' && path.startsWith('/settings')) {
      const claims = verifyToken(auth);
      if (!claims || claims.role !== 'admin') return unauth();

      let body;
      try { body = JSON.parse(event.body); }
      catch { return resp(400, { error: 'JSON inválido.' }); }

      const { role, newUser, newPass } = body || {};

      if (!['admin', 'admin2', 'vend'].includes(role))
        return resp(400, { error: 'Rol inválido.' });
      if (!newUser && !newPass)
        return resp(400, { error: 'Ingresá al menos un campo.' });
      if (newUser && (newUser.trim().length < 3 || newUser.trim().length > 50))
        return resp(400, { error: 'Usuario inválido (3-50 caracteres).' });
      if (newPass && newPass.length < 6)
        return resp(400, { error: 'Contraseña mínimo 6 caracteres.' });

      const stored = (await getStoredCreds()) || { id: SETTINGS_ID };

      if (role === 'admin') {
        if (newUser) stored.adminUser     = newUser.trim();
        if (newPass) stored.adminPassHash = hashCred(newPass);
      } else if (role === 'admin2') {
        if (newUser) stored.admin2User     = newUser.trim();
        if (newPass) stored.admin2PassHash = hashCred(newPass);
      } else if (role === 'vend') {
        if (newUser) stored.vendUser     = newUser.trim();
        if (newPass) stored.vendPassHash = hashCred(newPass);
      }

      await saveStoredCreds(stored);
      return resp(200, { ok: true });
    }

    // ── GET /products  (público) ────────────────────────────────────────────
    if (method === 'GET' && path.startsWith('/products')) {
      const r = await db.send(new ScanCommand({ TableName: 'alera-products' }));
      const items = (r.Items || []).map(i => unmarshall(i)).filter(i => i.id !== SETTINGS_ID);
      return resp(200, items);
    }

    // ── PUT /products  (solo admin) ─────────────────────────────────────────
    if (method === 'PUT' && path.startsWith('/products')) {
      const claims = verifyToken(auth);
      if (!claims || claims.role !== 'admin') return unauth();

      const products = JSON.parse(event.body);
      if (!Array.isArray(products))
        return resp(400, { error: 'Se esperaba un array.' });

      for (const p of products.filter(p => p.id !== SETTINGS_ID).slice(0, 200))
        await db.send(new PutItemCommand({ TableName: 'alera-products', Item: marshall(p, { removeUndefinedValues: true }) }));

      return resp(200, { ok: true });
    }

    // ── POST /orders  (público — clientes) ─────────────────────────────────
    if (method === 'POST' && path.startsWith('/orders')) {
      let order;
      try { order = JSON.parse(event.body); }
      catch { return resp(400, { error: 'JSON inválido.' }); }

      const err = validateOrder(order);
      if (err) return resp(400, { error: err });

      order        = sanitizeOrder(order);
      order.id     = Number(order.id) || Date.now();
      order.status = 'pendiente';

      await db.send(new PutItemCommand({ TableName: 'alera-orders', Item: marshall(order, { removeUndefinedValues: true }) }));
      try { await sendOrderEmail(order); } catch(e) { console.error('SES:', e); }
      return resp(200, { ok: true });
    }

    // ── GET /orders  (admin o vendedor) ────────────────────────────────────
    if (method === 'GET' && path.startsWith('/orders')) {
      const claims = verifyToken(auth);
      if (!claims) return unauth();

      const r     = await db.send(new ScanCommand({ TableName: 'alera-orders' }));
      const items = (r.Items || []).map(i => unmarshall(i)).sort((a, b) => b.id - a.id);
      return resp(200, items);
    }

    // ── PATCH /orders/:id  (admin o vendedor) ───────────────────────────────
    if (method === 'PATCH' && path.includes('/orders/')) {
      const claims = verifyToken(auth);
      if (!claims) return unauth();

      const id = Number(path.split('/orders/')[1]);
      if (!id) return resp(400, { error: 'ID inválido.' });

      let body;
      try { body = JSON.parse(event.body); }
      catch { return resp(400, { error: 'JSON inválido.' }); }

      const validStatuses = ['pendiente', 'entregado', 'cancelado'];
      if (!validStatuses.includes(body.status))
        return resp(400, { error: 'Estado inválido.' });

      await db.send(new UpdateItemCommand({
        TableName: 'alera-orders',
        Key: marshall({ id }),
        UpdateExpression: 'SET #s = :s',
        ExpressionAttributeNames:  { '#s': 'status' },
        ExpressionAttributeValues: marshall({ ':s': body.status }),
      }));
      return resp(200, { ok: true });
    }

    return resp(404, { error: 'Not found.' });

  } catch (e) {
    console.error(e);
    return resp(500, { error: 'Error interno del servidor.' });
  }
};
