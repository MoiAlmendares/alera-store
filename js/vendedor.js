// ─── Vendedor panel logic ─────────────────────────────────────────────────────

function esc(str) {
  if (str == null) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

let _products = [];
let _orders   = [];

async function loadData() {
  try {
    const [pr, or] = await Promise.all([
      authFetch(API + '/products').then(r => r?.json()),
      authFetch(API + '/orders').then(r => r?.json())
    ]);
    _products = pr;
    _orders   = or;
  } catch(e) { console.error('loadData:', e); }
}

function getProducts() { return _products; }
async function saveProducts(products) {
  _products = products;
  try {
    const r = await authFetch(API + '/products', { method:'PUT', body:JSON.stringify(products) });
    if (!r || !r.ok) throw new Error('respuesta no ok');
  } catch(e) {
    console.error('saveProducts:', e);
    showToast('Error al guardar cambios — verificá tu conexión', false);
  }
}

function getOrders() { return _orders; }

// ─── UI State ────────────────────────────────────────────────────────────────
let currentFilter = 'all';
let currentTab    = 'products';
let ordersFilter  = 'pendiente';

// ─── Tabs ────────────────────────────────────────────────────────────────────
function setTab(tab) {
  currentTab = tab;
  const onP = tab === 'products';
  const activeClass = 'flex items-center gap-2 pb-3 text-sm font-semibold transition-colors border-b-2 border-zinc-900 text-zinc-900';
  const idleClass   = 'flex items-center gap-2 pb-3 text-sm font-semibold transition-colors border-b-2 border-transparent text-zinc-400 hover:text-zinc-600';
  document.getElementById('tab-btn-products').className = onP  ? activeClass : idleClass;
  document.getElementById('tab-btn-orders').className   = !onP ? activeClass : idleClass;
  document.getElementById('section-products').classList.toggle('hidden', !onP);
  document.getElementById('section-orders').classList.toggle('hidden',   onP);
  renderStats();
  if (!onP) renderOrders();
}

function renderAll() { renderStats(); renderTable(); updatePendingBadge(); }

function renderStats() {
  const row = document.getElementById('stats-row');
  if (currentTab === 'orders') {
    const orders    = getOrders();
    const pending   = orders.filter(o => o.status === 'pendiente').length;
    const delivered = orders.filter(o => o.status === 'entregado').length;
    row.innerHTML = `
      <div class="bg-white rounded-2xl border border-zinc-200 p-5"><div class="text-3xl font-black text-zinc-900">${orders.length}</div><div class="text-sm text-zinc-500 mt-1">Total pedidos</div></div>
      <div class="bg-white rounded-2xl border border-zinc-200 p-5"><div class="text-3xl font-black ${pending > 0 ? 'text-yellow-500' : 'text-zinc-900'}">${pending}</div><div class="text-sm text-zinc-500 mt-1">Pendientes</div></div>
      <div class="bg-white rounded-2xl border border-zinc-200 p-5"><div class="text-3xl font-black text-teal-600">${delivered}</div><div class="text-sm text-zinc-500 mt-1">Entregados</div></div>
      <div class="bg-white rounded-2xl border border-zinc-200 p-5"><div class="text-3xl font-black text-zinc-400">${orders.filter(o=>o.status==='cancelado').length}</div><div class="text-sm text-zinc-500 mt-1">Cancelados</div></div>`;
  } else {
    const products = getProducts();
    const agotado  = products.filter(p => p.stock === false);
    row.innerHTML = `
      <div class="bg-white rounded-2xl border border-zinc-200 p-5"><div class="text-3xl font-black text-teal-600">${products.length}</div><div class="text-sm text-zinc-500 mt-1">Total productos</div></div>
      <div class="bg-white rounded-2xl border border-zinc-200 p-5"><div class="text-3xl font-black text-zinc-900">${products.filter(p=>p.active).length}</div><div class="text-sm text-zinc-500 mt-1">Visibles en tienda</div></div>
      <div class="bg-white rounded-2xl border border-zinc-200 p-5"><div class="text-3xl font-black ${agotado.length > 0 ? 'text-red-500' : 'text-zinc-900'}">${agotado.length}</div><div class="text-sm text-zinc-500 mt-1">Agotados</div></div>
      <div class="bg-white rounded-2xl border border-zinc-200 p-5"><div class="text-3xl font-black text-zinc-400">${getOrders().filter(o=>o.status==='pendiente').length}</div><div class="text-sm text-zinc-500 mt-1">Pedidos pendientes</div></div>`;
  }
}

function renderTable() {
  const products = getProducts();
  const filtered = currentFilter === 'all' ? products : products.filter(p => p.category === currentFilter);
  const tbody = document.getElementById('products-table');
  const empty = document.getElementById('empty-table');
  if (!filtered.length) { tbody.innerHTML = ''; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  tbody.innerHTML = filtered.map(p => `
    <tr class="border-b border-zinc-50 hover:bg-zinc-50 transition-colors ${!p.active ? 'opacity-50' : ''}">
      <td class="px-6 py-4">
        <div class="flex items-center gap-3">
          ${p.img
            ? `<img src="${p.img}" class="w-10 h-10 rounded-xl object-cover border border-zinc-100 shrink-0" onerror="this.style.display='none';this.nextSibling.style.display='flex'" /><div style="display:none" class="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-lg shrink-0">${p.emoji||'📦'}</div>`
            : `<div class="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-lg shrink-0">${p.emoji||'📦'}</div>`}
          <div class="font-semibold text-sm">${p.name}</div>
        </div>
      </td>
      <td class="px-4 py-4 text-sm text-zinc-600">${p.category}</td>
      <td class="px-4 py-4 text-sm text-zinc-500">${p.fandom||'—'}</td>
      <td class="px-4 py-4 text-sm font-bold">L ${p.price}</td>
      <td class="px-4 py-4">
        <button onclick="toggleStock(${p.id})"
          class="text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${p.stock !== false ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}">
          ${p.stock !== false ? 'Disponible' : 'Agotado'}
        </button>
      </td>
    </tr>`).join('');
}

function filterCat(cat) {
  currentFilter = cat;
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.remove('bg-zinc-900','text-white');
    b.classList.add('bg-zinc-100','text-zinc-600');
  });
  const btn = document.getElementById('filter-' + (cat === 'all' ? 'all' : cat));
  if (btn) { btn.classList.add('bg-zinc-900','text-white'); btn.classList.remove('bg-zinc-100','text-zinc-600'); }
  renderTable();
}

