// ─── Alera Redesign — Store logic ──────────────────────────────────────────
// Mantiene: Meta Pixel events, AWS Lambda endpoint, payload shape del backend,
// localStorage del carrito, filtros y render dinámico.

const DEFAULT_PRODUCTS_LIST = [
  { id:1,  name:'Llavero Cubone',             category:'Llavero',   fandom:'Pokémon',       price:150, img:'assets/cubone-mochila.png',                     badge:'',               dark:false, active:true },
  { id:2,  name:'Llavero Cubone Glow',         category:'Llavero',   fandom:'Pokémon',       price:180, img:'assets/cubone.jpg',                             badge:'',               dark:true,  active:true },
  { id:3,  name:'Llavero Hornet',              category:'Llavero',   fandom:'Hollow Knight', price:150, img:'assets/llavero-hornet.jpg',                     badge:'',               dark:false, active:true },
  { id:4,  name:'Llavero Esqueleto Minecraft', category:'Llavero',   fandom:'Minecraft',     price:150, img:'assets/llavero-esqueleto-minecraft.jpg',        badge:'',               dark:false, active:true },
  { id:5,  name:'Llavero Mandalorian',         category:'Llavero',   fandom:'Star Wars',     price:150, img:'assets/llavero-mandalorian.jpg',                badge:'',               dark:false, active:true },
  { id:6,  name:'Llaveros Star Wars',          category:'Llavero',   fandom:'Star Wars',     price:150, img:'assets/llaveros-star-wars.jpg',                 badge:'',               dark:false, active:true },
  { id:7,  name:'Llaveros Sharingan',          category:'Llavero',   fandom:'Naruto',        price:150, img:'assets/llaveros-sharingan.jpg',                 badge:'',               dark:false, active:true },
  { id:8,  name:'Llavero Pokébola',            category:'Llavero',   fandom:'Pokémon',       price:150, img:'assets/llavero-pokebola.jpg',                   badge:'',               dark:false, active:true },
  { id:9,  name:'Llavero Batarang',            category:'Llavero',   fandom:'DC / Batman',   price:150, img:'assets/Batarang.jpg',                           badge:'✨ Nuevo',        dark:false, active:true },
  { id:10, name:'Lámpara Minecraft',           category:'Lámpara',   fandom:'Minecraft',     price:350, img:'assets/lampara-minecraft.jpg',                  badge:'🔥 Más vendido', dark:false, active:true },
  { id:11, name:'Lámpara Tanjiro Kamado',      category:'Lámpara',   fandom:'Demon Slayer',  price:350, img:'assets/lampara-tanjiro.jpg',                    badge:'',               dark:false, active:true },
  { id:12, name:'Máscara Darth Vader',         category:'Decoración',fandom:'Star Wars',     price:280, img:'assets/mascara-darth-vader.jpg',                badge:'',               dark:false, active:true },
  { id:13, name:'Máscara The Mandalorian',     category:'Decoración',fandom:'Star Wars',     price:280, img:'assets/mandalorian-deco-pared.jpg',             badge:'',               dark:false, active:true },
  { id:14, name:'TIE Fighter (pared)',          category:'Decoración',fandom:'Star Wars',     price:280, img:'assets/tie-fighter-deco-pared.jpg',             badge:'',               dark:false, active:true },
  { id:15, name:'Perritos Minecraft',          category:'Figura',    fandom:'Minecraft',     price:200, img:'assets/perritos-minecraft.jpg',                 badge:'',               dark:false, active:true },
  { id:16, name:'Máscara Obito Uchiha',        category:'Figura',    fandom:'Naruto',        price:250, img:'assets/Obito.jpg',                              badge:'',               dark:false, active:true },
  { id:17, name:'TIE Fighter armable',         category:'Figura',    fandom:'Star Wars',     price:320, img:'assets/tie-fighter-armable.jpg',                badge:'',               dark:false, active:true },
  { id:18, name:'AT-ST Star Wars',             category:'Figura',    fandom:'Star Wars',     price:320, img:'assets/at-st-star-wars.jpg',                    badge:'✨ Nuevo',        dark:false, active:true },
  { id:19, name:'Set Portavasos Star Wars',    category:'Set',       fandom:'Star Wars',     price:380, img:'assets/portavasos-star-wars.jpg',               badge:'',               dark:false, active:true },
];

const API = 'https://aq2rjel5xpc6kxux6u3lgg7p5q0fenmn.lambda-url.us-east-2.on.aws';

