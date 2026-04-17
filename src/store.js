import './style.css';

const API = 'https://aq2rjel5xpc6kxux6u3lgg7p5q0fenmn.lambda-url.us-east-2.on.aws';

const DEFAULT_PRODUCTS_LIST = [
  { id:1,  name:'Llavero Cubone',             category:'Llavero',   fandom:'Pokémon',       price:150, emoji:'🔑',  img:'assets/cubone-mochila.png',              badge:'',               dark:false, active:true },
  { id:2,  name:'Llavero Cubone Glow',         category:'Llavero',   fandom:'Pokémon',       price:180, emoji:'🔑',  img:'assets/cubone.jpg',                      badge:'',               dark:true,  active:true },
  { id:3,  name:'Llavero Hornet',              category:'Llavero',   fandom:'Hollow Knight', price:150, emoji:'🔑',  img:'assets/llavero-hornet.jpg',               badge:'',               dark:false, active:true },
  { id:4,  name:'Llavero Esqueleto Minecraft', category:'Llavero',   fandom:'Minecraft',     price:150, emoji:'💀',  img:'assets/llavero-esqueleto-minecraft.jpg',  badge:'',               dark:false, active:true },
  { id:5,  name:'Llavero Mandalorian',         category:'Llavero',   fandom:'Star Wars',     price:150, emoji:'⚔️', img:'assets/llavero-mandalorian.jpg',          badge:'',               dark:false, active:true },
  { id:6,  name:'Llaveros Star Wars',          category:'Llavero',   fandom:'Star Wars',     price:150, emoji:'⚔️', img:'assets/llaveros-star-wars.jpg',           badge:'',               dark:false, active:true },
  { id:7,  name:'Llaveros Sharingan',          category:'Llavero',   fandom:'Naruto',        price:150, emoji:'👁️', img:'assets/llaveros-sharingan.jpg',           badge:'',               dark:false, active:true },
  { id:8,  name:'Llavero Pokébola',            category:'Llavero',   fandom:'Pokémon',       price:150, emoji:'⚪🔴',img:'assets/llavero-pokebola.jpg',            badge:'',               dark:false, active:true },
  { id:9,  name:'Llavero Batarang',            category:'Llavero',   fandom:'DC / Batman',   price:150, emoji:'🦇',  img:'assets/Batarang.jpg',                    badge:'✨ Nuevo',        dark:false, active:true },
  { id:10, name:'Lámpara Minecraft',           category:'Lámpara',   fandom:'Minecraft',     price:350, emoji:'🕯️', img:'assets/lampara-minecraft.jpg',            badge:'🔥 Más vendido', dark:false, active:true },
  { id:11, name:'Lámpara Tanjiro Kamado',      category:'Lámpara',   fandom:'Demon Slayer',  price:350, emoji:'☀️',  img:'assets/lampara-tanjiro.jpg',              badge:'',               dark:false, active:true },
  { id:12, name:'Máscara Darth Vader',         category:'Decoración',fandom:'Star Wars',     price:280, emoji:'🪖',  img:'assets/mascara-darth-vader.jpg',          badge:'',               dark:false, active:true },
  { id:13, name:'Máscara The Mandalorian',     category:'Decoración',fandom:'Star Wars',     price:280, emoji:'⚔️', img:'assets/mandalorian-deco-pared.jpg',       badge:'',               dark:false, active:true },
  { id:14, name:'TIE Fighter (pared)',          category:'Decoración',fandom:'Star Wars',     price:280, emoji:'🚀',  img:'assets/tie-fighter-deco-pared.jpg',       badge:'',               dark:false, active:true },
  { id:15, name:'Perritos Minecraft',          category:'Figura',    fandom:'Minecraft',     price:200, emoji:'🐶',  img:'assets/perritos-minecraft.jpg',           badge:'',               dark:false, active:true },
  { id:16, name:'Máscara Obito Uchiha',        category:'Figura',    fandom:'Naruto',        price:250, emoji:'👺',  img:'assets/Obito.jpg',                        badge:'',               dark:false, active:true },
  { id:17, name:'TIE Fighter armable',         category:'Figura',    fandom:'Star Wars',     price:320, emoji:'🚀',  img:'assets/tie-fighter-armable.jpg',          badge:'',               dark:false, active:true },
  { id:18, name:'AT-ST Star Wars',             category:'Figura',    fandom:'Star Wars',     price:320, emoji:'🤖',  img:'assets/at-st-star-wars.jpg',              badge:'✨ Nuevo',        dark:false, active:true },
  { id:19, name:'Set Portavasos Star Wars',    category:'Set',       fandom:'Star Wars',     price:380, emoji:'🥤',  img:'assets/portavasos-star-wars.jpg',         badge:'',               dark:false, active:true },
];

