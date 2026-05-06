/**
 * simulate.js — Simulación completa: cliente hace pedido → vendedor lo gestiona
 *
 * Pegar en la consola del navegador mientras estás en:
 *   https://moialmendares.github.io/alera-store/index.html
 *   (necesita ese origen para pasar el allowlist del Lambda)
 *
 * Antes de correr, cambia VEND_USER / VEND_PASS por las credenciales reales.
 */

(async () => {

  const API       = 'https://aq2rjel5xpc6kxux6u3lgg7p5q0fenmn.lambda-url.us-east-2.on.aws';
  const VEND_USER = 'TU_USUARIO_VENDEDOR';   // ← cambiar
  const VEND_PASS = 'TU_CONTRASEÑA';         // ← cambiar

  const h  = (tok) => ({ 'Content-Type': 'application/json', ...(tok ? { Authorization: `Bearer ${tok}` } : {}) });
  const post = (path, body, tok) => fetch(API + path, { method: 'POST', headers: h(tok), body: JSON.stringify(body) }).then(r => r.json());
  const get  = (path, tok)       => fetch(API + path, { headers: h(tok) }).then(r => r.json());
  const patch = (path, body, tok) => fetch(API + path, { method: 'PATCH', headers: h(tok), body: JSON.stringify(body) }).then(r => r.json());

  console.group('═══ ALERA — Simulación de pedido completo ═══');

  // ── 1. Cliente crea un pedido ─────────────────────────────────────────────
  console.log('\n📦 PASO 1 — Cliente hace un pedido...');
  const orderPayload = {
    customer: {
      name:    'Carlos Prueba',
      phone:   '99887766',
      address: 'Col. Kennedy, casa 14, Tegucigalpa',
    },
    items: [
      { id: 10, name: 'Lampara Minecraft',  qty: 1, price: 350 },
      { id:  1, name: 'Llavero Cubone',     qty: 2, price: 150 },
    ],
    subtotal: 650,
    shipping:  70,
    total:    720,
    zone:    'tgu',
    payment: 'contraentrega',
    orderNum: 999,
    date: new Date().toLocaleString('es-HN', { timeZone: 'America/Tegucigalpa' }),
  };

  const orderRes = await post('/orders', orderPayload);
  console.log('  Respuesta POST /orders:', orderRes);

  if (!orderRes.ok) {
    console.error('  ❌ No se pudo crear el pedido:', orderRes.error);
    console.groupEnd();
    return;
  }
  console.log('  ✅ Pedido creado con éxito');

  // ── 2. Vendedor inicia sesión ──────────────────────────────────────────────
  console.log('\n🔐 PASO 2 — Vendedor inicia sesión...');
  const loginRes = await post('/auth/login', { user: VEND_USER, password: VEND_PASS });
  console.log('  Respuesta POST /auth/login:', { role: loginRes.role, token: loginRes.token?.slice(0, 30) + '...' });

  if (!loginRes.token) {
    console.error('  ❌ Login fallido:', loginRes.error);
    console.groupEnd();
    return;
  }
  const tok = loginRes.token;
  console.log(`  ✅ Login exitoso como "${loginRes.role}"`);

  // ── 3. Vendedor consulta pedidos pendientes ────────────────────────────────
  console.log('\n📋 PASO 3 — Vendedor consulta la lista de pedidos...');
  const orders = await get('/orders', tok);
  const pendientes = Array.isArray(orders) ? orders.filter(o => o.status === 'pendiente') : [];
  console.log(`  Total pedidos: ${orders.length ?? '?'}  |  Pendientes: ${pendientes.length}`);

  const miPedido = Array.isArray(orders)
    ? orders.find(o => o.customer?.name === 'Carlos Prueba' && o.status === 'pendiente')
    : null;

  if (!miPedido) {
    console.warn('  ⚠️  El pedido de prueba no apareció en la lista (quizás ya existe DynamoDB lag)');
    console.log('  Primeros 3 pedidos:', orders.slice(0, 3).map(o => ({ id: o.id, name: o.customer?.name, status: o.status })));
    console.groupEnd();
    return;
  }
  console.log('  ✅ Pedido encontrado:', { id: miPedido.id, total: miPedido.total, status: miPedido.status });

  // ── 4. Vendedor toma el pedido ─────────────────────────────────────────────
  console.log('\n🙋 PASO 4 — Vendedor toma el pedido...');
  const tomarRes = await patch(`/orders/${miPedido.id}`, { action: 'tomar' }, tok);
  console.log('  Respuesta PATCH (tomar):', tomarRes);
  if (!tomarRes.ok) {
    console.warn('  ⚠️', tomarRes.error ?? 'Respuesta inesperada');
  } else {
    console.log('  ✅ Pedido asignado al vendedor');
  }

  // ── 5. Vendedor marca el pedido como entregado ─────────────────────────────
  console.log('\n✅ PASO 5 — Vendedor marca como "entregado"...');
  const entregarRes = await patch(`/orders/${miPedido.id}`, { status: 'entregado' }, tok);
  console.log('  Respuesta PATCH (entregado):', entregarRes);
  if (!entregarRes.ok) {
    console.warn('  ⚠️', entregarRes.error ?? 'Respuesta inesperada');
  } else {
    console.log('  ✅ Pedido marcado como entregado');
  }

  // ── 6. Verificar estado final ──────────────────────────────────────────────
  console.log('\n🔍 PASO 6 — Verificando estado final del pedido...');
  const final = await get('/orders', tok);
  const pedidoFinal = Array.isArray(final) ? final.find(o => o.id === miPedido.id) : null;
  if (pedidoFinal) {
    console.log('  Estado final:', {
      id:       pedidoFinal.id,
      cliente:  pedidoFinal.customer?.name,
      total:    `L ${pedidoFinal.total}`,
      status:   pedidoFinal.status,
      vendedor: pedidoFinal.vendedor,
    });
  } else {
    console.warn('  ⚠️  No se encontró el pedido en la lista final.');
  }

  console.log('\n🎉 Simulación completa.\n');
  console.groupEnd();

})();