// Fandom → visual theme
const FANDOM_META = {
  'Star Wars':     { color: '#111111',  grad: 'linear-gradient(135deg,#1e293b 0%,#0f172a 100%)' },
  'Minecraft':     { color: '#2a6f2a',  grad: 'linear-gradient(135deg,#4a7a2e 0%,#2a4f1a 100%)' },
  'Naruto':        { color: '#e87722',  grad: 'linear-gradient(135deg,#f97316 0%,#c2410c 100%)' },
  'Pokémon':       { color: '#dc2626',  grad: 'linear-gradient(135deg,#ef4444 0%,#991b1b 100%)' },
  'Demon Slayer':  { color: '#0ea5e9',  grad: 'linear-gradient(135deg,#38bdf8 0%,#0369a1 100%)' },
  'Hollow Knight': { color: '#334155',  grad: 'linear-gradient(135deg,#475569 0%,#1e293b 100%)' },
  'DC / Batman':   { color: '#1f1f1f',  grad: 'linear-gradient(135deg,#27272a 0%,#000000 100%)' },
};

const CAT_META = {
  'Llavero':    { label: 'Llaveros',           cols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4', compact: true },
  'Lámpara':    { label: 'Lámparas',           cols: 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3', compact: false },
  'Decoración': { label: 'Decoración de pared',cols: 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3', compact: false },
  'Figura':     { label: 'Figuras',            cols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4', compact: true },
  'Set':        { label: 'Sets',               cols: 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3', compact: false },
};

// ─── Pixel helper ────────────────────────────────────────────────────────
function aleraTrack(eventName, params) {
  try {
    if (typeof fbq === 'function'
        && window.ALERA_META_PIXEL_ID
        && window.ALERA_META_PIXEL_ID !== 'REPLACE_WITH_YOUR_PIXEL_ID') {
      fbq('track', eventName, params || {});
    }
  } catch (e) { console.warn('[Alera] Pixel track failed:', eventName, e); }
}

let _productsCache = null;
async function getAllProducts() {
  if (_productsCache) return _productsCache;
  try {
    const r = await fetch(API + '/products');
    const data = await r.json();
    if (data.length) {
      const mapped = data.map(p => ({ ...p, img: p.img || '' }));
      _productsCache = mapped;
      return mapped;
    }
  } catch(e) {}
  return DEFAULT_PRODUCTS_LIST;
}

let PRODUCTS = {};
async function rebuildProductMap() {
  PRODUCTS = {};
  (await getAllProducts()).filter(p => p.active).forEach(p => {
    PRODUCTS[p.id] = { name: p.name, price: p.price, img: p.img, cat: p.category, fandom: p.fandom };
  });
}

// ─── Renderers ──────────────────────────────────────────────────────────

function productImgOrPlaceholder(p, dark) {
  if (p.img) {
    return `<img src="${p.img}" alt="${p.name}" class="card-img w-full h-full object-cover${dark?' opacity-90':''}" onerror="this.parentElement.innerHTML=productPlaceholder(${JSON.stringify(p.fandom||'')}, ${dark})" />`;
  }
  return productPlaceholder(p.fandom || '', dark);
}

function productPlaceholder(fandom, dark) {
  const cls = dark ? 'placeholder-stripes-dark text-zinc-500' : 'placeholder-stripes text-zinc-500';
  return `<div class="w-full h-full ${cls} flex items-end justify-start p-3">
    <div class="mono text-[10px] uppercase tracking-widest leading-tight">
      <div>// ${fandom || 'producto'}</div>
      <div class="opacity-60">· foto pendiente</div>
    </div>
  </div>`;
}

function plusIcon(size = 4) {
  return `<svg class="w-${size} h-${size}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>`;
}

function renderProductCard(p, compact) {
  const dark = p.dark;
  const bg = dark ? 'bg-zinc-950 border-zinc-900' : 'bg-white border-zinc-100';
  const txt = dark ? 'text-white' : 'text-zinc-900';
  const sub = dark ? 'text-zinc-500' : 'text-zinc-400';

  const agotado = p.stock === false;
  const badgeHtml = agotado
    ? `<span class="absolute top-3 left-3 z-10 bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Agotado</span>`
    : p.badge
      ? `<span class="absolute top-3 left-3 z-10 bg-zinc-900/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide">${p.badge}</span>`
      : '';

  const addBtnCompact = agotado
    ? `<button disabled class="w-8 h-8 rounded-full bg-zinc-100 text-zinc-400 cursor-not-allowed flex items-center justify-center shrink-0">—</button>`
    : `<button onclick="event.stopPropagation();addToCart(${p.id})" aria-label="Agregar" class="w-8 h-8 rounded-full btn-accent flex items-center justify-center shrink-0">${plusIcon(4)}</button>`;

  const addBtnFull = agotado
    ? `<button disabled class="font-bold text-sm bg-zinc-100 text-zinc-400 cursor-not-allowed px-4 py-2 rounded-xl flex items-center gap-1.5">Agotado</button>`
    : `<button onclick="event.stopPropagation();addToCart(${p.id})" class="font-bold text-sm btn-accent px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5">${plusIcon(4)} Agregar</button>`;

  if (compact) {
    return `
      <div class="product-card ${bg} rounded-2xl overflow-hidden border relative${agotado?' opacity-60':''}">
        <div class="aspect-square overflow-hidden relative ${dark?'bg-zinc-900':'bg-zinc-50'}">
          ${badgeHtml}
          ${productImgOrPlaceholder(p, dark)}
        </div>
        <div class="p-3">
          <p class="text-[10px] font-semibold uppercase tracking-wider ${sub} truncate">${p.fandom||''}</p>
          <h3 class="font-bold text-sm ${txt} leading-tight mt-0.5 truncate">${p.name}</h3>
          <div class="mt-2.5 flex items-center justify-between">
            <span class="font-black text-sm ${txt}">L ${p.price}</span>
            ${addBtnCompact}
          </div>
        </div>
      </div>`;
  }

  return `
    <div class="product-card ${bg} rounded-3xl overflow-hidden border relative${agotado?' opacity-60':''}">
      <div class="aspect-[4/5] sm:aspect-square overflow-hidden relative ${dark?'bg-zinc-900':'bg-zinc-50'}">
        ${badgeHtml}
        ${productImgOrPlaceholder(p, dark)}
      </div>
      <div class="p-4 sm:p-5">
        <p class="text-[10px] font-semibold uppercase tracking-wider ${sub}">${p.fandom||''}</p>
        <h3 class="font-bold text-base ${txt} leading-tight mt-0.5">${p.name}</h3>
        <div class="mt-3 flex items-center justify-between">
          <span class="font-black text-lg ${txt}">L ${p.price}</span>
          ${addBtnFull}
        </div>
      </div>
    </div>`;
}

let activeFilter = '*';
let activeSearch = '';

function setFilter(fandom) {
  activeFilter = fandom;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-f') === fandom);
  });
  renderCatalog();
  // Scroll a productos si viene de tile
  const el = document.getElementById('productos');
  if (el) el.scrollIntoView({behavior:'smooth', block:'start'});
}

function setSearch(v) { activeSearch = v.toLowerCase().trim(); renderCatalog(); }

async function renderFandomFilters() {
  const root = document.getElementById('fandom-filters');
  if (!root) return;
  const all = (await getAllProducts()).filter(p => p.active);
  const fandoms = [...new Set(all.map(p => p.fandom))];
  const counts = Object.fromEntries(fandoms.map(f => [f, all.filter(p => p.fandom === f).length]));
  root.innerHTML = [
    `<button data-f="*" class="filter-btn active shrink-0 border border-zinc-200 text-sm font-semibold px-4 py-2 rounded-full whitespace-nowrap" onclick="setFilter('*')">Todos <span class="fandom-count">${all.length}</span></button>`,
    ...fandoms.map(f =>
      `<button data-f="${f}" class="filter-btn shrink-0 border border-zinc-200 text-zinc-700 text-sm font-semibold px-4 py-2 rounded-full whitespace-nowrap" onclick="setFilter('${f}')">${f} <span class="fandom-count">${counts[f]}</span></button>`
    )
  ].join('');
}

async function renderFandomTiles() {
  const root = document.getElementById('fandom-tiles');
  if (!root) return;
  const all = (await getAllProducts()).filter(p => p.active);
  const fandoms = [...new Set(all.map(p => p.fandom))];
  const counts = Object.fromEntries(fandoms.map(f => [f, all.filter(p => p.fandom === f).length]));
  // preview image = first product with img
  const previewImg = f => (all.find(p => p.fandom === f && p.img) || {}).img || '';

  root.innerHTML = fandoms.map(f => {
    const meta = FANDOM_META[f] || { grad: 'linear-gradient(135deg,#52525b,#27272a)' };
    const img = previewImg(f);
    return `
      <button onclick="setFilter('${f}')" class="group relative overflow-hidden rounded-2xl aspect-[4/5] sm:aspect-square text-left transition-transform hover:-translate-y-1" style="background:${meta.grad}">
        ${img ? `<img src="${img}" class="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-110 transition-all duration-500" onerror="this.style.display='none'" />` : ''}
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
        <div class="absolute bottom-0 left-0 right-0 p-4">
          <div class="text-white/70 text-[10px] font-semibold uppercase tracking-widest">${counts[f]} producto${counts[f]>1?'s':''}</div>
          <div class="text-white font-black text-lg sm:text-xl leading-tight mt-0.5">${f}</div>
        </div>
        <div class="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
        </div>
      </button>`;
  }).join('');
}

async function renderCatalog() {
  const root = document.getElementById('products-root');
  if (!root) return;
  let products = (await getAllProducts()).filter(p => p.active);
  if (activeFilter !== '*') products = products.filter(p => p.fandom === activeFilter);
  if (activeSearch) products = products.filter(p =>
    p.name.toLowerCase().includes(activeSearch) ||
    (p.fandom||'').toLowerCase().includes(activeSearch)
  );
  const cats = Object.keys(CAT_META).filter(c => products.some(p => p.category === c));

  if (!cats.length) {
    root.innerHTML = `
      <div class="text-center py-20">
        <div class="inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-4 placeholder-stripes"></div>
        <p class="text-zinc-700 font-semibold">No encontramos coincidencias</p>
        <p class="text-zinc-400 text-sm mt-1">Probá con otro fandom o buscá por nombre.</p>
        <button onclick="setFilter('*');document.getElementById('search-input').value='';setSearch('')" class="mt-4 text-sm font-semibold underline" style="color:var(--accent-600)">Ver todos los productos</button>
      </div>`;
    return;
  }

  root.innerHTML = cats.map((cat, i) => {
    const meta = CAT_META[cat];
    const items = products.filter(p => p.category === cat);
    return `
      <div class="${i>0?'mt-14':''}">
        <div class="flex items-baseline justify-between mb-5">
          <h3 class="font-black text-xl tracking-tight">${meta.label}</h3>
          <span class="text-xs text-zinc-400 font-medium">${items.length} ${items.length===1?'pieza':'piezas'}</span>
        </div>
        <div class="grid gap-3 sm:gap-4 ${meta.cols}">
          ${items.map(p => renderProductCard(p, meta.compact)).join('')}
        </div>
      </div>`;
  }).join('');

  rebuildProductMap();
  initFadeUp();
}

function initFadeUp() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 40);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.product-card').forEach(el => {
    if (!el.classList.contains('fade-up')) {
      el.classList.add('fade-up');
      observer.observe(el);
    }
  });
}

