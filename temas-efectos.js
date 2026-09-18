let temaActual;
let intervalo;
let capa;
let pausado = false;
let vuelo;
let cohete;
const reducirMovimiento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function lanzarCohete() {
  if (document.hidden || pausado || reducirMovimiento() || !capa || cohete) return;
  cohete = document.createElement('img');
  cohete.src = 'assets/cohete-profe.png';
  cohete.alt = '';
  cohete.setAttribute('aria-hidden', 'true');
  cohete.className = 'galaxia-cohete';
  document.body.append(cohete);
  vuelo = cohete.animate([
    { transform: 'translateX(-300px) rotate(-5deg)' },
    { transform: `translateX(${window.innerWidth + 300}px) rotate(-5deg)` }
  ], { duration: 9000, easing: 'linear' });
  vuelo.onfinish = detenerVuelo;
}
function detenerVuelo() {
  vuelo?.cancel(); vuelo = null;
  cohete?.remove(); cohete = null;
}
export function aplicarEfectosTema(id) {
  if (temaActual === id) return;
  temaActual = id;
  clearInterval(intervalo);
  detenerVuelo();
  capa?.remove(); capa = null;
  if (id !== 'galaxia') return;
  capa = document.createElement('div');
  capa.className = 'galaxia-efectos';
  capa.setAttribute('aria-hidden', 'true');
  document.body.prepend(capa);
  intervalo = setInterval(lanzarCohete, 60000);
}
export function alternarAnimacion() {
  pausado = !pausado;
  if (pausado) detenerVuelo();
  return pausado;
}
export const animacionPausada = () => pausado;
document.addEventListener('visibilitychange', () => { if (document.hidden) detenerVuelo(); });
