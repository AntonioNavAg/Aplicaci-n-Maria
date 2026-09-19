// El mismo menú sigue visible en escritorio; en móvil se abre bajo demanda.
export function prepararNavegacionMovil(nav) {
  const contenido = document.createElement('div');
  contenido.className = 'navegacion-contenido';
  contenido.id = 'navegacion-principal';
  contenido.append(...nav.childNodes);
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'navegacion-movil';
  boton.setAttribute('aria-controls', contenido.id);
  function cerrar() {
    nav.classList.remove('menu-abierto');
    boton.setAttribute('aria-expanded', 'false');
    boton.textContent = '☰ Menú';
  }
  cerrar();
  boton.addEventListener('click', () => {
    const abierto = nav.classList.toggle('menu-abierto');
    boton.setAttribute('aria-expanded', String(abierto));
    boton.textContent = abierto ? '✕ Cerrar menú' : '☰ Menú';
  });
  contenido.addEventListener('click', evento => {
    if (evento.target.closest('button, a') && matchMedia('(max-width: 760px)').matches) {
      cerrar();
      boton.focus({ preventScroll: true });
    }
  }, true);
  nav.addEventListener('keydown', evento => {
    if (evento.key === 'Escape') { cerrar(); boton.focus(); }
  });
  nav.append(boton, contenido);
}