// ─── Hero card ─────────────────────────────────────────────────────────
function heroCardHTML(star) {
  const imgHtml = star.img
    ? `<img src="${star.img}" alt="${star.name}" class="w-full h-full object-cover" />`
    : productPlaceholder(star.fandom||'', false);
  return `
    <div class="relative">
      <div class="relative aspect-[4/5] rounded-[28px] overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.2)] ring-1 ring-black/5">
        ${imgHtml}
        <div class="absolute bottom-4 left-4 right-4">
          <div class="bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg flex items-center justify-between gap-3">
            <div class="min-w-0">
              <div class="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 truncate">${star.fandom||''}</div>
              <div class="font-bold text-sm text-zinc-900 leading-tight truncate">${star.name}</div>
            </div>
            <button onclick="addToCart(${star.id})" class="btn-accent text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 shrink-0">
              L ${star.price} ${plusIcon(3)}
            </button>
          </div>
        </div>
      </div>
      <div class="absolute -top-3 -left-3 bg-zinc-950 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg tracking-wide">🔥 Más vendido</div>
      <!-- floating secondary card -->
      <div class="absolute -bottom-6 -right-4 sm:-right-8 w-32 aspect-square bg-white rounded-2xl shadow-xl border border-zinc-100 p-2 hidden sm:block rotate-6">
        <div class="w-full h-full placeholder-stripes rounded-xl flex items-end justify-start p-2">
          <div class="mono text-[9px] text-zinc-500 leading-none">// próximo<br/>drop</div>
        </div>
      </div>
    </div>`;
}