let _productsCache = null;
async function getAllProducts() {
  if (_productsCache) return _productsCache;
  try {
    const r = await fetch(API + '/products');
    const data = await r.json();
    if (data.length) { _productsCache = data; return data; }
  } catch (e) {}
  return DEFAULT_PRODUCTS_LIST;
}

let PRODUCTS = {};
async function rebuildProductMap() {
  PRODUCTS = {};
  (await getAllProducts()).filter(p => p.active).forEach(p => {
    PRODUCTS[p.id] = { name: p.name, price: p.price, img: p.img, cat: p.category, emoji: p.emoji };
  });
}

// ── Render catálogo dinámico ─────────────────────────────────────────────
const CAT_META = {
  'Llavero':    { icon: '🔑', label: 'Llaveros',           cols: 'sm:grid-cols-2 lg:grid-cols-4', pad: 'p-4', titleSize: 'text-base' },
  'Lámpara':    { icon: '🕯️', label: 'Lámparas',           cols: 'sm:grid-cols-2 lg:grid-cols-3', pad: 'p-5', titleSize: 'text-lg'   },
  'Decoración': { icon: '🖼️', label: 'Decoración de pared', cols: 'sm:grid-cols-2 lg:grid-cols-3', pad: 'p-5', titleSize: 'text-lg'   },
  'Figura':     { icon: '🎭', label: 'Figuras y más',       cols: 'sm:grid-cols-2 lg:grid-cols-4', pad: 'p-4', titleSize: 'text-base' },
  'Set':        { icon: '📦', label: 'Sets',                cols: 'sm:grid-cols-2 lg:grid-cols-3', pad: 'p-5', titleSize: 'text-lg'   },
};

function plusIcon(size = 4) {
  return `<svg class="w-${size} h-${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>`;
}

function renderProductCard(p, meta) {
  const dark      = p.dark;
  const bg        = dark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-100';
  const txtColor  = dark ? 'text-white'    : 'text-zinc-900';
  const subColor  = dark ? 'text-zinc-500' : 'text-zinc-400';
  const btnHover  = dark ? 'hover:bg-mint-400' : 'hover:bg-mint-600';
  const padSmall  = meta.titleSize === 'text-base';

  const imgHtml = p.img
    ? `<img src="${p.img}" alt="${p.name}" class="card-img w-full h-full object-cover${dark ? ' opacity-90' : ''}" />`
    : `<div class="w-full h-full no-img flex items-center justify-center" style="font-size:${padSmall ? '3rem' : '3.75rem'}">${p.emoji || '📦'}</div>`;

  const agotado    = p.stock === false;
  const badgeHtml  = agotado
    ? `<div class="absolute top-3 left-3 z-10"><span class="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">Agotado</span></div>`
    : p.badge
      ? `<div class="absolute top-3 left-3 z-10"><span class="bg-zinc-900/90 text-white text-xs font-bold px-3 py-1.5 rounded-full">${p.badge}</span></div>`
      : '';

  const btnSize  = padSmall ? 'text-xs px-3 py-1.5 rounded-lg gap-1' : 'text-sm px-4 py-2 rounded-xl gap-1.5';
  const priceSize = padSmall ? '' : 'text-xl';

  const addBtn = agotado
    ? `<button disabled class="font-bold bg-zinc-200 text-zinc-400 cursor-not-allowed ${btnSize} flex items-center">Agotado</button>`
    : `<button onclick="addToCart(${p.id})" class="font-bold bg-mint-500 ${btnHover} text-white ${btnSize} transition-colors flex items-center">${plusIcon(padSmall ? 3 : 4)} Agregar</button>`;

  return `
    <div class="product-card ${bg} rounded-3xl overflow-hidden border relative${agotado ? ' opacity-60' : ''}">
      <div class="aspect-square overflow-hidden ${!p.img ? '' : (dark ? 'bg-zinc-900' : 'bg-zinc-50')}">
        ${badgeHtml}
        ${imgHtml}
      </div>
      <div class="${meta.pad}">
        <p class="text-xs ${subColor}">${p.fandom || ''}</p>
        <h3 class="font-bold ${meta.titleSize} ${txtColor} leading-tight mt-0.5">${p.name}</h3>
        <div class="mt-3 flex items-center justify-between">
          <span class="font-black ${priceSize} ${txtColor}">L ${p.price}</span>
          ${addBtn}
        </div>
      </div>
    </div>`;
}

