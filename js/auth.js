import { supabase } from './supabase.js';

export async function requireAuth() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    window.location.replace('index.html');
    return null;
  }

  const email = data.session.user.email ?? 'Usuario';
  document.querySelectorAll('.user-pill').forEach((element) => {
    const textNode = [...element.childNodes].find((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
    if (textNode) textNode.textContent = ` ${email.split('@')[0]} `;
    element.title = 'Cerrar sesión';
    element.addEventListener('click', async () => {
      if (!window.confirm('¿Deseas cerrar la sesión?')) return;
      await supabase.auth.signOut();
      window.location.replace('index.html');
    });
  });

  document.querySelectorAll('a[href="#"]').forEach((link) => link.remove());
  return data.session;
}
