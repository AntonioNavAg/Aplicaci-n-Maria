import test from 'node:test';
import assert from 'node:assert/strict';
import { CATALOGO, COLECCIONES, comprarOEquipar } from './recompensas-modelo.js';
import { readFileSync } from 'node:fs';

test('cada recompensa de pago pertenece a una pareja de avatar y fondo', () => {
  assert.equal(new Set(CATALOGO.map(item => item.id)).size, CATALOGO.length);
  const ids = COLECCIONES.flatMap(grupo => grupo.ids);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual([...ids].sort(), CATALOGO.filter(item => item.precio > 0).map(item => item.id).sort());
  for (const grupo of COLECCIONES) assert.deepEqual(grupo.ids.map(id => CATALOGO.find(item => item.id === id).tipo), ['avatar', 'tema']);
});
test('comprar el fondo del dragón conserva el avatar y no cobra de nuevo al equiparlo', () => {
  const perfil = { puntos: 500, avatar: 'dragon', desbloqueados: ['dragon'] };
  Object.assign(perfil, comprarOEquipar(perfil, 'reino-dragon'));
  assert.equal(perfil.avatar, 'dragon');
  assert.equal(perfil.tema, 'reino-dragon');
  assert.equal(perfil.puntos, 220);
  assert.equal(comprarOEquipar(perfil, 'reino-dragon').puntos, 220);
});
test('el cohete se programa cada minuto, se pausa y se limpia al cambiar de fondo', () => {
  const nodos = [];
  let callback, periodo, cancelado = 0;
  const document = { hidden: false, addEventListener() {}, body: { prepend(n) { nodos.push(n); }, append(n) { nodos.push(n); } }, createElement() { return { setAttribute() {}, remove() { this.eliminado = true; }, animate() { return { cancel() {} }; } }; } };
  const codigo = readFileSync(new URL('./temas-efectos.js', import.meta.url), 'utf8').replace(/export /g, '');
  const api = new Function('document', 'window', 'setInterval', 'clearInterval', `${codigo}; return { aplicarEfectosTema, alternarAnimacion };`)(document, { innerWidth: 1200, matchMedia: () => ({ matches: false }) }, (fn, ms) => { callback = fn; periodo = ms; return 1; }, () => { cancelado++; });
  api.aplicarEfectosTema('galaxia');
  assert.equal(periodo, 60000);
  assert.equal(nodos.length, 1);
  callback(); assert.equal(nodos.length, 2);
  api.alternarAnimacion(); assert.equal(nodos[1].eliminado, true);
  callback(); assert.equal(nodos.length, 2);
  api.aplicarEfectosTema('menta'); assert.equal(nodos[0].eliminado, true);
  assert.ok(cancelado > 0);
});
