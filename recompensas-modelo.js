export const CATALOGO = [
  { id: 'avatar-inicial', tipo: 'avatar', nombre: 'Explorador', icono: '🙂', precio: 0 },
  { id: 'gato', tipo: 'avatar', nombre: 'Gato curioso', icono: '🐱', precio: 20 },
  { id: 'zorro', tipo: 'avatar', nombre: 'Zorro ingenioso', icono: '🦊', precio: 50 },
  { id: 'robot', tipo: 'avatar', nombre: 'Robot inventor', icono: '🤖', precio: 100 },
  { id: 'astronauta', tipo: 'avatar', nombre: 'Astronauta', icono: '🧑‍🚀', precio: 180 },
  { id: 'dragon', tipo: 'avatar', nombre: 'Dragón legendario', icono: '🐉', precio: 300 },
  { id: 'clasico', tipo: 'tema', nombre: 'Índigo', icono: '💜', precio: 0, fondo: '#e0e7ff' },
  { id: 'menta', tipo: 'tema', nombre: 'Menta', icono: '🌿', precio: 0, fondo: '#d1fae5' },
  { id: 'cielo', tipo: 'tema', nombre: 'Cielo', icono: '☁️', precio: 0, fondo: '#dbeafe' },
  { id: 'atardecer', tipo: 'tema', nombre: 'Atardecer', icono: '🌅', precio: 60, fondo: 'linear-gradient(135deg, #fde68a, #fbcfe8, #c4b5fd)' },
  { id: 'oceano', tipo: 'tema', nombre: 'Océano', icono: '🌊', precio: 120, fondo: 'radial-gradient(ellipse at top, #a5f3fc, #38bdf8, #1e40af)' },
  { id: 'galaxia', tipo: 'tema', nombre: 'Galaxia', icono: '🌌', precio: 220, fondo: 'radial-gradient(circle at 20% 30%, #a78bfa, transparent 35%), linear-gradient(135deg, #172554, #581c87, #312e81)' },
  { id: 'reino-dragon', tipo: 'tema', nombre: 'Reino del dragón', icono: '🏮', precio: 280, fondo: 'url("assets/reino-dragon.png") center / cover fixed #d4e8dd' },
  { id: 'bosque', tipo: 'tema', nombre: 'Bosque encantado', icono: '🌲', precio: 70, fondo: 'radial-gradient(ellipse at bottom left, #166534 0%, transparent 55%), linear-gradient(140deg, #ecfccb, #86efac, #065f46)' },
  { id: 'ciudad-neon', tipo: 'tema', nombre: 'Ciudad neón', icono: '🌃', precio: 140, fondo: 'repeating-linear-gradient(90deg, transparent 0 80px, #22d3ee20 81px 83px), linear-gradient(145deg, #0f172a, #3730a3, #a21caf)' },
  { id: 'azoteas', tipo: 'tema', nombre: 'Azoteas al sol', icono: '🏘️', precio: 40, fondo: 'linear-gradient(20deg, #c4b5fd 15%, transparent 15%), linear-gradient(155deg, #fef3c7, #fda4af, #a5b4fc)' },
  { id: 'tortuga', tipo: 'avatar', nombre: 'Tortuga exploradora', icono: '🐢', precio: 90 },
  { id: 'leon', tipo: 'avatar', nombre: 'León del sol', icono: '🦁', precio: 80 },
  { id: 'pinguino', tipo: 'avatar', nombre: 'Pingüino polar', icono: '🐧', precio: 130 },
  { id: 'aurora', tipo: 'tema', nombre: 'Aurora polar', icono: '🏔️', precio: 160, fondo: 'linear-gradient(125deg, transparent 20%, #6ee7b788 40%, transparent 55%), linear-gradient(155deg, #172554, #0e7490, #e0f2fe)' }
];
export const COLECCIONES = [
  { nombre: 'Gato · Azoteas al sol', ids: ['gato', 'azoteas'] },
  { nombre: 'Zorro · Bosque encantado', ids: ['zorro', 'bosque'] },
  { nombre: 'Robot · Ciudad neón', ids: ['robot', 'ciudad-neon'] },
  { nombre: 'Astronauta · Galaxia', ids: ['astronauta', 'galaxia'] },
  { nombre: 'Dragón · Reino del dragón', ids: ['dragon', 'reino-dragon'] },
  { nombre: 'Tortuga · Océano', ids: ['tortuga', 'oceano'] },
  { nombre: 'León · Atardecer', ids: ['leon', 'atardecer'] },
  { nombre: 'Pingüino · Aurora polar', ids: ['pinguino', 'aurora'] }
];
// Los mismos identificadores conservan las compras anteriores.
for (const [id, imagen] of Object.entries({ aurora: 'aurora-polar', galaxia: 'galaxia-planetas', bosque: 'bosque-magico' })) {
  const tema = CATALOGO.find(item => item.id === id);
  tema.imagenRecorrido = `assets/${imagen}.png`;
  tema.fondo = `url("${tema.imagenRecorrido}") center / cover #172554`;
}
export function saldo(usuario) { return Number.isSafeInteger(usuario.puntos) && usuario.puntos >= 0 ? usuario.puntos : 0; }
export function cantidadPuntos(valor) {
  const cantidad = Number(valor);
  if (!Number.isSafeInteger(cantidad) || cantidad < 0 || cantidad > 10000) throw new Error('Introduce entre 0 y 10.000 puntos enteros.');
  return cantidad;
}
export function comprarOEquipar(usuario, id) {
  const articulo = CATALOGO.find(item => item.id === id);
  if (!articulo) throw new Error('Artículo no disponible.');
  const comprados = Array.isArray(usuario.desbloqueados) ? usuario.desbloqueados : [];
  const coste = comprados.includes(id) ? 0 : articulo.precio;
  if (saldo(usuario) < coste) throw new Error('Todavía no tienes suficientes puntos.');
  return { puntos: saldo(usuario) - coste, desbloqueados: [...new Set([...comprados, id])],
    [articulo.tipo === 'avatar' ? 'avatar' : 'tema']: id };
}
