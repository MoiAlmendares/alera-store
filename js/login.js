// ─── Login logic ─────────────────────────────────────────────────────────────

const API = 'https://aq2rjel5xpc6kxux6u3lgg7p5q0fenmn.lambda-url.us-east-2.on.aws';

async function doLogin() {
  const user = document.getElementById('user-input').value.trim();
  const pwd  = document.getElementById('pwd-input').value;
  const err  = document.getElementById('login-error');
  const btn  = document.querySelector('button');

  if (!user || !pwd) return;
  btn.disabled    = true;
  btn.textContent = 'Ingresando...';
  err.classList.add('hidden');

  try {
    const r    = await fetch(API + '/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ user, password: pwd }),
    });
    const data = await r.json();

    if (!r.ok) throw new Error(data.error || 'Error');

    sessionStorage.setItem('alera_token', data.token);
    if (data.role === 'admin') {
      sessionStorage.setItem('alera_admin', '1');
      sessionStorage.removeItem('alera_vendedor');
      location.href = 'admin.html';
    } else {
      sessionStorage.setItem('alera_vendedor', '1');
      sessionStorage.removeItem('alera_admin');
      location.href = 'vendedor.html';
    }
  } catch (e) {
    err.textContent = e.message || 'Usuario o contraseña incorrectos.';
    err.classList.remove('hidden');
    document.getElementById('pwd-input').value = '';
    btn.disabled    = false;
    btn.textContent = 'Ingresar';
  }
}