async function renderHero() {
  const wrap = document.getElementById('hero-product-wrap');
  if (!wrap) return;
  const all = await getAllProducts();
  const stars = all.filter(p => p.active && p.badge && p.badge.includes('Más vendido'));
  const pool = stars.length ? stars : all.filter(p => p.active);
  if (!pool.length) return;
  let idx = 0;
  wrap.innerHTML = heroCardHTML(pool[idx]);
  if (pool.length === 1) return;
  setInterval(() => {
    wrap.style.transition = 'opacity 0.4s ease';
    wrap.style.opacity = '0';
    setTimeout(() => {
      idx = (idx + 1) % pool.length;
      wrap.innerHTML = heroCardHTML(pool[idx]);
      wrap.style.opacity = '1';
    }, 400);
  }, 4500);
}

// ─── Cart state ────────────────────────────────────────────────────────
let cart = JSON.parse(localStorage.getItem('alera_cart') || '{}');
let deliveryZone = 'tgu';
let deliveryPayment = 'contraentrega';

function saveCart() { localStorage.setItem('alera_cart', JSON.stringify(cart)); }

function openCart() {
  document.getElementById('cart-drawer').classList.add('open');
  const bd = document.getElementById('cart-backdrop');
  bd.classList.remove('pointer-events-none','opacity-0');
  bd.classList.add('opacity-100');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  document.getElementById('cart-drawer').classList.remove('open');
  const bd = document.getElementById('cart-backdrop');
  bd.classList.add('pointer-events-none','opacity-0');
  bd.classList.remove('opacity-100');
  document.body.style.overflow = '';
  backToItems();
}