let activeFilter = '*';
let activeSearch  = '';

function setFilter(fandom) {
  activeFilter = fandom;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('onclick').includes(`'${fandom}'`));
  });
  renderCatalog();
}

function setSearch(val) {
  activeSearch = val.toLowerCase().trim();
  renderCatalog();
}

async function renderCatalog() {
  const root = document.getElementById('products-root');
  if (!root) return;
  let products = (await getAllProducts()).filter(p => p.active);
  if (activeFilter !== '*') products = products.filter(p => p.fandom === activeFilter);
  if (activeSearch) products = products.filter(p =>
    p.name.toLowerCase().includes(activeSearch) ||
    (p.fandom || '').toLowerCase().includes(activeSearch)
  );
  const cats = Object.keys(CAT_META).filter(cat => products.some(p => p.category === cat));

  root.innerHTML = cats.length ? cats.map((cat, i) => {
    const meta  = CAT_META[cat];
    const items = products.filter(p => p.category === cat);
    const mb    = i < cats.length - 1 ? 'mb-16' : '';
    return `
      <div class="${mb}">
        <div class="mb-8">
          <span class="text-mint-600 text-xs font-semibold uppercase tracking-widest">Categoría</span>
          <h2 class="mt-1 text-2xl font-black tracking-tight">${meta.icon} ${meta.label}</h2>
        </div>
        <div class="grid gap-5 ${meta.cols}">
          ${items.map(p => renderProductCard(p, meta)).join('')}
        </div>
      </div>`;
  }).join('') : `<p class="text-zinc-400 text-center py-16">No hay productos en este fandom aún.</p>`;

  rebuildProductMap();
  initFadeUp();
}

function initFadeUp() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 60);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.product-card').forEach(el => {
    el.classList.add('fade-up');
    observer.observe(el);
  });
}

async function renderHero() {
  const wrap = document.getElementById('hero-product-wrap');
  if (!wrap) return;
  const allP = await getAllProducts();
  const star = allP.find(p => p.active && p.badge && p.badge.includes('Más vendido'))
            || allP.find(p => p.active);
  if (!star) return;
  wrap.innerHTML = `
    <div class="relative">
      <div class="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-mint-200 to-mint-400 blur-2xl opacity-30 scale-110"></div>
      <div class="float relative w-72 sm:w-80 aspect-square rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-white/80">
        ${star.img
          ? `<img src="${star.img}" alt="${star.name}" class="w-full h-full object-cover" />`
          : `<div class="w-full h-full no-img flex items-center justify-center text-7xl">${star.emoji || '📦'}</div>`}
        <div class="absolute bottom-4 left-4 right-4">
          <div class="bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg flex items-center justify-between">
            <div>
              <div class="font-bold text-sm text-zinc-900">${star.name}</div>
              <div class="text-xs text-zinc-500 mt-0.5">${star.fandom} · ${star.category}</div>
            </div>
            <div class="text-mint-600 font-black text-sm">L ${star.price}</div>
          </div>
        </div>
      </div>
      <div class="absolute -top-3 -right-3 bg-zinc-900 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">Más vendido 🔥</div>
    </div>`;
}

