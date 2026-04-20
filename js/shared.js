// ─── Shared utilities — admin.html & vendedor.html ───────────────────────────

const API = 'https://aq2rjel5xpc6kxux6u3lgg7p5q0fenmn.lambda-url.us-east-2.on.aws';

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
  const timer = setTimeout(() => ctrl.abort(), 10_000);
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

function doLogout() {
  sessionStorage.removeItem('alera_admin');
  sessionStorage.removeItem('alera_vendedor');
  sessionStorage.removeItem('alera_token');
  location.href = 'login.html';
}
