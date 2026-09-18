import { iniciarAgenda } from './agenda.js';
import { iniciarRecompensas } from './recompensas.js';
import { organizarAlumno } from './alumno-layout.js';

try {
  // Reutiliza la estructura, pero nunca ejecuta menu.js ni carga Firebase.
  const respuesta = await fetch('./menu.html');
  if (!respuesta.ok) throw new Error('No se pudo cargar la página de ejemplo.');
  const pagina = new DOMParser().parseFromString(await respuesta.text(), 'text/html');
  pagina.querySelectorAll('script').forEach(script => script.remove());
  document.body.replaceChildren(...pagina.body.childNodes);
  iniciarAgenda(false);
  iniciarRecompensas(false);
  const chat = document.getElementById('seccion-chat');
  const btnChat = document.getElementById('btn-abrir-chat');
  btnChat.addEventListener('click', () => { chat.classList.remove('oculto'); btnChat.setAttribute('aria-expanded', 'true'); });
  const caja = document.getElementById('caja-mensajes');
  const saludo = document.createElement('p');
  saludo.textContent = 'Profe · Este chat es de prueba. Los mensajes no se envían a nadie.';
  caja.append(saludo);
  const input = document.getElementById('input-texto-chat');
  const enviar = document.getElementById('btn-enviar-chat');
  enviar.addEventListener('click', () => {
    if (!input.value.trim()) return;
    const mensaje = document.createElement('p');
    mensaje.textContent = `Tú · ${new Date().toLocaleTimeString('es-ES')} · ${input.value.trim()}`;
    caja.append(mensaje); input.value = ''; caja.scrollTop = caja.scrollHeight;
  });
  input.addEventListener('keydown', evento => { if (evento.key === 'Enter' && !evento.isComposing) { evento.preventDefault(); enviar.click(); } });
  document.getElementById('btn-enviar-duda').addEventListener('click', () => {
    const estado = document.getElementById('mensaje-duda-estado');
    estado.classList.remove('oculto'); estado.textContent = 'Duda de prueba: no se ha enviado ningún correo.';
  });
  document.getElementById('lista-anuncios').textContent = 'Bienvenid@ a tu aula. Aquí verás los anuncios de tu profesora.';
  organizarAlumno('Alumno de prueba');
  const volver = document.getElementById('btn-cerrarSesion');
  volver.textContent = 'Volver al administrador';
  volver.addEventListener('click', () => { window.location.href = 'menu.html'; });
  const aviso = document.createElement('div'); aviso.className = 'demo-aviso';
  aviso.textContent = 'VISTA DE ALUMNO · Todo desbloqueado · Cambios y archivos solo de prueba, se borran al recargar.';
  const enlace = document.createElement('a'); enlace.href = 'menu.html'; enlace.textContent = 'Salir de la demostración'; aviso.append(enlace);
  document.body.prepend(aviso);
} catch (error) {
  document.body.textContent = `${error.message} Recarga para reintentar.`;
}