// ── Carrito ──────────────────────────────────────────────────────────────
let cart             = JSON.parse(localStorage.getItem('alera_cart') || '{}');
let deliveryZone     = 'tgu';
let deliveryPayment  = 'contraentrega';
let deliveryFormOpen = true;

function saveCart() {
  localStorage.setItem('alera_cart', JSON.stringify(cart));
}

function toggleDeliveryForm() {
  deliveryFormOpen = !deliveryFormOpen;
  document.getElementById('delivery-form-body').style.display  = deliveryFormOpen ? '' : 'none';
  document.getElementById('delivery-chevron').style.transform  = deliveryFormOpen ? 'rotate(180deg)' : 'rotate(0deg)';
}

function openCart() {
  document.getElementById('cart-drawer').classList.add('open');
  const bd = document.getElementById('cart-backdrop');
  bd.classList.remove('pointer-events-none', 'opacity-0');
  bd.classList.add('opacity-100');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cart-drawer').classList.remove('open');
  const bd = document.getElementById('cart-backdrop');
  bd.classList.add('pointer-events-none', 'opacity-0');
  bd.classList.remove('opacity-100');
  document.body.style.overflow = '';
}

function showCartToast(msg) {
  const existing = document.getElementById('cart-toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.id = 'cart-toast';
  t.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] bg-zinc-900 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 transition-all';
  t.innerHTML = `<svg class="w-4 h-4 text-mint-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>${msg}`;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 2000);
}

function addToCart(id) {
  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  renderCart();
  showCartToast('Agregado al carrito');
  const badge = document.getElementById('cart-badge');
  badge.classList.remove('pop');
  void badge.offsetWidth;
  badge.classList.add('pop');
}

function changeQty(id, delta) {
  cart[id] = (cart[id] || 0) + delta;
  if (cart[id] <= 0) delete cart[id];
  saveCart();
  renderCart();
}

function removeItem(id) {
  delete cart[id];
  saveCart();
  renderCart();
}

function renderCart() {
  const ids   = Object.keys(cart).map(Number);
  const total = ids.reduce((s, id) => s + PRODUCTS[id].price * cart[id], 0);
  const count = ids.reduce((s, id) => s + cart[id], 0);

  const badge = document.getElementById('cart-badge');
  if (count > 0) {
    badge.textContent = count;
    badge.classList.remove('hidden');
    badge.classList.add('flex');
  } else {
    badge.classList.add('hidden');
    badge.classList.remove('flex');
  }

  document.getElementById('cart-empty').style.display = ids.length ? 'none' : 'flex';
  document.getElementById('cart-footer').classList.toggle('hidden', ids.length === 0);
  updateCartTotal(total);

  const container = document.getElementById('cart-items');
  container.querySelectorAll('.cart-item').forEach(el => el.remove());

  ids.forEach(id => {
    const p   = PRODUCTS[id];
    const qty = cart[id];
    const div = document.createElement('div');
    div.className = 'cart-item flex gap-3 items-center';
    const imgHtml = p.img
      ? `<img src="${p.img}" class="w-16 h-16 rounded-2xl object-cover shrink-0 border border-zinc-100" />`
      : `<div class="w-16 h-16 rounded-2xl shrink-0 bg-zinc-100 flex items-center justify-center text-2xl">${p.cat === 'Llavero' ? '🔑' : p.cat === 'Lámpara' ? '🕯️' : '🎭'}</div>`;
    div.innerHTML = `
      ${imgHtml}
      <div class="flex-1 min-w-0">
        <div class="font-semibold text-sm truncate">${p.name}</div>
        <div class="text-zinc-400 text-xs mt-0.5">L ${p.price} c/u</div>
        <div class="flex items-center gap-2 mt-2">
          <button onclick="changeQty(${id},-1)" class="w-7 h-7 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-sm font-bold transition-colors">−</button>
          <span class="text-sm font-semibold w-5 text-center">${qty}</span>
          <button onclick="changeQty(${id},1)"  class="w-7 h-7 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-sm font-bold transition-colors">+</button>
        </div>
      </div>
      <div class="flex flex-col items-end gap-2 shrink-0">
        <button onclick="removeItem(${id})" class="text-zinc-300 hover:text-zinc-500 transition-colors">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
        <span class="font-bold text-sm">L ${p.price * qty}</span>
      </div>`;
    container.appendChild(div);
  });
}