function goToCheckout() {
  document.getElementById('cart-step-items').classList.add('hidden');
  document.getElementById('cart-step-checkout').classList.remove('hidden');
  document.getElementById('cart-step-checkout').classList.add('flex');
  updateCheckoutSummary();
}
function backToItems() {
  document.getElementById('cart-step-items').classList.remove('hidden');
  document.getElementById('cart-step-items').classList.add('flex');
  document.getElementById('cart-step-checkout').classList.add('hidden');
  document.getElementById('cart-step-checkout').classList.remove('flex');
}

function showCartToast(msg) {
  const ex = document.getElementById('cart-toast');
  if (ex) ex.remove();
  const t = document.createElement('div');
  t.id = 'cart-toast';
  t.className = 'fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[70] bg-zinc-900 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2';
  t.innerHTML = `<svg class="w-4 h-4 shrink-0" style="color:var(--accent-400)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>${msg}`;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition='opacity 0.3s'; setTimeout(() => t.remove(), 300); }, 1800);
}

function addToCart(id) {
  cart[id] = (cart[id]||0) + 1;
  saveCart();
  renderCart();
  showCartToast('Agregado al carrito');
  const badge = document.getElementById('cart-badge');
  badge.classList.remove('pop');
  void badge.offsetWidth;
  badge.classList.add('pop');

  const p = PRODUCTS[id];
  if (p) {
    aleraTrack('AddToCart', {
      content_ids: [String(id)], content_name: p.name, content_type: 'product',
      currency: 'HNL', value: p.price,
    });
  }
}

function changeQty(id, delta) {
  cart[id] = (cart[id]||0) + delta;
  if (cart[id] <= 0) delete cart[id];
  saveCart();
  renderCart();
}
function removeItem(id) { delete cart[id]; saveCart(); renderCart(); }

function renderCart() {
  const ids = Object.keys(cart).map(Number).filter(id => PRODUCTS[id]);
  const count = ids.reduce((s,id) => s + cart[id], 0);
  const subtotal = ids.reduce((s,id) => s + PRODUCTS[id].price * cart[id], 0);

  const badge = document.getElementById('cart-badge');
  if (count > 0) {
    badge.textContent = count;
    badge.classList.remove('hidden');
    badge.classList.add('flex');
  } else {
    badge.classList.add('hidden');
    badge.classList.remove('flex');
  }

  // Mobile bar
  const mb = document.getElementById('mobile-bar');
  if (count > 0 && window.innerWidth < 768) {
    mb.classList.remove('hidden');
    mb.classList.add('flex');
    document.getElementById('mb-count').textContent = count + (count===1?' item':' items');
    document.getElementById('mb-total').textContent = subtotal;
  } else {
    mb.classList.add('hidden');
    mb.classList.remove('flex');
  }

  // Header subtitle
  const hs = document.getElementById('cart-header-sub');
  if (hs) hs.textContent = count === 0 ? 'Vacío' : count === 1 ? '1 artículo' : count + ' artículos';

  document.getElementById('cart-empty').style.display = ids.length ? 'none' : 'flex';
  document.getElementById('cart-footer').classList.toggle('hidden', ids.length === 0);

  // Bundle hint
  const bundle = document.getElementById('cart-bundle-hint');
  const hasLlavero = ids.some(id => PRODUCTS[id].cat === 'Llavero');
  const llaveroCount = ids.filter(id => PRODUCTS[id].cat === 'Llavero').reduce((s,id)=>s+cart[id],0);
  if (bundle) bundle.classList.toggle('hidden', !(hasLlavero && llaveroCount < 2 && ids.length > 0));

  // Subtotal/total
  const envio = deliveryZone === 'tgu' ? 70 : 90;
  document.getElementById('cart-subtotal').textContent = 'L ' + subtotal;
  document.getElementById('cart-envio').textContent = deliveryZone === 'tgu' ? 'L 70' : 'L 90–120';
  document.getElementById('cart-total').textContent = 'L ' + (subtotal + envio);

  // Items
  const container = document.getElementById('cart-items');
  container.querySelectorAll('.cart-item').forEach(el => el.remove());
  ids.forEach(id => {
    const p = PRODUCTS[id];
    const qty = cart[id];
    const div = document.createElement('div');
    div.className = 'cart-item flex gap-3 items-center';
    const imgHtml = p.img
      ? `<img src="${p.img}" class="w-16 h-16 rounded-2xl object-cover shrink-0 border border-zinc-100" onerror="this.outerHTML='<div class=\\'w-16 h-16 rounded-2xl shrink-0 placeholder-stripes\\'></div>'" />`
      : `<div class="w-16 h-16 rounded-2xl shrink-0 placeholder-stripes"></div>`;
    div.innerHTML = `
      ${imgHtml}
      <div class="flex-1 min-w-0">
        <div class="font-semibold text-sm truncate">${p.name}</div>
        <div class="text-zinc-400 text-xs mt-0.5">${p.fandom} · L ${p.price}</div>
        <div class="flex items-center gap-2 mt-2">
          <button onclick="changeQty(${id},-1)" class="w-7 h-7 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-sm font-bold transition-colors">−</button>
          <span class="text-sm font-semibold w-5 text-center">${qty}</span>
          <button onclick="changeQty(${id},1)" class="w-7 h-7 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-sm font-bold transition-colors">+</button>
        </div>
      </div>
      <div class="flex flex-col items-end gap-2 shrink-0">
        <button onclick="removeItem(${id})" class="text-zinc-300 hover:text-zinc-500 transition-colors" aria-label="Eliminar">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
        <span class="font-bold text-sm">L ${p.price * qty}</span>
      </div>`;
    container.appendChild(div);
  });

  updateCheckoutSummary();
}

