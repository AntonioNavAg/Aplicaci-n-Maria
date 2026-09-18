let capa;
let imagenActual;
let pendiente = false;

export function progresoFondo(posicion, altura, ventana) {
  return Math.max(0, Math.min(1, posicion / Math.max(1, altura - ventana)));
}
function actualizar() {
  pendiente = false;
  if (!capa) return;
  const progreso = progresoFondo(window.scrollY, document.documentElement.scrollHeight, window.innerHeight);
  capa.style.backgroundPosition = `center ${progreso * 100}%`;
}
function programar() {
  if (!capa || pendiente) return;
  pendiente = true;
  requestAnimationFrame(actualizar);
}
export function aplicarFondoRecorrido(tema) {
  document.body.classList.toggle('fondo-con-recorrido', !!tema.imagenRecorrido);
  if (!tema.imagenRecorrido) {
    capa?.remove(); capa = null; imagenActual = null;
    return;
  }
  if (!capa) {
    capa = document.createElement('div');
    capa.className = 'fondo-recorrido';
    capa.setAttribute('aria-hidden', 'true');
    document.body.prepend(capa);
  }
  if (imagenActual !== tema.imagenRecorrido) {
    imagenActual = tema.imagenRecorrido;
    capa.style.backgroundImage = `url("${imagenActual}")`;
  }
  programar();
}
window.addEventListener('scroll', programar, { passive: true });
window.addEventListener('resize', programar);
new ResizeObserver(programar).observe(document.body);
