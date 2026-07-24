import { supabase } from './supabase.js';

const loginButton = document.getElementById('loginButton');
const errorBox = document.getElementById('err');

async function login() {
  const email = document.getElementById('user').value.trim();
  const password = document.getElementById('pass').value;
  errorBox.classList.remove('show');

  if (!email || !password) {
    errorBox.textContent = 'Ingresa tu correo y contraseña.';
    errorBox.classList.add('show');
    return;
  }

  loginButton.disabled = true;
  loginButton.textContent = 'Ingresando…';
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    errorBox.textContent = 'Correo o contraseña incorrectos.';
    errorBox.classList.add('show');
    document.getElementById('pass').value = '';
    loginButton.disabled = false;
    loginButton.textContent = 'Ingresar →';
    return;
  }
  window.location.replace('dashboard.html');
}

const { data } = await supabase.auth.getSession();
if (data.session) window.location.replace('dashboard.html');

loginButton.addEventListener('click', login);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') login();
});
