export const INTERVALO_AVISO = 30 * 60 * 1000;
const destino = 'https://formsubmit.co/ajax/mariadiazrueda20102004@gmail.com';

export async function enviarAvisoChat(usuario, enlace, solicitar = fetch) {
  if (!usuario) throw new Error('Vuelve a iniciar sesión para enviar el aviso.');
  const respuesta = await solicitar(destino, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
    body: JSON.stringify({
      Alumno: usuario,
      Mensaje: `Hola, profe. ${usuario} te ha enviado un aviso para que revises vuestra conversación. Entra en la plataforma y abre su chat cuando puedas. Este correo es solo una notificación; responde al alumno desde la plataforma.`,
      Plataforma: enlace,
      _subject: 'AppVideoClases · Un alumno solicita tu atención en el chat',
    }),
  });
  const datos = await respuesta.json();
  if (!respuesta.ok || !(datos.success === true || datos.success === 'true')) {
    throw new Error('No se pudo enviar el aviso. Inténtalo de nuevo más tarde.');
  }
}

export function iniciarAvisoChat(esAdmin) {
  const panel = document.getElementById('aviso-chat');
  if (esAdmin || !panel) return;
  panel.classList.remove('oculto');
  const boton = document.getElementById('btn-aviso-chat');
  const estado = document.getElementById('estado-aviso-chat');
  const usuario = sessionStorage.getItem('nombreUsuario');
  const clave = `aviso-chat:${usuario}`;
  let ultimo = 0;
  let enviando = false;
  try { ultimo = Number(localStorage.getItem(clave)) || 0; } catch { /* Almacenamiento opcional. */ }
  function actualizar() {
    const restante = Math.max(0, INTERVALO_AVISO - (Date.now() - ultimo));
    boton.disabled = enviando || restante > 0;
    boton.textContent = enviando ? 'Enviando aviso…' : restante > 0 ? `Nuevo aviso en ${Math.ceil(restante / 60000)} min` : '🔔 Avisar a la profe por correo';
  }
  boton.addEventListener('click', async () => {
    if (enviando || Date.now() - ultimo < INTERVALO_AVISO) return;
    enviando = true;
    estado.textContent = 'Enviando el aviso…';
    actualizar();
    try {
      await enviarAvisoChat(usuario, new URL('menu.html', location.href).href);
      ultimo = Date.now();
      try { localStorage.setItem(clave, String(ultimo)); } catch { /* Se mantiene el plazo en esta página. */ }
      estado.textContent = 'Aviso enviado. La profe recibirá un correo para revisar el chat.';
    } catch {
      estado.textContent = 'No se pudo confirmar el envío. Inténtalo más tarde; no hace falta volver a enviar tu mensaje del chat.';
    } finally { enviando = false; actualizar(); }
  });
  window.addEventListener('storage', evento => {
    if (evento.key === clave) { ultimo = Number(evento.newValue) || 0; actualizar(); }
  });
  actualizar();
  const intervalo = setInterval(actualizar, 15000);
  window.addEventListener('pagehide', () => clearInterval(intervalo), { once: true });
}
