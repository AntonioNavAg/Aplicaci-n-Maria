import { prepararNavegacionMovil } from './navegacion-movil.js';
// Esta distribución se aplica exclusivamente después de comprobar el rol de alumno.
export function organizarAlumno(nombre = sessionStorage.getItem('nombreUsuario') || 'de nuevo') {
  const el = id => document.getElementById(id);
  const crear = (tag, clase, texto = '') => {
    const nodo = document.createElement(tag);
    nodo.className = clase;
    nodo.textContent = texto;
    return nodo;
  };
  document.body.classList.add('vista-alumno');
  const marco = crear('div', 'alumno-layout');
  const lateral = crear('nav', 'alumno-nav');
  lateral.setAttribute('aria-label', 'Mi aula');
  const marca = crear('div', 'alumno-marca', '✦ Mi aula');
  lateral.append(marca, crear('p', 'alumno-nav-titulo', 'APRENDE Y EXPLORA'));
  const principal = document.querySelector('.contenedor-menu');
  const cabecera = document.querySelector('.cabecera-menu-bienvenido');
  const derecha = crear('aside', 'alumno-derecha');
  derecha.setAttribute('aria-label', 'Mi personaje y novedades');
  derecha.id = 'alumno-personalizacion';
  document.body.prepend(marco);
  marco.append(lateral, principal, derecha);
  principal.querySelector(':scope > h2')?.remove();
  principal.prepend(cabecera);
  el('saludo-usuario').textContent = `¡Hola, ${nombre}!`;
  cabecera.append(crear('p', 'alumno-subtitulo', 'Tu próxima aventura empieza aprendiendo.'));
  derecha.append(crear('h2', 'alumno-panel-titulo', 'Tu personaje'));
  const perfil = document.querySelector('.perfil-lateral');
  if (perfil) derecha.append(perfil);
  const personalizar = el('btn-recompensas');
  derecha.append(personalizar);
  derecha.append(crear('p', 'alumno-consejo', 'Completa tus tareas, gana puntos y desbloquea avatares y fondos.'));
  const anuncios = el('seccion-anuncios');
  cabecera.after(anuncios);

  const rutas = new Map([
    ['btn-agenda', 'seccion-agenda'], ['btn-abrir-chat', 'seccion-chat'],
    ['btn-recompensas', 'seccion-recompensas'], ['alumno-ayuda', 'seccion-dudas']
  ]);
  function seleccionar(id) {
    for (const [boton, seccion] of rutas) {
      if (boton !== id) { el(seccion).classList.add('oculto'); el(boton).setAttribute('aria-expanded', 'false'); }
      el(boton).classList.toggle('alumno-activo', boton === id);
    }
  }
  const agenda = el('btn-agenda');
  const chat = el('btn-abrir-chat');
  chat.style.removeProperty('background-color');
  chat.style.removeProperty('color');
  agenda.textContent = '📅 Tareas y calendario';
  chat.textContent = '💬 Hablar con mi profe';
  personalizar.textContent = '🎨 Personalizar mi personaje';
  const ayuda = crear('button', '', '✉ Enviar una duda');
  ayuda.id = 'alumno-ayuda'; ayuda.type = 'button';
  ayuda.setAttribute('aria-controls', 'seccion-dudas');
  ayuda.setAttribute('aria-expanded', 'false');
  lateral.append(agenda, chat, ayuda);
  ayuda.addEventListener('click', () => { el('seccion-dudas').classList.remove('oculto'); ayuda.setAttribute('aria-expanded', 'true'); });
  for (const [boton, seccion] of rutas) {
    el(boton).addEventListener('click', evento => {
      seleccionar(boton);
      // Las opciones de navegación permanecen abiertas al volver a pulsarlas.
      if (!el(seccion).classList.contains('oculto')) evento.stopImmediatePropagation();
    }, true);
  }
  const pie = crear('div', 'alumno-nav-pie');
  pie.append(crear('p', '', 'Cada pequeño paso cuenta.'), el('btn-cerrarSesion'));
  lateral.append(pie);
  for (const grupo of principal.querySelectorAll(':scope > .botones')) {
    if (!grupo.children.length || [...grupo.children].every(nodo => nodo.classList.contains('oculto'))) grupo.classList.add('oculto');
  }
  principal.querySelector('.contenedor-boton-abajo')?.remove();
  el('seccion-dudas').classList.add('oculto');
  el('seccion-agenda').querySelector('h3').textContent = 'Tu ruta de aprendizaje';
  el('ver-calendario').textContent = '📅 Calendario';
  el('ver-pendientes').textContent = '🚀 Tareas pendientes';
  el('ver-entregadas').textContent = '✓ Tareas entregadas';
  agenda.click();
  prepararNavegacionMovil(lateral);
}
