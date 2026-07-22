// ─── Shared utilities — admin.html & vendedor.html ───────────────────────────

const API = 'https://aq2rjel5xpc6kxux6u3lgg7p5q0fenmn.lambda-url.us-east-2.on.aws';

// ─── Costos ──────────────────────────────────────────────────────────────────
// Precio del filamento por kilo. El costo de plástico de un producto se calcula
// automáticamente desde sus gramos: (gramos / 1000) × precio por kilo.
const FILAMENT_PER_KG = 880;
function plasticCost(grams) { return (Number(grams) || 0) / 1000 * FILAMENT_PER_KG; }

// Costo unitario total de un producto = filamento (desde gramos) + costos extra.
function productUnitCost(p) {
  const extras = Array.isArray(p && p.costs) ? p.costs.reduce((s, c) => s + Number(c.amount || 0), 0) : 0;
  return plasticCost(p && p.g) + extras;
}

function showToast(msg, ok = true) {
  const t = document.createElement('div');
  t.className = `fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl text-sm font-semibold shadow-lg text-white ${ok ? 'bg-teal-600' : 'bg-red-500'}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

function authHeaders(extra = {}) {
  const token = sessionStorage.getItem('alera_token') || '';
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...extra };
}

async function authFetch(url, opts = {}) {
  opts.headers = authHeaders(opts.headers || {});
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeout || 10_000);
  try {
    const r = await fetch(url, { ...opts, signal: ctrl.signal });
    clearTimeout(timer);
    if (r.status === 401) { doLogout(); return null; }
    return r;
  } catch(e) {
    clearTimeout(timer);
    throw e;
  }
}

// Decodifica el payload del JWT para leer el username (sin verificar firma — solo UI)
function getMyUsername() {
  const token = sessionStorage.getItem('alera_token') || '';
  try {
    const part = token.split('.')[0];
    return JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/'))).user || '';
  } catch { return ''; }
}

// Muestra el usuario logueado en el badge #current-user del header
function showCurrentUser() {
  const el = document.getElementById('current-user');
  if (!el) return;
  const user = getMyUsername();
  if (!user) return;
  el.textContent = '👤 ' + user;
  el.classList.remove('hidden');
}

function doLogout() {
  sessionStorage.removeItem('alera_admin');
  sessionStorage.removeItem('alera_vendedor');
  sessionStorage.removeItem('alera_token');
  location.href = 'login.html';
}