function updateCartTotal(subtotal) {
  const envio = deliveryZone === 'tgu' ? 70 : 90;
  const ids   = Object.keys(cart).map(Number);
  const sub   = subtotal !== undefined ? subtotal : ids.reduce((s, id) => s + PRODUCTS[id].price * cart[id], 0);
  document.getElementById('cart-subtotal').textContent = 'L ' + sub;
  document.getElementById('cart-envio').textContent    = deliveryZone === 'tgu' ? 'L 70' : 'L 90-120';
  document.getElementById('cart-total').textContent    = 'L ' + (sub + envio);
}

function setZone(zone) {
  deliveryZone = zone;
  const isTgu = zone === 'tgu';
  document.getElementById('btn-tgu').className   = `zone-btn text-sm font-semibold py-2.5 rounded-xl border-2 transition-all ${isTgu  ? 'border-mint-500 bg-mint-50 text-mint-700' : 'border-zinc-200 text-zinc-500'}`;
  document.getElementById('btn-fuera').className = `zone-btn text-sm font-semibold py-2.5 rounded-xl border-2 transition-all ${!isTgu ? 'border-mint-500 bg-mint-50 text-mint-700' : 'border-zinc-200 text-zinc-500'}`;
  updateCartTotal();
}

function filterName(el) {
  el.value = el.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ ]/g, '');
  checkDeliveryForm();
}

function filterPhone(el) {
  el.value = el.value.replace(/[^0-9]/g, '');
  checkDeliveryForm();
}

function checkDeliveryForm() {
  const name    = document.getElementById('delivery-name').value.trim();
  const phone   = document.getElementById('delivery-phone').value.trim();
  const address = document.getElementById('delivery-address').value.trim();
  const hasImg  = deliveryPayment !== 'transferencia' || !!document.getElementById('transfer-file').files[0];
  const btn     = document.getElementById('checkout-btn');
  const ready   = name && phone && address && hasImg;
  btn.disabled  = !ready;
  btn.className = `w-full flex items-center justify-center gap-2.5 font-bold py-3.5 rounded-xl transition-all text-sm ${
    ready
      ? 'bg-mint-500 hover:bg-mint-600 text-white cursor-pointer'
      : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
  }`;
  if (!btn.textContent.includes('Enviando')) btn.textContent = 'Hacer pedido';
}

function setPayment(method) {
  deliveryPayment = method;
  const active = 'text-sm font-semibold py-2.5 rounded-xl border-2 border-mint-500 bg-mint-50 text-mint-700 transition-all';
  const idle   = 'text-sm font-semibold py-2.5 rounded-xl border-2 border-zinc-200 text-zinc-500 transition-all';
  document.getElementById('btn-contraentrega').className = `pay-btn ${method === 'contraentrega' ? active : idle}`;
  document.getElementById('btn-transferencia').className  = `pay-btn ${method === 'transferencia'  ? active : idle}`;
  document.getElementById('transfer-section').classList.toggle('hidden', method !== 'transferencia');
  checkDeliveryForm();
}

function onTransferFileChange() {
  const file  = document.getElementById('transfer-file').files[0];
  const label = document.getElementById('transfer-file-label');
  if (file) {
    const name = file.name.length > 26 ? file.name.substring(0, 23) + '...' : file.name;
    label.textContent = '✓ ' + name;
    label.classList.add('text-blue-700', 'font-semibold');
    label.classList.remove('text-blue-500');
  } else {
    label.textContent = 'Seleccionar imagen...';
    label.classList.remove('text-blue-700', 'font-semibold');
    label.classList.add('text-blue-500');
  }
  checkDeliveryForm();
}

