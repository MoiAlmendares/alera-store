// ─── Admin panel logic ────────────────────────────────────────────────────────

    async function refreshOrders() {
      try {
        const r = await authFetch(API + '/orders');
        _orders = await r?.json() || _orders;
        renderStats();
        renderOrders();
        updatePendingBadge();
        showToast('Pedidos actualizados ✓');
      } catch(e) {
        showToast('Error al cargar pedidos', false);
        console.error('refreshOrders:', e);
      }
    }

    async function pollOrders() {
      try {
        const r = await authFetch(API + '/orders');
        if (!r) return;
        const fresh = await r.json();
        if (!Array.isArray(fresh)) return;
        const prevPending = _orders.filter(o => o.status === 'pendiente').length;
        const newPending  = fresh.filter(o => o.status === 'pendiente').length;
        _orders = fresh;
        updatePendingBadge();
        if (currentTab === 'orders') { renderStats(); renderOrders(); }
        if (newPending > prevPending) {
          const diff = newPending - prevPending;
          showToast(`🛒 ${diff} pedido${diff > 1 ? 's' : ''} nuevo${diff > 1 ? 's' : ''}!`);
        }
      } catch(e) { console.error('poll:', e); }
    }

    function saveCredentials() {
      const newUser = document.getElementById('new-user').value.trim();
      const newPwd  = document.getElementById('new-pwd').value.trim();
      if (!newUser && !newPwd) return;
      if (newUser) localStorage.setItem('alera_user', newUser);
      if (newPwd)  localStorage.setItem('alera_pwd',  newPwd);
      document.getElementById('new-user').value = '';
      document.getElementById('new-pwd').value  = '';
      document.getElementById('pwd-saved').classList.remove('hidden');
      setTimeout(() => document.getElementById('pwd-saved').classList.add('hidden'), 3000);
    }

    // ─── Products ────────────────────────────────────────────────────────────
    const CATALOG_VERSION = '5';

    const DEFAULT_PRODUCTS = [
      { id:1,  name:'Llavero Cubone',             category:'Llavero',   fandom:'Pokémon',       price:150, emoji:'🔑',  img:'assets/cubone-mochila.png',          badge:'',               dark:false, active:true, stock:true },
      { id:2,  name:'Llavero Cubone Glow',         category:'Llavero',   fandom:'Pokémon',       price:180, emoji:'🔑',  img:'assets/cubone.jpg',                  badge:'',               dark:true,  active:true, stock:true },
      { id:3,  name:'Llavero Hornet',              category:'Llavero',   fandom:'Hollow Knight', price:150, emoji:'🔑',  img:'assets/llavero-hornet.jpg',           badge:'',               dark:false, active:true, stock:true },
      { id:4,  name:'Llavero Esqueleto Minecraft', category:'Llavero',   fandom:'Minecraft',     price:150, emoji:'💀',  img:'assets/llavero-esqueleto-minecraft.jpg',badge:'',             dark:false, active:true, stock:true },
      { id:5,  name:'Llavero Mandalorian',         category:'Llavero',   fandom:'Star Wars',     price:150, emoji:'⚔️', img:'assets/llavero-mandalorian.jpg',      badge:'',               dark:false, active:true, stock:true },
      { id:6,  name:'Llaveros Star Wars',          category:'Llavero',   fandom:'Star Wars',     price:150, emoji:'⚔️', img:'assets/llaveros-star-wars.jpg',       badge:'',               dark:false, active:true, stock:true },
      { id:7,  name:'Llaveros Sharingan',          category:'Llavero',   fandom:'Naruto',        price:150, emoji:'👁️', img:'assets/llaveros-sharingan.jpg',       badge:'',               dark:false, active:true, stock:true },
      { id:8,  name:'Llavero Pokébola',            category:'Llavero',   fandom:'Pokémon',       price:150, emoji:'⚪🔴',img:'assets/llavero-pokebola.jpg',         badge:'',               dark:false, active:true, stock:true },
      { id:9,  name:'Llavero Batarang',            category:'Llavero',   fandom:'DC / Batman',   price:150, emoji:'🦇',  img:'assets/Batarang.jpg',                badge:'✨ Nuevo',        dark:false, active:true, stock:true },
      { id:10, name:'Lámpara Minecraft',           category:'Lámpara',   fandom:'Minecraft',     price:350, emoji:'🕯️', img:'assets/lampara-minecraft.jpg',        badge:'🔥 Más vendido', dark:false, active:true, stock:true },
      { id:11, name:'Lámpara Tanjiro Kamado',      category:'Lámpara',   fandom:'Demon Slayer',  price:350, emoji:'☀️',  img:'assets/lampara-tanjiro.jpg',          badge:'',               dark:false, active:true, stock:true },
      { id:12, name:'Máscara Darth Vader',         category:'Decoración',fandom:'Star Wars',     price:280, emoji:'🪖',  img:'assets/mascara-darth-vader.jpg',      badge:'',               dark:false, active:true, stock:true },
      { id:13, name:'Máscara The Mandalorian',     category:'Decoración',fandom:'Star Wars',     price:280, emoji:'⚔️', img:'assets/mandalorian-deco-pared.jpg',   badge:'',               dark:false, active:true, stock:true },
      { id:14, name:'TIE Fighter (pared)',          category:'Decoración',fandom:'Star Wars',     price:280, emoji:'🚀',  img:'assets/tie-fighter-deco-pared.jpg',   badge:'',               dark:false, active:true, stock:true },
      { id:15, name:'Perritos Minecraft',          category:'Figura',    fandom:'Minecraft',     price:200, emoji:'🐶',  img:'assets/perritos-minecraft.jpg',        badge:'',               dark:false, active:true, stock:true },
      { id:16, name:'Máscara Obito Uchiha',        category:'Figura',    fandom:'Naruto',        price:250, emoji:'👺',  img:'assets/Obito.jpg',                    badge:'',               dark:false, active:true, stock:true },
      { id:17, name:'TIE Fighter armable',         category:'Figura',    fandom:'Star Wars',     price:320, emoji:'🚀',  img:'assets/tie-fighter-armable.jpg',       badge:'',               dark:false, active:true, stock:true },
      { id:18, name:'AT-ST Star Wars',             category:'Figura',    fandom:'Star Wars',     price:320, emoji:'🤖',  img:'assets/at-st-star-wars.jpg',           badge:'✨ Nuevo',        dark:false, active:true, stock:true },
      { id:19, name:'Set Portavasos Star Wars',    category:'Set',       fandom:'Star Wars',     price:380, emoji:'🥤',  img:'assets/portavasos-star-wars.jpg',      badge:'',               dark:false, active:true, stock:true },
    ];

    let _products = [];
    let _orders   = [];

    async function loadData() {
      try {
        const [pr, or] = await Promise.all([
          authFetch(API + '/products').then(r => r?.json()),
          authFetch(API + '/orders').then(r => r?.json())
        ]);
        _products = pr.length ? pr : DEFAULT_PRODUCTS;
        _orders   = or;
      } catch(e) {
        console.error('loadData:', e);
        _products = DEFAULT_PRODUCTS;
        showToast('No se pudo conectar a la base de datos', false);
      }
    }

    function getProducts() { return _products; }
    function saveProducts(products) {
      _products = products;
      authFetch(API + '/products', { method:'PUT', body:JSON.stringify(products) }).catch(console.error);
    }

    function nextId(products) {
      return products.length ? Math.max(...products.map(p => p.id)) + 1 : 1;
    }

    // ─── UI State ────────────────────────────────────────────────────────────
    let currentFilter  = 'all';
    let currentTab     = 'products';
    let ordersFilter   = 'pendiente';
    let editingId      = null;
    let darkOn         = false;
    let uploadedImgData = '';

    // ─── Orders data ─────────────────────────────────────────────────────────
    function getOrders() { return _orders; }

    // ─── Tab switching ────────────────────────────────────────────────────────
    function setTab(tab) {
      currentTab = tab;
      const activeClass = 'flex items-center gap-2 pb-3 text-sm font-semibold transition-colors border-b-2 border-zinc-900 text-zinc-900';
      const idleClass   = 'flex items-center gap-2 pb-3 text-sm font-semibold transition-colors border-b-2 border-transparent text-zinc-400 hover:text-zinc-600';
      ['products', 'orders', 'comisiones', 'estadisticas'].forEach(t => {
        const btn = document.getElementById('tab-btn-' + t);
        const sec = document.getElementById('section-' + t);
        if (btn) btn.className = tab === t ? activeClass : idleClass;
        if (sec) sec.classList.toggle('hidden', tab !== t);
      });
      renderStats();
      if (tab === 'orders')       renderOrders();
      if (tab === 'comisiones')   renderComisiones();
      if (tab === 'estadisticas') renderEstadisticas();
    }

    // ─── Render ──────────────────────────────────────────────────────────────
    function renderAll() {
      renderStats();
      renderTable();
      updatePendingBadge();
    }

    function renderStats() {
      const row = document.getElementById('stats-row');
      if (currentTab === 'comisiones' || currentTab === 'estadisticas') { row.classList.add('hidden'); return; }
      row.classList.remove('hidden');
      if (currentTab === 'orders') {
        const orders    = getOrders();
        const pending   = orders.filter(o => o.status === 'pendiente').length;
        const delivered = orders.filter(o => o.status === 'entregado').length;
        const cancelled = orders.filter(o => o.status === 'cancelado').length;
        row.innerHTML = `
          <div class="bg-white rounded-2xl border border-zinc-200 p-5">
            <div class="text-3xl font-black text-zinc-900">${orders.length}</div>
            <div class="text-sm text-zinc-500 mt-1">Total pedidos</div>
          </div>
          <div class="bg-white rounded-2xl border border-zinc-200 p-5">
            <div class="text-3xl font-black ${pending > 0 ? 'text-yellow-500' : 'text-zinc-900'}">${pending}</div>
            <div class="text-sm text-zinc-500 mt-1">Pendientes</div>
          </div>
          <div class="bg-white rounded-2xl border border-zinc-200 p-5">
            <div class="text-3xl font-black text-mint-600">${delivered}</div>
            <div class="text-sm text-zinc-500 mt-1">Entregados</div>
          </div>
          <div class="bg-white rounded-2xl border border-zinc-200 p-5">
            <div class="text-3xl font-black text-zinc-400">${cancelled}</div>
            <div class="text-sm text-zinc-500 mt-1">Cancelados</div>
          </div>
        `;
      } else {
        const products = getProducts();
        const active   = products.filter(p => p.active);
        const agotado  = products.filter(p => p.stock === false);
        row.innerHTML = `
          <div class="bg-white rounded-2xl border border-zinc-200 p-5">
            <div class="text-3xl font-black text-mint-600">${products.length}</div>
            <div class="text-sm text-zinc-500 mt-1">Total productos</div>
          </div>
          <div class="bg-white rounded-2xl border border-zinc-200 p-5">
            <div class="text-3xl font-black text-zinc-900">${active.length}</div>
            <div class="text-sm text-zinc-500 mt-1">Visibles en tienda</div>
          </div>
          <div class="bg-white rounded-2xl border border-zinc-200 p-5">
            <div class="text-3xl font-black ${agotado.length > 0 ? 'text-red-500' : 'text-zinc-900'}">${agotado.length}</div>
            <div class="text-sm text-zinc-500 mt-1">Agotados</div>
          </div>
          <div class="bg-white rounded-2xl border border-zinc-200 p-5">
            <div class="text-3xl font-black text-zinc-400">${products.filter(p=>!p.active).length}</div>
            <div class="text-sm text-zinc-500 mt-1">Ocultos</div>
          </div>
        `;
      }
    }

    // ─── Orders UI ────────────────────────────────────────────────────────────
    function updatePendingBadge() {
      const n     = getOrders().filter(o => o.status === 'pendiente').length;
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

    // Escapa caracteres HTML para prevenir XSS en datos de clientes
    function esc(str) {
      if (str == null) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function renderOrders() {
      const all      = getOrders();
      const filtered = ordersFilter === 'all' ? all : all.filter(o => o.status === ordersFilter);
      const list     = document.getElementById('orders-list');
      const empty    = document.getElementById('orders-empty');

      if (!filtered.length) { list.innerHTML = ''; empty.classList.remove('hidden'); return; }
      empty.classList.add('hidden');

      const statusMap = {
        pendiente: { label:'Pendiente',  cls:'bg-yellow-100 text-yellow-700' },
        entregado: { label:'Entregado',  cls:'bg-mint-100 text-mint-700'     },
        cancelado: { label:'Cancelado',  cls:'bg-red-100 text-red-600'       },
      };

      list.innerHTML = filtered.map(o => {
        const sc        = statusMap[o.status] || statusMap.pendiente;
        const zonaLabel = o.zone === 'tgu' ? 'Dentro de TGU' : 'Fuera de TGU';
        const pagoLabel = o.payment === 'contraentrega' ? 'Contra entrega' : 'Transferencia';
        const approx    = o.zone !== 'tgu' ? ' (aprox.)' : '';
        const actions   = o.status === 'pendiente'
          ? `<div class="flex gap-2">
               <button onclick="updateOrderStatus(${o.id},'entregado')"
                 class="flex-1 bg-mint-500 hover:bg-mint-600 text-white text-xs font-bold py-2.5 rounded-xl transition-colors">
                 Marcar entregado
               </button>
               <button onclick="updateOrderStatus(${o.id},'cancelado')"
                 class="px-4 border border-zinc-200 hover:bg-red-50 hover:border-red-200 hover:text-red-500 text-zinc-500 text-xs font-semibold py-2.5 rounded-xl transition-colors">
                 Cancelar
               </button>
             </div>`
          : `<button onclick="updateOrderStatus(${o.id},'pendiente')"
               class="w-full text-xs text-zinc-400 hover:text-zinc-600 transition-colors py-1 text-center">
               Restaurar como pendiente
             </button>`;

        return `
          <div class="bg-white rounded-2xl border border-zinc-200 p-5 space-y-4">
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="text-xs text-zinc-400 font-mono mb-0.5">#${String(o.orderNum).padStart(3,'0')} &middot; ${esc(o.date)}</div>
                <div class="font-bold text-base">${esc(o.customer.name)}</div>
                <div class="text-sm text-zinc-500 mt-0.5">${esc(o.customer.phone)}</div>
                <div class="text-sm text-zinc-400">${esc(o.customer.address)}</div>
              </div>
              <span class="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${sc.cls}">${sc.label}</span>
            </div>

            <div class="border-t border-zinc-50 pt-3 space-y-1.5">
              ${o.items.map(item => `
                <div class="flex justify-between text-sm">
                  <span class="text-zinc-600">${esc(String(item.qty))}x ${esc(item.name)}</span>
                  <span class="font-medium">L ${Number(item.price) * Number(item.qty)}</span>
                </div>`).join('')}
            </div>

            <div class="border-t border-zinc-100 pt-3 space-y-1 text-sm">
              <div class="flex justify-between text-zinc-400">
                <span>Envío (${zonaLabel})</span>
                <span>L ${o.shipping}</span>
              </div>
              <div class="flex justify-between font-bold">
                <span>Total</span><span>L ${o.total}${approx}</span>
              </div>
              <div class="text-xs text-zinc-400 pt-0.5">Pago: ${pagoLabel}</div>
            </div>

            ${o.transferImg ? `
            <div class="border-t border-zinc-100 pt-3">
              <p class="text-xs font-semibold text-zinc-500 mb-2">🏦 Comprobante de transferencia</p>
              <div class="relative group cursor-pointer rounded-xl overflow-hidden border border-zinc-200"
                   onclick="openLightbox('${o.transferImg.replace(/'/g,"\\'")}')">
                <img src="${o.transferImg}" alt="Comprobante"
                  class="w-full object-cover max-h-44 transition-transform group-hover:scale-105" />
                <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <span class="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                    Ver completo
                  </span>
                </div>
              </div>
            </div>` : ''}

            ${actions}
          </div>`;
      }).join('');
    }

    function updateOrderStatus(id, status) {
      const o = _orders.find(x => x.id === id);
      if (o) o.status = status;
      authFetch(API + '/orders/' + id, { method:'PATCH', body:JSON.stringify({ status }) }).catch(console.error);
      renderStats();
      renderOrders();
      updatePendingBadge();
    }

    function renderTable() {
      const products = getProducts();
      const filtered = currentFilter === 'all' ? products : products.filter(p => p.category === currentFilter);
      const tbody = document.getElementById('products-table');
      const empty = document.getElementById('empty-table');

      if (!filtered.length) {
        tbody.innerHTML = '';
        empty.classList.remove('hidden');
        return;
      }
      empty.classList.add('hidden');

      tbody.innerHTML = filtered.map(p => `
        <tr class="border-b border-zinc-50 hover:bg-zinc-50 transition-colors ${!p.active ? 'opacity-50' : ''}">
          <td class="px-6 py-4">
            <div class="flex items-center gap-3">
              ${p.img
                ? `<img src="${p.img}" class="w-10 h-10 rounded-xl object-cover border border-zinc-100 shrink-0" onerror="this.style.display='none';this.nextSibling.style.display='flex'" /><div style="display:none" class="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-lg shrink-0">${p.emoji||'📦'}</div>`
                : `<div class="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-lg shrink-0">${p.emoji||'📦'}</div>`
              }
              <div>
                <div class="font-semibold text-sm">${p.name}</div>
                ${p.dark ? '<div class="text-xs text-zinc-400">Card oscura</div>' : ''}
              </div>
            </div>
          </td>
          <td class="px-4 py-4 text-sm text-zinc-600">${p.category}</td>
          <td class="px-4 py-4 text-sm text-zinc-500">${p.fandom||'—'}</td>
          <td class="px-4 py-4 text-sm font-bold">L ${p.price}</td>
          <td class="px-4 py-4">
            ${p.badge ? `<span class="text-xs bg-zinc-900 text-white px-2 py-1 rounded-full">${p.badge}</span>` : '<span class="text-zinc-300 text-xs">—</span>'}
          </td>
          <td class="px-4 py-4">
            <button onclick="toggleActive(${p.id})"
              class="text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${p.active ? 'bg-mint-100 text-mint-700 hover:bg-mint-200' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}">
              ${p.active ? 'Activo' : 'Oculto'}
            </button>
          </td>
          <td class="px-4 py-4">
            <button onclick="toggleStock(${p.id})"
              class="text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${p.stock !== false ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}">
              ${p.stock !== false ? 'Disponible' : 'Agotado'}
            </button>
          </td>
          <td class="px-6 py-4">
            <div class="flex gap-2 justify-end">
              <button onclick="openModal(${p.id})"
                class="p-2 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors" title="Editar">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>
              </button>
              <button onclick="confirmDelete(${p.id})"
                class="p-2 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors" title="Eliminar">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
              </button>
            </div>
          </td>
        </tr>
      `).join('');
    }

    // ─── Filter ──────────────────────────────────────────────────────────────
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

    // ─── Modal ───────────────────────────────────────────────────────────────
    function openModal(id) {
      editingId = id || null;
      uploadedImgData = '';
      darkOn = false;
      stockOn = true;

      document.getElementById('modal-title').textContent = id ? 'Editar producto' : 'Agregar producto';
      document.getElementById('form-error').classList.add('hidden');
      document.getElementById('img-preview-wrap').classList.add('hidden');
      document.getElementById('img-placeholder-icon').style.display = '';
      document.getElementById('img-upload-label').textContent = 'Clic para subir imagen';
      updateDarkToggle();

      if (id) {
        const p = getProducts().find(x => x.id === id);
        document.getElementById('f-name').value = p.name;
        document.getElementById('f-category').value = p.category;
        document.getElementById('f-fandom').value = p.fandom || '';
        document.getElementById('f-price').value = p.price;
        document.getElementById('f-emoji').value = p.emoji || '';
        document.getElementById('f-badge').value = p.badge || '';
        document.getElementById('f-img-url').value = p.img || '';
        darkOn  = p.dark || false;
        stockOn = p.stock !== false;
        updateDarkToggle();
        updateStockToggle();
        if (p.img) {
          document.getElementById('img-preview').src = p.img;
          document.getElementById('img-preview-wrap').classList.remove('hidden');
          document.getElementById('img-placeholder-icon').style.display = 'none';
          document.getElementById('img-upload-label').textContent = 'Cambiar imagen';
        }
      } else {
        document.getElementById('f-name').value = '';
        document.getElementById('f-category').value = 'Llavero';
        document.getElementById('f-fandom').value = '';
        document.getElementById('f-price').value = '';
        document.getElementById('f-emoji').value = '';
        document.getElementById('f-badge').value = '';
        document.getElementById('f-img-url').value = '';
      }

      document.getElementById('modal-overlay').classList.remove('hidden');
    }

    function closeModal() {
      document.getElementById('modal-overlay').classList.add('hidden');
    }

    let stockOn = true;

    function toggleDark() {
      darkOn = !darkOn;
      updateDarkToggle();
    }

    function updateStockToggle() {
      const btn   = document.getElementById('stock-toggle');
      const thumb = document.getElementById('stock-thumb');
      const label = document.getElementById('stock-label');
      if (stockOn) {
        btn.classList.replace('bg-zinc-200','bg-mint-500');
        thumb.classList.add('translate-x-4');
        label.textContent = 'Disponible';
      } else {
        btn.classList.replace('bg-mint-500','bg-zinc-200');
        thumb.classList.remove('translate-x-4');
        label.textContent = 'Agotado';
      }
    }

    function toggleStock(id) {
      if (id === undefined) { stockOn = !stockOn; updateStockToggle(); return; }
      const products = getProducts();
      const p = products.find(x => x.id === id);
      if (p) { p.stock = p.stock === false ? true : false; saveProducts(products); renderAll(); }
    }

    function updateDarkToggle() {
      const btn = document.getElementById('dark-toggle');
      const thumb = document.getElementById('dark-thumb');
      const label = document.getElementById('dark-label');
      if (darkOn) {
        btn.classList.replace('bg-zinc-200','bg-zinc-900');
        thumb.classList.add('translate-x-4');
        label.textContent = 'Sí';
      } else {
        btn.classList.replace('bg-zinc-900','bg-zinc-200');
        thumb.classList.remove('translate-x-4');
        label.textContent = 'No';
      }
    }

    function handleImageUpload(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        uploadedImgData = e.target.result;
        document.getElementById('img-preview').src = uploadedImgData;
        document.getElementById('img-preview-wrap').classList.remove('hidden');
        document.getElementById('img-placeholder-icon').style.display = 'none';
        document.getElementById('img-upload-label').textContent = file.name;
        document.getElementById('f-img-url').value = '';
      };
      reader.readAsDataURL(file);
    }

    function handleUrlInput() {
      const url = document.getElementById('f-img-url').value.trim();
      uploadedImgData = '';
      if (url) {
        document.getElementById('img-preview').src = url;
        document.getElementById('img-preview-wrap').classList.remove('hidden');
        document.getElementById('img-placeholder-icon').style.display = 'none';
      } else {
        document.getElementById('img-preview-wrap').classList.add('hidden');
        document.getElementById('img-placeholder-icon').style.display = '';
      }
    }

    function saveProduct() {
      const name  = document.getElementById('f-name').value.trim();
      const price = parseInt(document.getElementById('f-price').value);
      const errEl = document.getElementById('form-error');

      if (!name) { errEl.textContent = 'El nombre es obligatorio.'; errEl.classList.remove('hidden'); return; }
      if (!price || price <= 0) { errEl.textContent = 'El precio debe ser mayor a 0.'; errEl.classList.remove('hidden'); return; }
      errEl.classList.add('hidden');

      const imgVal = uploadedImgData || document.getElementById('f-img-url').value.trim();

      const product = {
        id:       editingId || null,
        name,
        category: document.getElementById('f-category').value,
        fandom:   document.getElementById('f-fandom').value.trim(),
        price,
        emoji:    document.getElementById('f-emoji').value.trim(),
        badge:    document.getElementById('f-badge').value,
        img:      imgVal,
        dark:     darkOn,
        stock:    stockOn,
        active:   true,
      };

      const products = getProducts();
      if (editingId) {
        const idx = products.findIndex(p => p.id === editingId);
        product.active = products[idx].active;
        products[idx] = product;
        // stock is already set from stockOn toggle above
      } else {
        product.id = nextId(products);
        products.push(product);
      }

      saveProducts(products);
      closeModal();
      renderAll();
    }

    // ─── Toggle active ────────────────────────────────────────────────────────
    function toggleActive(id) {
      const products = getProducts();
      const p = products.find(x => x.id === id);
      p.active = !p.active;
      saveProducts(products);
      renderAll();
    }

    // ─── Delete ───────────────────────────────────────────────────────────────
    let pendingDeleteId = null;
    function confirmDelete(id) {
      pendingDeleteId = id;
      document.getElementById('confirm-overlay').classList.remove('hidden');
    }
    function closeConfirm() {
      pendingDeleteId = null;
      document.getElementById('confirm-overlay').classList.add('hidden');
    }
    document.getElementById('confirm-delete-btn').onclick = () => {
      if (!pendingDeleteId) return;
      const products = getProducts().filter(p => p.id !== pendingDeleteId);
      saveProducts(products);
      closeConfirm();
      renderAll();
    };

    // ─── Commission Calculator ────────────────────────────────────────────────
    let comPeriod = 'mes';

    function setComPeriod(period) {
      comPeriod = period;
      document.querySelectorAll('.com-period-btn').forEach(b => {
        b.classList.remove('bg-zinc-900','text-white');
        b.classList.add('bg-zinc-100','text-zinc-600');
      });
      const btn = document.getElementById('cperiod-' + period);
      if (btn) { btn.classList.add('bg-zinc-900','text-white'); btn.classList.remove('bg-zinc-100','text-zinc-600'); }
      renderComisiones();
    }

    function getComOrders() {
      const orders = getOrders().filter(o => o.status === 'entregado');
      if (comPeriod === 'todo') return orders;
      const now = new Date();
      let startMs, endMs;
      if (comPeriod === 'mes') {
        startMs = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        endMs   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
      } else {
        const pm = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const py = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        startMs = new Date(py, pm, 1).getTime();
        endMs   = new Date(py, pm + 1, 0, 23, 59, 59, 999).getTime();
      }
      return orders.filter(o => o.id >= startMs && o.id <= endMs);
    }

    function renderComisiones() {
      const orders   = getComOrders();
      const pct      = Math.max(0, Math.min(100, parseFloat(document.getElementById('com-pct').value) || 0));
      const ventas   = orders.reduce((s, o) => s + o.total, 0);
      const comision = Math.round(ventas * pct / 100);
      const neto     = ventas - comision;

      document.getElementById('com-count').textContent    = orders.length;
      document.getElementById('com-ventas').textContent   = 'L ' + ventas.toLocaleString('es-HN');
      document.getElementById('com-comision').textContent = 'L ' + comision.toLocaleString('es-HN');
      document.getElementById('com-neto').textContent     = 'L ' + neto.toLocaleString('es-HN');

      const tbody = document.getElementById('com-table-body');
      const empty = document.getElementById('com-empty');

      if (!orders.length) { tbody.innerHTML = ''; empty.classList.remove('hidden'); return; }
      empty.classList.add('hidden');

      tbody.innerHTML = orders.map(o => {
        const oComision   = Math.round(o.total * pct / 100);
        const itemsSummary = o.items.map(i => `${i.qty}x ${i.name}`).join(', ');
        return `
          <tr class="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
            <td class="px-6 py-3 text-xs font-mono text-zinc-400">#${String(o.orderNum).padStart(3,'0')}</td>
            <td class="px-4 py-3">
              <div class="font-semibold text-sm">${o.customer.name}</div>
              <div class="text-xs text-zinc-400">${o.customer.phone}</div>
            </td>
            <td class="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">${o.date}</td>
            <td class="px-4 py-3 text-xs text-zinc-500 max-w-xs truncate">${itemsSummary}</td>
            <td class="px-4 py-3 text-sm font-bold text-right">L ${o.total}</td>
            <td class="px-6 py-3 text-sm font-semibold text-mint-600 text-right">L ${oComision}</td>
          </tr>`;
      }).join('');
    }

    // ─── Manual Order Modal ───────────────────────────────────────────────────
    let omItems   = [];
    let omZone    = 'tgu';
    let omPayment = 'contraentrega';

    function openOrderModal() {
      omItems   = [];
      omZone    = 'tgu';
      omPayment = 'contraentrega';
      document.getElementById('om-name').value    = '';
      document.getElementById('om-phone').value   = '';
      document.getElementById('om-address').value = '';
      document.getElementById('om-qty').value     = '1';
      document.getElementById('om-error').classList.add('hidden');
      // Poblar selector de productos
      const products = getProducts().filter(p => p.active && p.stock !== false);
      const sel = document.getElementById('om-product-select');
      sel.innerHTML = products.map(p =>
        `<option value="${p.id}">L ${p.price} — ${p.name}</option>`
      ).join('');
      // Reset zone/payment buttons
      setOmZone('tgu');
      setOmPayment('contraentrega');
      renderOmItems();
      document.getElementById('order-modal-overlay').classList.remove('hidden');
    }

    function closeOrderModal() {
      document.getElementById('order-modal-overlay').classList.add('hidden');
    }

    function setOmZone(zone) {
      omZone = zone;
      const active = 'text-sm font-semibold py-2.5 rounded-xl border-2 border-mint-500 bg-mint-50 text-mint-700 transition-all';
      const idle   = 'text-sm font-semibold py-2.5 rounded-xl border-2 border-zinc-200 text-zinc-500 transition-all';
      document.getElementById('om-btn-tgu').className   = zone === 'tgu'   ? active : idle;
      document.getElementById('om-btn-fuera').className = zone === 'fuera' ? active : idle;
      renderOmSummary();
    }

    function setOmPayment(method) {
      omPayment = method;
      const active = 'text-sm font-semibold py-2.5 rounded-xl border-2 border-mint-500 bg-mint-50 text-mint-700 transition-all';
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
      if (existing) { existing.qty += qty; }
      else { omItems.push({ id, name: product.name, qty, price: product.price }); }
      document.getElementById('om-qty').value = '1';
      renderOmItems();
    }

    function removeOmItem(id) {
      omItems = omItems.filter(x => x.id !== id);
      renderOmItems();
    }

    function renderOmItems() {
      const list  = document.getElementById('om-items-list');
      const empty = document.getElementById('om-items-empty');
      if (!omItems.length) {
        list.innerHTML = '';
        empty.classList.remove('hidden');
        document.getElementById('om-summary').classList.add('hidden');
        return;
      }
      empty.classList.add('hidden');
      list.innerHTML = omItems.map(item => `
        <div class="flex items-center justify-between bg-zinc-50 rounded-xl px-3 py-2.5 gap-2">
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <span class="text-sm font-semibold w-6 text-center text-mint-700">${item.qty}x</span>
            <span class="text-sm text-zinc-700 truncate">${item.name}</span>
          </div>
          <div class="flex items-center gap-3 shrink-0">
            <span class="text-sm font-bold">L ${item.price * item.qty}</span>
            <button onclick="removeOmItem(${item.id})"
              class="text-zinc-300 hover:text-red-400 transition-colors text-lg leading-none">&times;</button>
          </div>
        </div>
      `).join('');
      renderOmSummary();
    }

    function renderOmSummary() {
      if (!omItems.length) { document.getElementById('om-summary').classList.add('hidden'); return; }
      const subtotal  = omItems.reduce((s, x) => s + x.price * x.qty, 0);
      const shipping  = omZone === 'tgu' ? 70 : 90;
      const total     = subtotal + shipping;
      const approx    = omZone !== 'tgu' ? ' (aprox.)' : '';
      document.getElementById('om-subtotal').textContent      = 'L ' + subtotal;
      document.getElementById('om-shipping-label').textContent = omZone === 'tgu' ? 'L 70' : 'L 90–120';
      document.getElementById('om-total').textContent          = 'L ' + total + approx;
      document.getElementById('om-summary').classList.remove('hidden');
    }

    function saveManualOrder() {
      const name    = document.getElementById('om-name').value.trim();
      const phone   = document.getElementById('om-phone').value.trim();
      const address = document.getElementById('om-address').value.trim();
      const errEl   = document.getElementById('om-error');
      if (!name)         { errEl.textContent = 'El nombre es obligatorio.';      errEl.classList.remove('hidden'); return; }
      if (!phone)        { errEl.textContent = 'El teléfono es obligatorio.';    errEl.classList.remove('hidden'); return; }
      if (!address)      { errEl.textContent = 'La dirección es obligatoria.';   errEl.classList.remove('hidden'); return; }
      if (!omItems.length){ errEl.textContent = 'Agregá al menos un producto.';  errEl.classList.remove('hidden'); return; }
      errEl.classList.add('hidden');

      const subtotal = omItems.reduce((s, x) => s + x.price * x.qty, 0);
      const shipping = omZone === 'tgu' ? 70 : 90;
      const order    = {
        id:       Date.now(),
        orderNum: _orders.length + 1,
        date:     new Date().toLocaleString('es-HN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }),
        customer: { name, phone, address },
        items:    omItems.map(x => ({ id: x.id, name: x.name, qty: x.qty, price: x.price })),
        subtotal,
        shipping,
        total:    subtotal + shipping,
        zone:     omZone,
        payment:  omPayment,
        status:   'pendiente',
      };
      _orders.unshift(order);
      authFetch(API + '/orders', { method:'POST', body:JSON.stringify(order) }).catch(console.error);
      closeOrderModal();
      renderStats();
      renderOrders();
      updatePendingBadge();
    }

    // ─── Lightbox ────────────────────────────────────────────────────────────
    function openLightbox(src) {
      document.getElementById('lightbox-img').src = src;
      document.getElementById('lightbox').classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
    function closeLightbox() {
      document.getElementById('lightbox').classList.add('hidden');
      document.getElementById('lightbox-img').src = '';
      document.body.style.overflow = '';
    }
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

    // ─── Estadísticas ────────────────────────────────────────────────────────
    function renderDistrib(items, total) {
      if (!total) return '<p class="text-sm text-zinc-400 text-center py-6">Sin datos aún</p>';
      return items.map(({ label, val, color }) => `
        <div class="mb-4">
          <div class="flex justify-between text-sm mb-1.5">
            <span class="text-zinc-600">${label}</span>
            <span class="font-bold text-zinc-900">${val} <span class="text-zinc-400 font-normal text-xs">(${Math.round(val / total * 100)}%)</span></span>
          </div>
          <div class="h-2.5 bg-zinc-100 rounded-full overflow-hidden">
            <div class="h-full ${color} rounded-full transition-all" style="width:${Math.round(val / total * 100)}%"></div>
          </div>
        </div>`).join('');
    }

    function renderEstadisticas() {
      const delivered = getOrders().filter(o => o.status === 'entregado');
      const now       = new Date();
      const msThisStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      const msLastStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
      const msLastEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).getTime();

      const thisMo   = delivered.filter(o => o.id >= msThisStart);
      const lastMo   = delivered.filter(o => o.id >= msLastStart && o.id <= msLastEnd);
      const totalRev = delivered.reduce((s, o) => s + (o.total || 0), 0);
      const thisRev  = thisMo.reduce((s, o) => s + (o.total || 0), 0);
      const lastRev  = lastMo.reduce((s, o) => s + (o.total || 0), 0);
      const avg      = delivered.length ? Math.round(totalRev / delivered.length) : 0;

      // ── Top metrics ──
      document.getElementById('stat-metrics').innerHTML = `
        <div class="bg-white rounded-2xl border border-zinc-200 p-5">
          <div class="text-2xl font-black text-mint-600">L ${thisRev.toLocaleString('es-HN')}</div>
          <div class="text-sm text-zinc-500 mt-1">Este mes</div>
          <div class="text-xs text-zinc-400 mt-0.5">${thisMo.length} pedidos</div>
        </div>
        <div class="bg-white rounded-2xl border border-zinc-200 p-5">
          <div class="text-2xl font-black text-zinc-700">L ${lastRev.toLocaleString('es-HN')}</div>
          <div class="text-sm text-zinc-500 mt-1">Mes anterior</div>
          <div class="text-xs text-zinc-400 mt-0.5">${lastMo.length} pedidos</div>
        </div>
        <div class="bg-white rounded-2xl border border-zinc-200 p-5">
          <div class="text-2xl font-black text-zinc-900">L ${totalRev.toLocaleString('es-HN')}</div>
          <div class="text-sm text-zinc-500 mt-1">Total histórico</div>
          <div class="text-xs text-zinc-400 mt-0.5">${delivered.length} pedidos entregados</div>
        </div>
        <div class="bg-white rounded-2xl border border-zinc-200 p-5">
          <div class="text-2xl font-black text-zinc-900">L ${avg.toLocaleString('es-HN')}</div>
          <div class="text-sm text-zinc-500 mt-1">Ticket promedio</div>
          <div class="text-xs text-zinc-400 mt-0.5">por pedido</div>
        </div>`;

      // ── Top productos ──
      const prodSales = {};
      delivered.forEach(o => o.items?.forEach(i => {
        prodSales[i.name] = (prodSales[i.name] || 0) + (i.qty || 1);
      }));
      const top = Object.entries(prodSales).sort((a, b) => b[1] - a[1]).slice(0, 5);
      const maxQ = top[0]?.[1] || 1;
      document.getElementById('stat-top-products').innerHTML = `
        <h3 class="font-bold text-base mb-5">🏆 Más vendidos</h3>
        ${top.length ? top.map(([name, qty]) => `
          <div class="mb-3.5">
            <div class="flex justify-between text-sm mb-1.5">
              <span class="font-medium text-zinc-700 truncate max-w-[75%]">${esc(name)}</span>
              <span class="font-bold text-zinc-900 shrink-0">${qty} uds</span>
            </div>
            <div class="h-2.5 bg-zinc-100 rounded-full overflow-hidden">
              <div class="h-full bg-mint-500 rounded-full" style="width:${Math.round(qty / maxQ * 100)}%"></div>
            </div>
          </div>`).join('')
        : '<p class="text-sm text-zinc-400 text-center py-8">Sin datos aún</p>'}`;

      // ── Últimos 6 meses ──
      const months = Array.from({ length: 6 }, (_, i) => {
        const d     = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const start = d.getTime();
        const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
        const mos   = delivered.filter(o => o.id >= start && o.id <= end);
        return { label: d.toLocaleDateString('es-HN', { month: 'short' }), count: mos.length, rev: mos.reduce((s, o) => s + (o.total || 0), 0) };
      });
      const maxC = Math.max(...months.map(m => m.count), 1);
      document.getElementById('stat-monthly').innerHTML = `
        <h3 class="font-bold text-base mb-5">📅 Últimos 6 meses</h3>
        <div class="flex items-end gap-2" style="height:90px">
          ${months.map(m => {
            const h = m.count ? Math.max(10, Math.round(m.count / maxC * 80)) : 6;
            return `<div class="flex-1 flex flex-col justify-end items-center">
              <div class="w-full rounded-t-lg ${m.count ? 'bg-mint-500' : 'bg-zinc-100'}" style="height:${h}px"></div>
            </div>`;
          }).join('')}
        </div>
        <div class="flex gap-2 mt-2">
          ${months.map(m => `
            <div class="flex-1 text-center">
              <div class="text-[11px] font-bold text-zinc-700">${m.count || '–'}</div>
              <div class="text-[10px] text-zinc-400 capitalize">${m.label}</div>
            </div>`).join('')}
        </div>`;

      // ── Zona ──
      const tgu   = delivered.filter(o => o.zone === 'tgu').length;
      const fuera = delivered.filter(o => o.zone === 'fuera').length;
      document.getElementById('stat-zone').innerHTML = `
        <h3 class="font-bold text-base mb-5">📍 Zona de envío</h3>
        ${renderDistrib([
          { label:'Dentro de TGU', val:tgu,   color:'bg-mint-500' },
          { label:'Fuera de TGU',  val:fuera, color:'bg-zinc-400' },
        ], tgu + fuera)}`;

      // ── Pago ──
      const contra = delivered.filter(o => o.payment === 'contraentrega').length;
      const trans  = delivered.filter(o => o.payment === 'transferencia').length;
      document.getElementById('stat-payment').innerHTML = `
        <h3 class="font-bold text-base mb-5">💳 Método de pago</h3>
        ${renderDistrib([
          { label:'Contra entrega', val:contra, color:'bg-mint-500' },
          { label:'Transferencia',  val:trans,  color:'bg-zinc-400' },
        ], contra + trans)}`;
    }

    // ─── Boot ─────────────────────────────────────────────────────────────────
    if (sessionStorage.getItem('alera_admin')) {
      loadData().then(renderAll);
      setInterval(pollOrders, 20000); // auto-refresh cada 20s
    } else {
      location.href = 'login.html';
    }