function updateCheckoutSummary() {
  const ids = Object.keys(cart).map(Number).filter(id => PRODUCTS[id]);
  const count = ids.reduce((s,id) => s + cart[id], 0);
  const subtotal = ids.reduce((s,id) => s + PRODUCTS[id].price * cart[id], 0);
  const envio = deliveryZone === 'tgu' ? 70 : 90;
  const totalEl = document.getElementById('checkout-total');
  if (!totalEl) return;
  document.getElementById('checkout-items-label').textContent = count + (count===1?' artículo':' artículos');
  document.getElementById('checkout-subtotal').textContent = 'L ' + subtotal;
  document.getElementById('checkout-envio').textContent = deliveryZone === 'tgu' ? 'L 70' : 'L 90–120';
  totalEl.textContent = 'L ' + (subtotal + envio);
}

function setZone(zone) {
  deliveryZone = zone;
  const tgu = document.getElementById('btn-tgu');
  const fuera = document.getElementById('btn-fuera');
  const active = 'text-left text-sm font-semibold py-3 px-3.5 rounded-2xl border-2 transition-all';
  tgu.className = 'zone-btn ' + active;
  fuera.className = 'zone-btn ' + active + ' border-zinc-200 text-zinc-500';
  if (zone === 'tgu') {
    tgu.style.cssText = 'border-color:var(--accent-500);background:var(--accent-50);color:var(--accent-700)';
    fuera.style.cssText = '';
  } else {
    tgu.style.cssText = '';
    fuera.style.cssText = 'border-color:var(--accent-500);background:var(--accent-50);color:var(--accent-700)';
  }
  renderCart();
}

function filterName(el) { el.value = el.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ ]/g, ''); checkDeliveryForm(); }
function filterPhone(el) { el.value = el.value.replace(/[^0-9]/g, ''); checkDeliveryForm(); }

function checkDeliveryForm() {
  const name = document.getElementById('delivery-name').value.trim();
  const phone = document.getElementById('delivery-phone').value.trim();
  const address = document.getElementById('delivery-address').value.trim();
  const btn = document.getElementById('checkout-btn');
  const ready = name.length >= 2 && phone.length >= 6 && address.length >= 3;
  btn.disabled = !ready;
  btn.className = 'w-full flex items-center justify-center gap-2.5 font-bold py-3.5 rounded-2xl transition-all text-sm ' +
    (ready ? 'btn-accent cursor-pointer' : 'bg-zinc-200 text-zinc-400 cursor-not-allowed');
  if (!btn.textContent.includes('Enviando')) btn.textContent = 'Hacer pedido';
}

function setPayment(method) {
  deliveryPayment = method;
  const ce = document.getElementById('btn-contraentrega');
  const tr = document.getElementById('btn-transferencia');
  const base = 'pay-btn text-left text-sm font-semibold py-3 px-3.5 rounded-2xl border-2 transition-all';
  ce.className = base;
  tr.className = base + ' border-zinc-200 text-zinc-500';
  if (method === 'contraentrega') {
    ce.style.cssText = 'border-color:var(--accent-500);background:var(--accent-50);color:var(--accent-700)';
    tr.style.cssText = '';
  } else {
    ce.style.cssText = '';
    tr.style.cssText = 'border-color:var(--accent-500);background:var(--accent-50);color:var(--accent-700)';
  }
  document.getElementById('transfer-section').classList.toggle('hidden', method !== 'transferencia');
  checkDeliveryForm();
}

function onTransferFileChange() {
  const file = document.getElementById('transfer-file').files[0];
  const label = document.getElementById('transfer-file-label');
  if (file) {
    const name = file.name.length > 26 ? file.name.substring(0,23) + '...' : file.name;
    label.textContent = '✓ ' + name;
    label.classList.add('text-zinc-900','font-semibold');
    label.classList.remove('text-zinc-500');
  } else {
    label.textContent = 'Subir comprobante (opcional)';
    label.classList.remove('text-zinc-900','font-semibold');
    label.classList.add('text-zinc-500');
  }
  checkDeliveryForm();
}