function compressImage(file, maxSize, quality) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > h && w > maxSize) { h = Math.round(h * maxSize / w); w = maxSize; }
        else if (h > maxSize)     { w = Math.round(w * maxSize / h); h = maxSize; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

let _lastOrderTs = 0;

async function submitOrder() {
  const name    = document.getElementById('delivery-name').value.trim();
  const phone   = document.getElementById('delivery-phone').value.trim();
  const address = document.getElementById('delivery-address').value.trim();
  if (!name || !phone || !address) return;

  // Anti-spam: máximo 1 pedido cada 30 segundos
  const now = Date.now();
  if (now - _lastOrderTs < 30000) {
    alert('Por favor esperá unos segundos antes de enviar otro pedido.');
    return;
  }

  // Validar longitudes máximas
  if (name.length > 80 || phone.length > 15 || address.length > 150) {
    alert('Uno de los campos excede el largo máximo permitido.');
    return;
  }

  const btn = document.getElementById('checkout-btn');
  btn.disabled    = true;
  btn.className   = 'w-full flex items-center justify-center gap-2.5 font-bold py-3.5 rounded-xl transition-all text-sm bg-zinc-200 text-zinc-400 cursor-not-allowed';
  btn.textContent = 'Enviando...';

  let transferImg = null;
  if (deliveryPayment === 'transferencia') {
    const file = document.getElementById('transfer-file').files[0];
    if (file) transferImg = await compressImage(file, 900, 0.75);
  }

  const envio      = deliveryZone === 'tgu' ? 70 : 90;
  const ids        = Object.keys(cart).map(Number);
  const subtotal   = ids.reduce((s, id) => s + PRODUCTS[id].price * cart[id], 0);
  const totalFinal = subtotal + envio;
  const orderId    = Date.now();

  const order = {
    id:       orderId,
    orderNum: (orderId % 9000) + 1,
    date:     new Date().toLocaleString('es-HN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }),
    customer: { name, phone, address },
    items:    ids.map(id => ({ id: Number(id), name: PRODUCTS[id].name, qty: cart[id], price: PRODUCTS[id].price })),
    subtotal,
    shipping: envio,
    total:    totalFinal,
    zone:     deliveryZone,
    payment:  deliveryPayment,
    status:   'pendiente',
  };
  if (transferImg) order.transferImg = transferImg;

  try {
    const res = await fetch(API + '/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    if (!res.ok) throw new Error('server_error');
    _lastOrderTs = Date.now();
    cart = {};
    saveCart();
    renderCart();
    document.getElementById('success-order-num').textContent = '#' + String(order.orderNum).padStart(3, '0');
    const sc = document.getElementById('cart-success');
    sc.classList.remove('hidden', 'translate-x-full');
    sc.classList.add('translate-x-0');
  } catch (e) {
    btn.disabled = false;
    checkDeliveryForm();
    // Mostrar error inline en lugar de alert
    const errEl = document.getElementById('checkout-error');
    if (errEl) {
      errEl.textContent = 'No se pudo enviar el pedido. Revisá tu conexión e intentá de nuevo.';
      errEl.classList.remove('hidden');
      setTimeout(() => errEl.classList.add('hidden'), 5000);
    }
  }
}

function resetCartSuccess() {
  const sc = document.getElementById('cart-success');
  sc.classList.add('hidden', 'translate-x-full');
  sc.classList.remove('translate-x-0');
  document.getElementById('delivery-name').value    = '';
  document.getElementById('delivery-phone').value   = '';
  document.getElementById('delivery-address').value = '';
  document.getElementById('transfer-file').value    = '';
  const lbl = document.getElementById('transfer-file-label');
  lbl.textContent = 'Seleccionar imagen...';
  lbl.classList.remove('text-blue-700', 'font-semibold');
  lbl.classList.add('text-blue-500');
  deliveryZone    = 'tgu';
  deliveryPayment = 'contraentrega';
  setZone('tgu');
  setPayment('contraentrega');
  checkDeliveryForm();
}

// ── Exponer al scope global para handlers inline en HTML ─────────────────
Object.assign(window, {
  openCart, closeCart,
  addToCart, changeQty, removeItem,
  setFilter, setSearch,
  setZone, setPayment,
  filterName, filterPhone,
  onTransferFileChange,
  toggleDeliveryForm,
  checkDeliveryForm,
  submitOrder,
  resetCartSuccess,
});

// ── Boot ─────────────────────────────────────────────────────────────────
renderHero();
rebuildProductMap().then(() => {
  renderCatalog();
  renderCart();
});