function toggleStock(id) {
  const products = getProducts();
  const p = products.find(x => x.id === id);
  if (p) { p.stock = p.stock === false ? true : false; saveProducts(products); renderAll(); }
}

// ─── Orders UI ───────────────────────────────────────────────────────────────
function updatePendingBadge() {
  const n = getOrders().filter(o => o.status === 'pendiente').length;
  const badge = document.getElementById('pending-count-badge');
  badge.textContent = n;
  badge.classList.toggle('hidden', n === 0);
}

function setOrdersFilter(filter) {
  ordersFilter = filter;
  document.querySelectorAll('.order-filter-btn').forEach(b => {
    b.classList.remove('bg-zinc-900','text-white');
    b.classList.add('bg-zinc-100','text-zinc-600');
  });
  const btn = document.getElementById('ofilter-' + filter);
  if (btn) { btn.classList.add('bg-zinc-900','text-white'); btn.classList.remove('bg-zinc-100','text-zinc-600'); }
  renderOrders();
}

function renderOrders() {
  const me       = getMyUsername();
  const all      = getOrders();
  const filtered = ordersFilter === 'all' ? all : all.filter(o => o.status === ordersFilter);
  const list     = document.getElementById('orders-list');
  const empty    = document.getElementById('orders-empty');
  if (!filtered.length) { list.innerHTML = ''; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');

  const statusMap = {
    pendiente: { label:'Pendiente', cls:'bg-yellow-100 text-yellow-700' },
    entregado: { label:'Entregado', cls:'bg-teal-100 text-teal-700'     },
    cancelado: { label:'Cancelado', cls:'bg-red-100 text-red-600'       },
  };

  list.innerHTML = filtered.map(o => {
    const sc        = statusMap[o.status] || statusMap.pendiente;
    const zonaLabel = o.zone === 'tgu' ? 'Dentro de TGU' : 'Fuera de TGU';
    const pagoLabel = o.payment === 'contraentrega' ? 'Contra entrega' : 'Transferencia';
    const approx    = o.zone !== 'tgu' ? ' (aprox.)' : '';
    const isMine    = o.vendedor && o.vendedor === me;
    const isOthers  = o.vendedor && o.vendedor !== me;

    // Píldora de asignación
    const assignBadge = isMine
      ? `<span class="text-xs font-semibold bg-teal-100 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full">📌 Tuyo</span>`
      : isOthers
        ? `<span class="text-xs font-semibold bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full">👤 ${esc(o.vendedor)}</span>`
        : `<span class="text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full">Sin asignar</span>`;

    // Botón "Tomar pedido" solo si no está asignado y está pendiente
    const takeBtn = (!o.vendedor && o.status === 'pendiente')
      ? `<button data-order-id="${o.id}" onclick="takeOrder(this.dataset.orderId)"
           class="w-full bg-zinc-900 hover:bg-zinc-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
           <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12"/></svg>
           Tomar pedido
         </button>`
      : '';

    const canDeliver = !!o.vendedor; // requiere que alguien haya tomado el pedido
    const actions = o.status === 'pendiente'
      ? `<div class="space-y-2">
           ${takeBtn}
           <div class="flex gap-2">
             <button data-order-id="${o.id}" onclick="updateOrderStatus(Number(this.dataset.orderId),'entregado')"
               ${canDeliver ? '' : 'disabled title="Tomá el pedido primero"'}
               class="flex-1 text-xs font-bold py-2.5 rounded-xl transition-colors ${canDeliver ? 'bg-teal-500 hover:bg-teal-600 text-white' : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'}">Marcar entregado</button>
             <button data-order-id="${o.id}" onclick="updateOrderStatus(Number(this.dataset.orderId),'cancelado')" class="px-4 border border-zinc-200 hover:bg-red-50 hover:border-red-200 hover:text-red-500 text-zinc-500 text-xs font-semibold py-2.5 rounded-xl transition-colors">Cancelar</button>
           </div>
         </div>`
      : `<button data-order-id="${o.id}" onclick="updateOrderStatus(Number(this.dataset.orderId),'pendiente')" class="w-full text-xs text-zinc-400 hover:text-zinc-600 transition-colors py-1 text-center">Restaurar como pendiente</button>`;

    return `
      <div class="bg-white rounded-2xl border ${isMine ? 'border-teal-200' : 'border-zinc-200'} p-5 space-y-4">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <span class="text-xs text-zinc-400 font-mono">#${String(o.orderNum).padStart(3,'0')} &middot; ${esc(o.date)}</span>
              ${assignBadge}
            </div>
            <div class="font-bold text-base">${esc(o.customer.name)}</div>
            <div class="text-sm text-zinc-500 mt-0.5">${esc(o.customer.phone)}</div>
            <div class="text-sm text-zinc-400">${esc(o.customer.address)}</div>
          </div>
          <span class="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${sc.cls}">${sc.label}</span>
        </div>
        <div class="border-t border-zinc-50 pt-3 space-y-1.5">
          ${o.items.map(i => `<div class="flex justify-between text-sm"><span class="text-zinc-600">${esc(String(i.qty))}x ${esc(i.name)}</span><span class="font-medium">L ${Number(i.price) * Number(i.qty)}</span></div>`).join('')}
        </div>
        <div class="border-t border-zinc-100 pt-3 space-y-1 text-sm">
          <div class="flex justify-between text-zinc-400"><span>Envío (${zonaLabel})</span><span>L ${o.shipping}</span></div>
          <div class="flex justify-between font-bold"><span>Total</span><span>L ${o.total}${approx}</span></div>
          <div class="text-xs text-zinc-400 pt-0.5">Pago: ${pagoLabel}</div>
        </div>
        ${actions}
      </div>`;
  }).join('');
}

async function takeOrder(idRaw) {
  const id  = Number(idRaw);
  const o   = _orders.find(x => x.id === id);
  if (!o || o.vendedor) return; // ya asignado
  const me  = getMyUsername();
  o.vendedor = me; // optimistic
  renderStats(); renderOrders(); updatePendingBadge();
  try {
    const r = await authFetch(API + '/orders/' + id, { method:'PATCH', body:JSON.stringify({ action:'tomar' }) });
    if (!r || !r.ok) {
      o.vendedor = undefined; // revertir
      renderStats(); renderOrders(); updatePendingBadge();
      showToast('No se pudo tomar el pedido', false);
    } else {
      showToast('Pedido asignado a ti ✓');
    }
  } catch(e) {
    o.vendedor = undefined;
    renderStats(); renderOrders(); updatePendingBadge();
    showToast('Error de conexión', false);
  }
}

function updateOrderStatus(id, status) {
  const o = _orders.find(x => x.id === id);
  if (o) o.status = status;
  authFetch(API + '/orders/' + id, { method:'PATCH', body:JSON.stringify({ status }) }).catch(console.error);
  renderStats(); renderOrders(); updatePendingBadge();
}

// ─── Manual Order Modal ───────────────────────────────────────────────────────
let omItems = [], omZone = 'tgu', omPayment = 'contraentrega';

function openOrderModal() {
  omItems = []; omZone = 'tgu'; omPayment = 'contraentrega';
  document.getElementById('om-name').value = '';
  document.getElementById('om-phone').value = '';
  document.getElementById('om-address').value = '';
  document.getElementById('om-qty').value = '1';
  document.getElementById('om-error').classList.add('hidden');
  const products = getProducts().filter(p => p.active && p.stock !== false);
  document.getElementById('om-product-select').innerHTML = products.map(p =>
    `<option value="${p.id}">L ${p.price} — ${p.name}</option>`).join('');
  setOmZone('tgu'); setOmPayment('contraentrega'); renderOmItems();
  document.getElementById('order-modal-overlay').classList.remove('hidden');
}

function closeOrderModal() { document.getElementById('order-modal-overlay').classList.add('hidden'); }

function setOmZone(zone) {
  omZone = zone;
  const active = 'text-sm font-semibold py-2.5 rounded-xl border-2 border-teal-500 bg-teal-50 text-teal-700 transition-all';
  const idle   = 'text-sm font-semibold py-2.5 rounded-xl border-2 border-zinc-200 text-zinc-500 transition-all';
  document.getElementById('om-btn-tgu').className   = zone === 'tgu'   ? active : idle;
  document.getElementById('om-btn-fuera').className = zone === 'fuera' ? active : idle;
  renderOmSummary();
}

function setOmPayment(method) {
  omPayment = method;
  const active = 'text-sm font-semibold py-2.5 rounded-xl border-2 border-teal-500 bg-teal-50 text-teal-700 transition-all';
  const idle   = 'text-sm font-semibold py-2.5 rounded-xl border-2 border-zinc-200 text-zinc-500 transition-all';
  document.getElementById('om-btn-contra').className = method === 'contraentrega' ? active : idle;
  document.getElementById('om-btn-trans').className  = method === 'transferencia'  ? active : idle;
}

function addOrderItem() {
  const sel = document.getElementById('om-product-select');
  const id  = Number(sel.value);
  const qty = Math.max(1, parseInt(document.getElementById('om-qty').value) || 1);
  if (!id) return;
  const product = getProducts().find(p => p.id === id);
  if (!product) return;
  const existing = omItems.find(x => x.id === id);
  if (existing) { existing.qty += qty; } else { omItems.push({ id, name: product.name, qty, price: product.price }); }
  document.getElementById('om-qty').value = '1';
  renderOmItems();
}

function removeOmItem(id) { omItems = omItems.filter(x => x.id !== id); renderOmItems(); }

function renderOmItems() {
  const list = document.getElementById('om-items-list');
  const empty = document.getElementById('om-items-empty');
  if (!omItems.length) { list.innerHTML = ''; empty.classList.remove('hidden'); document.getElementById('om-summary').classList.add('hidden'); return; }
  empty.classList.add('hidden');
  list.innerHTML = omItems.map(item => `
    <div class="flex items-center justify-between bg-zinc-50 rounded-xl px-3 py-2.5 gap-2">
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <span class="text-sm font-semibold w-6 text-center text-teal-700">${item.qty}x</span>
        <span class="text-sm text-zinc-700 truncate">${item.name}</span>
      </div>
      <div class="flex items-center gap-3 shrink-0">
        <span class="text-sm font-bold">L ${item.price * item.qty}</span>
        <button onclick="removeOmItem(${item.id})" class="text-zinc-300 hover:text-red-400 transition-colors text-lg leading-none">&times;</button>
      </div>
    </div>`).join('');
  renderOmSummary();
}

function renderOmSummary() {
  if (!omItems.length) { document.getElementById('om-summary').classList.add('hidden'); return; }
  const subtotal = omItems.reduce((s, x) => s + x.price * x.qty, 0);
  const shipping = omZone === 'tgu' ? 70 : 90;
  document.getElementById('om-subtotal').textContent       = 'L ' + subtotal;
  document.getElementById('om-shipping-label').textContent = omZone === 'tgu' ? 'L 70' : 'L 90–120';
  document.getElementById('om-total').textContent          = 'L ' + (subtotal + shipping) + (omZone !== 'tgu' ? ' (aprox.)' : '');
  document.getElementById('om-summary').classList.remove('hidden');
}

function saveManualOrder() {
  const name    = document.getElementById('om-name').value.trim();
  const phone   = document.getElementById('om-phone').value.trim();
  const address = document.getElementById('om-address').value.trim();
  const errEl   = document.getElementById('om-error');
  if (!name)          { errEl.textContent = 'El nombre es obligatorio.';    errEl.classList.remove('hidden'); return; }
  if (!phone)         { errEl.textContent = 'El teléfono es obligatorio.';  errEl.classList.remove('hidden'); return; }
  if (!address)       { errEl.textContent = 'La dirección es obligatoria.'; errEl.classList.remove('hidden'); return; }
  if (!omItems.length){ errEl.textContent = 'Agregá al menos un producto.'; errEl.classList.remove('hidden'); return; }
  errEl.classList.add('hidden');
  const subtotal = omItems.reduce((s, x) => s + x.price * x.qty, 0);
  const shipping = omZone === 'tgu' ? 70 : 90;
  const order = {
    id: Date.now(), orderNum: _orders.length + 1,
    date: new Date().toLocaleString('es-HN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }),
    customer: { name, phone, address },
    items: omItems.map(x => ({ id: x.id, name: x.name, qty: x.qty, price: x.price })),
    subtotal, shipping, total: subtotal + shipping, zone: omZone, payment: omPayment, status: 'pendiente',
  };
  _orders.unshift(order);
  authFetch(API + '/orders', { method:'POST', body:JSON.stringify(order) }).catch(console.error);
  closeOrderModal(); renderStats(); renderOrders(); updatePendingBadge();
}

// ─── Add Product Modal ────────────────────────────────────────────────────────
const AP_CATEGORIES = ['Llavero','Lámpara','Decoración','Figura','Set','Otro'];

function openAddProductModal() {
  document.getElementById('ap-name').value     = '';
  document.getElementById('ap-price').value    = '';
  document.getElementById('ap-fandom').value   = '';
  document.getElementById('ap-emoji').value    = '';
  document.getElementById('ap-desc').value     = '';
  document.getElementById('ap-img').value      = '';
  document.getElementById('ap-category').value = 'Otro';
  document.getElementById('ap-error').classList.add('hidden');
  document.getElementById('ap-modal-overlay').classList.remove('hidden');
  document.getElementById('ap-name').focus();
}

function closeAddProductModal() {
  document.getElementById('ap-modal-overlay').classList.add('hidden');
}

async function submitAddProduct() {
  const name     = document.getElementById('ap-name').value.trim();
  const price    = parseFloat(document.getElementById('ap-price').value);
  const category = document.getElementById('ap-category').value;
  const fandom   = document.getElementById('ap-fandom').value.trim();
  const emoji    = document.getElementById('ap-emoji').value.trim() || '📦';
  const desc     = document.getElementById('ap-desc').value.trim();
  const img      = document.getElementById('ap-img').value.trim();
  const errEl    = document.getElementById('ap-error');
  const btn      = document.getElementById('ap-submit-btn');

  if (!name)            { errEl.textContent = 'El nombre es obligatorio.';         errEl.classList.remove('hidden'); return; }
  if (!price || price <= 0) { errEl.textContent = 'El precio debe ser mayor a 0.'; errEl.classList.remove('hidden'); return; }
  errEl.classList.add('hidden');

  btn.disabled = true;
  btn.textContent = 'Guardando…';

  try {
    const r = await authFetch(API + '/products', {
      method: 'POST',
      body: JSON.stringify({ name, price, category, fandom, emoji, desc, img }),
    });
    const data = await r?.json();
    if (!r || !r.ok) {
      errEl.textContent = data?.error || 'Error al guardar.';
      errEl.classList.remove('hidden');
      return;
    }
    if (data?.product) _products.push(data.product);
    closeAddProductModal();
    renderAll();
    showToast('Producto agregado ✓');
  } catch(e) {
    console.error('addProduct:', e);
    errEl.textContent = 'Error de conexión. Intentá de nuevo.';
    errEl.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Guardar producto';
  }
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
loadData().then(renderAll);