function compressImage(file, maxSize, quality) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > h && w > maxSize) { h = Math.round(h*maxSize/w); w = maxSize; }
        else if (h > maxSize) { w = Math.round(w*maxSize/h); h = maxSize; }
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
  const name = document.getElementById('delivery-name').value.trim();
  const phone = document.getElementById('delivery-phone').value.trim();
  const address = document.getElementById('delivery-address').value.trim();
  if (!name || !phone || !address) return;
  const now = Date.now();
  if (now - _lastOrderTs < 30000) { alert('Por favor esperá unos segundos antes de enviar otro pedido.'); return; }
  if (name.length > 80 || phone.length > 15 || address.length > 150) { alert('Uno de los campos excede el largo máximo.'); return; }

  const btn = document.getElementById('checkout-btn');
  btn.disabled = true;
  btn.className = 'w-full flex items-center justify-center gap-2.5 font-bold py-3.5 rounded-2xl transition-all text-sm bg-zinc-200 text-zinc-400 cursor-not-allowed';
  btn.textContent = 'Enviando...';

  let transferImg = null;
  if (deliveryPayment === 'transferencia') {
    const file = document.getElementById('transfer-file').files[0];
    if (file) transferImg = await compressImage(file, 900, 0.75);
  }

  const envio = deliveryZone === 'tgu' ? 70 : 90;
  const ids = Object.keys(cart).map(Number).filter(id => PRODUCTS[id]);
  const subtotal = ids.reduce((s,id) => s + PRODUCTS[id].price * cart[id], 0);
  const totalFinal = subtotal + envio;
  const orderId = Date.now();

  aleraTrack('InitiateCheckout', {
    content_ids: ids.map(String), content_type: 'product',
    contents: ids.map(id => ({ id: String(id), quantity: cart[id] })),
    num_items: ids.reduce((s,id)=>s+cart[id],0),
    currency: 'HNL', value: totalFinal,
  });

  const order = {
    id: orderId,
    orderNum: (orderId % 9000) + 1,
    date: new Date().toLocaleString('es-HN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }),
    customer: { name, phone, address },
    items: ids.map(id => ({ id: Number(id), name: PRODUCTS[id].name, qty: cart[id], price: PRODUCTS[id].price })),
    subtotal, shipping: envio, total: totalFinal,
    zone: deliveryZone, payment: deliveryPayment, status: 'pendiente',
  };
  if (transferImg) order.transferImg = transferImg;

  try {
    const r = await fetch(API + '/orders', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(order) });
    if (!r.ok) {
      const errData = await r.json().catch(() => ({}));
      throw new Error(errData.error || `Error ${r.status}`);
    }
    _lastOrderTs = Date.now();

    aleraTrack('Purchase', {
      content_ids: ids.map(String), content_type: 'product',
      contents: ids.map(id => ({ id: String(id), quantity: cart[id] })),
      num_items: ids.reduce((s,id)=>s+cart[id],0),
      currency: 'HNL', value: totalFinal,
    });

    cart = {}; saveCart(); renderCart();
    btn.textContent = 'Hacer pedido'; btn.disabled = false;
    document.getElementById('success-order-num').textContent = '#' + String(order.orderNum).padStart(3,'0');
    const sc = document.getElementById('cart-success');
    sc.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => { sc.style.transform = 'translateX(0)'; }));
  } catch(e) {
    btn.disabled = false;
    checkDeliveryForm();
    console.error('submitOrder error:', e);
    alert('No se pudo enviar el pedido: ' + (e.message || 'Revisá tu conexión.'));
  }
}

