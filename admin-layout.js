export function organizarAdmin() {
  const el = id => document.getElementById(id);
  const crear = (tag, clase, texto = '') => {
    const nodo = document.createElement(tag);
    nodo.className = clase;
    nodo.textContent = texto;
    return nodo;
  };
  document.body.classList.add('vista-admin');
  const marco = crear('div', 'admin-layout');
  const nav = crear('nav', 'admin-nav');
  nav.setAttribute('aria-label', 'Administración');
  nav.append(crear('div', 'admin-marca', '✦ Centro de trabajo'), crear('p', 'admin-rol', 'ADMINISTRACIÓN'));
  const principal = document.querySelector('.contenedor-menu');
  const cabecera = document.querySelector('.cabecera-menu-bienvenido');
  document.body.prepend(marco);
  marco.append(nav, principal);
  principal.setAttribute('role', 'main');
  principal.querySelector(':scope > h2')?.remove();
  principal.prepend(cabecera);
  el('saludo-usuario').textContent = `Hola, ${sessionStorage.getItem('nombreUsuario') || 'profe'}`;
  cabecera.append(crear('p', 'admin-subtitulo', 'Organiza tus clases, revisa las entregas y gestiona a tus alumnos.'));
  const indicador = crear('span', 'admin-indicador', 'Panel de gestión');
  cabecera.prepend(indicador);
  const anuncios = el('seccion-anuncios');
  cabecera.after(anuncios);
  anuncios.classList.add('oculto');
  const botonTablon = crear('button', '', '📢 Tablón de anuncios');
  botonTablon.id = 'btn-tablon-admin';
  botonTablon.type = 'button';
  botonTablon.addEventListener('click', () => anuncios.classList.remove('oculto'));
  nav.append(botonTablon);
  const alerta = document.querySelector('.alerta-suscripciones');
  if (alerta) anuncios.after(alerta);
  const rutas = [
    ['btn-agenda', 'seccion-agenda', '📅 Agenda y tareas', 'DÍA A DÍA'],
    ['btn-abrir-chat', 'seccion-chat', '💬 Mensajes', null],
    ['btn-tablon-admin', 'seccion-anuncios', '📢 Tablón de anuncios', null],
    ['btn-ver-matriculados', 'lista-matriculados', '👥 Alumnos y suscripciones', 'ALUMNOS'],
    ['btn-recompensas', 'seccion-recompensas', '⭐ Gestionar puntos', null],
    ['btn-crear-cuenta-admin', 'panel-crear-cuenta', '＋ Nuevo alumno', null],
    ['btn-hacer-admin', 'lista-hacer-admin', 'Administradores', 'CUENTAS'],
    ['btn-eliminar-cuenta', 'lista-eliminar-cuenta', 'Eliminar una cuenta', null],
    ['btn-eliminar-propia-cuenta', 'confirmacion-eliminar-propia', 'Eliminar mi cuenta', null]
  ];
  for (const [id, seccion, texto, grupo] of rutas) {
    if (grupo) nav.append(crear('p', 'admin-nav-grupo', grupo));
    const boton = el(id);
    boton.textContent = texto;
    boton.classList.add('admin-nav-boton');
    boton.style.removeProperty('background-color');
    boton.style.removeProperty('color');
    boton.setAttribute('aria-controls', seccion);
    boton.setAttribute('aria-expanded', 'false');
    nav.append(boton);
    el(seccion).classList.add('admin-panel');
    boton.addEventListener('click', evento => {
      for (const [otroId, otroPanel] of rutas) {
        const actual = otroId === id;
        el(otroId).classList.toggle('admin-activo', actual);
        el(otroId).setAttribute('aria-expanded', String(actual));
        if (actual) el(otroId).setAttribute('aria-current', 'page');
        else { el(otroId).removeAttribute('aria-current'); el(otroPanel).classList.add('oculto'); }
      }
      el('confirmacion-accion').classList.add('oculto');
      if (!el(seccion).classList.contains('oculto')) evento.stopImmediatePropagation();
    }, true);
  }
  el('seccion-agenda').querySelector('h3').textContent = 'Agenda de clases y entregas';
  const pie = crear('div', 'admin-nav-pie');
  const vistaAlumno = crear('a', 'admin-vista-alumno', '🎮 Vista de alumno');
  vistaAlumno.href = 'demo-alumno.html';
  vistaAlumno.title = 'Probar con un alumno de ejemplo y todo desbloqueado';
  pie.append(vistaAlumno);
  pie.append(el('btn-cerrarSesion'));
  nav.append(pie);
  for (const grupo of principal.querySelectorAll(':scope > .botones')) {
    if (!grupo.children.length) grupo.remove();
  }
  principal.querySelector('.contenedor-boton-abajo')?.remove();
  el('btn-agenda').click();
}