function resetCartSuccess() {
  const sc = document.getElementById('cart-success');
  sc.style.transform = 'translateX(100%)';
  setTimeout(() => { sc.style.display = 'none'; sc.style.transform = ''; }, 350);
  ['delivery-name','delivery-phone','delivery-address','transfer-file'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const lbl = document.getElementById('transfer-file-label');
  if (lbl) {
    lbl.textContent = 'Subir comprobante (opcional)';
    lbl.classList.remove('text-zinc-900','font-semibold');
    lbl.classList.add('text-zinc-500');
  }
  deliveryZone = 'tgu'; deliveryPayment = 'contraentrega';
  setZone('tgu'); setPayment('contraentrega');
  checkDeliveryForm();
  backToItems();
}

// ─── FAQ ───────────────────────────────────────────────────────────────
const FAQS = [
  { q: '¿Cómo hago un pedido?', a: 'Agregá los productos al carrito, llená tus datos y hacé click en "Hacer pedido". Te contactamos por WhatsApp para confirmar y coordinar la entrega.' },
  { q: '¿Qué pasa si no estoy en Tegucigalpa?', a: 'Hacemos envíos a todo Honduras. Fuera de TGU el costo es L 90–120 y tarda 3–5 días hábiles. Te confirmamos día exacto por WhatsApp.' },
  { q: '¿Puedo pagar contra entrega?', a: 'Sí, es nuestra opción por defecto. Pagás cuando recibís el producto. Dentro de TGU es la opción más popular.' },
  { q: '¿Cuánto tardan en hacer un personalizado?', a: 'Depende del personaje, pero usualmente entre 7–14 días. Te confirmamos tiempo real cuando vemos tu idea.' },
  { q: '¿Qué pasa si la pieza llega dañada?', a: 'La reponemos. Mandanos una foto por WhatsApp y arreglamos. Empacamos todo con cuidado para que llegue perfecto.' },
];

function renderFAQ() {
  const root = document.getElementById('faq-list');
  if (!root) return;
  root.innerHTML = FAQS.map((f,i) => `
    <details class="group py-5">
      <summary class="flex items-center justify-between cursor-pointer list-none">
        <span class="font-semibold text-base pr-4">${f.q}</span>
        <span class="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center shrink-0 transition-transform group-open:rotate-45" style="color:var(--accent-600)">${plusIcon(4)}</span>
      </summary>
      <p class="mt-3 text-zinc-500 leading-relaxed text-sm pr-12">${f.a}</p>
    </details>
  `).join('');
}

// ─── Tweaks (color palette) ────────────────────────────────────────────
const TWEAK_PALETTES_LIST = [
  { key:'mint',    swatch:'#14b8a6', label:'Mint (actual)' },
  { key:'indigo',  swatch:'#6366f1', label:'Indigo' },
  { key:'coral',   swatch:'#f35d14', label:'Coral' },
  { key:'magenta', swatch:'#ec4899', label:'Magenta' },
  { key:'lime',    swatch:'#84cc16', label:'Lima' },
];

function renderTweakPalette() {
  const root = document.getElementById('tweak-palette');
  if (!root) return;
  const current = (window.TWEAK_DEFAULTS && window.TWEAK_DEFAULTS.accent) || 'mint';
  root.innerHTML = TWEAK_PALETTES_LIST.map(p => `
    <button onclick="applyAccent('${p.key}')" title="${p.label}"
      class="relative aspect-square rounded-xl border-2 ${current===p.key?'border-zinc-900':'border-transparent hover:border-zinc-300'} transition-all"
      style="background:${p.swatch}">
      ${current===p.key ? `<svg class="w-4 h-4 text-white absolute inset-0 m-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>` : ''}
    </button>
  `).join('');
}

function applyAccent(key) {
  const p = window.PALETTES && window.PALETTES[key];
  if (!p) return;
  const r = document.documentElement.style;
  Object.entries(p).forEach(([k,v]) => { if (k!=='name') r.setProperty('--accent-'+k, v); });
  window.TWEAK_DEFAULTS.accent = key;
  renderTweakPalette();
  // Re-render chrome that uses inline color
  setZone(deliveryZone); setPayment(deliveryPayment);
  // Persist to file via editmode protocol
  try { window.parent.postMessage({type:'__edit_mode_set_keys', edits:{accent:key}}, '*'); } catch(e){}
}

// expose palettes for runtime
window.PALETTES = {
  mint:    { 50:'#f0fdf8',100:'#ccfbef',200:'#99f6e0',300:'#5eead4',400:'#2dd4bf',500:'#14b8a6',600:'#0d9488',700:'#0f766e', name:'Mint' },
  indigo:  { 50:'#eef2ff',100:'#e0e7ff',200:'#c7d2fe',300:'#a5b4fc',400:'#818cf8',500:'#6366f1',600:'#4f46e5',700:'#4338ca', name:'Indigo' },
  coral:   { 50:'#fff4ed',100:'#ffe5d3',200:'#fecaa6',300:'#fca96f',400:'#fb7d3a',500:'#f35d14',600:'#e4450a',700:'#bd330b', name:'Coral' },
  magenta: { 50:'#fdf2f8',100:'#fce7f3',200:'#fbcfe8',300:'#f9a8d4',400:'#f472b6',500:'#ec4899',600:'#db2777',700:'#be185d', name:'Magenta' },
  lime:    { 50:'#f7fee7',100:'#ecfccb',200:'#d9f99d',300:'#bef264',400:'#a3e635',500:'#84cc16',600:'#65a30d',700:'#4d7c0f', name:'Lima' },
};
window.TWEAK_DEFAULTS = window.TWEAK_DEFAULTS || { accent: 'mint' };

// Edit mode listener FIRST, then announce
window.addEventListener('message', (e) => {
  const d = e.data || {};
  if (d.type === '__activate_edit_mode') {
    document.getElementById('tweaks-panel').classList.add('open');
  } else if (d.type === '__deactivate_edit_mode') {
    document.getElementById('tweaks-panel').classList.remove('open');
  }
});
try { window.parent.postMessage({type:'__edit_mode_available'}, '*'); } catch(e){}

// ─── Init ──────────────────────────────────────────────────────────────
(async function init() {
  await rebuildProductMap();
  renderHero();
  await renderFandomFilters();
  await renderFandomTiles();
  await renderCatalog();
  renderCart();
  renderFAQ();
  renderTweakPalette();
  window.addEventListener('resize', () => renderCart());
})();
