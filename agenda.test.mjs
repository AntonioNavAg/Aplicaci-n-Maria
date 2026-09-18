import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizarCita, validarCita, ordenarCitas, enlaceSeguro } from './agenda-modelo.js';
import { saldo, cantidadPuntos, comprarOEquipar } from './recompensas-modelo.js';

test('conserva tareas antiguas y enlaces de clase sin migrar los datos', () => {
  const tarea = normalizarCita({ id: '1', nombre: 'https://example.com/test', nota: 'Tema 1', usuario: 'ana' }, 'tests');
  assert.equal(tarea.titulo, 'Tema 1');
  assert.equal(tarea.fecha, '');
  assert.equal(tarea.completada, false);
  assert.equal(tarea.tipo, 'tarea');
  assert.equal(normalizarCita({ fecha: '09-09-2026' }, 'enlaces').fecha, '2026-09-09');
  assert.equal(enlaceSeguro('javascript:alert(1)'), '');
});

test('valida alumno, tipo, fecha, hora y enlace antes de guardar', () => {
  const cita = { usuario: 'ana', tipo: 'tarea', titulo: 'Ejercicios', fecha: '2026-09-10', hora: '16:15', url: '' };
  assert.doesNotThrow(() => validarCita(cita));
  for (const cambio of [{ usuario: '' }, { tipo: 'otro' }, { titulo: ' ' }, { fecha: '2026-02-30' }, { hora: '24:00' }, { url: 'javascript:alert(1)' }]) {
    assert.throws(() => validarCita({ ...cita, ...cambio }));
  }
});

test('ordena las citas por fecha y hora, dejando las antiguas sin fecha al final', () => {
  const citas = [{ fecha: '', hora: '' }, { fecha: '2026-09-10', hora: '18:00' }, { fecha: '2026-09-10', hora: '09:00' }];
  assert.deepEqual(ordenarCitas(citas), [citas[2], citas[1], citas[0]]);
});

// Ejecuta la capa de datos con Firestore simulado, sin tocar cuentas reales.
function apiSimulada(actual) {
  const filas = {
    usuarios: [actual, { usuario: 'bea', esAdmin: false }],
    tests: [{ usuario: 'ana', titulo: 'Tarea Ana' }, { usuario: 'bea', titulo: 'Tarea Bea' }],
    enlaces: [{ usuario: 'ana', titulo: 'Clase Ana' }, { usuario: 'bea', titulo: 'Clase Bea' }]
  };
  const escrituras = [];
  const snapshot = ref => ({ exists: () => !!filas[ref.nombre][Number(ref.id)], data: () => filas[ref.nombre][Number(ref.id)] });
  const actualizar = (ref, valores) => { Object.assign(filas[ref.nombre][Number(ref.id)], valores); escrituras.push({ ref, valores }); };
  const mocks = {
    initializeApp: () => ({}), getFirestore: () => ({}),
    collection: (_, nombre) => ({ nombre }), where: (campo, operador, valor) => ({ campo, valor }),
    query: (ref, ...filtros) => ({ ...ref, filtros }),
    getDocs: async ref => {
      const datos = filas[ref.nombre].filter(fila => (ref.filtros || []).every(filtro => fila[filtro.campo] === filtro.valor));
      const docs = datos.map(dato => ({ id: String(filas[ref.nombre].indexOf(dato)), data: () => dato }));
      return { docs, empty: !docs.length, forEach: callback => docs.forEach(callback) };
    },
    sessionStorage: { getItem: () => actual.usuario },
    estadoSuscripcion: () => ({ caducada: false }),
    normalizarCita, validarCita, ordenarCitas,
    saldo, cantidadPuntos, comprarOEquipar,
    getDoc: async ref => snapshot(ref),
    runTransaction: async (_, ejecutar) => {
      const cambios = [];
      const resultado = await ejecutar({ get: async ref => snapshot(ref), update: (ref, valores) => cambios.push([ref, valores]) });
      cambios.forEach(([ref, valores]) => actualizar(ref, valores));
      return resultado;
    },
    addDoc: async (ref, dato) => escrituras.push({ ref, dato }),
    updateDoc: async (ref, valores) => actualizar(ref, valores),
    doc: (_, nombre, id) => ({ nombre, id })
  };
  const codigo = readFileSync(new URL('./login.js', import.meta.url), 'utf8').replace(/^import .*;\r?\n/gm, '').replace(/export /g, '');
  const api = new Function(...Object.keys(mocks), `${codigo}; return { obtenerAgenda, crearCita, completarTarea, completarCita, darPuntos, personalizarPerfil };`)(...Object.values(mocks));
  return { api, escrituras, filas };
}

test('el alumno solo recibe sus propias tareas y clases y no puede crearlas', async () => {
  const { api, escrituras } = apiSimulada({ usuario: 'ana', esAdmin: false });
  const agenda = await api.obtenerAgenda();
  assert.equal(agenda.length, 2);
  assert.ok(agenda.every(cita => cita.usuario === 'ana'));
  await assert.rejects(api.crearCita({}), /Solo administración/);
  await assert.rejects(api.completarTarea('1', true), /Solo administración/);
  assert.equal(escrituras.length, 0);
});

test('una entrega concede puntos una sola vez aunque se reabra', async () => {
  const { api, filas } = apiSimulada({ usuario: 'admin', esAdmin: true });
  filas.tests[1].puntosRecompensa = 25;
  await api.completarTarea('1', true);
  assert.equal(filas.usuarios[1].puntos, 25);
  await api.completarTarea('1', true);
  await api.completarTarea('1', false);
  await api.completarTarea('1', true);
  assert.equal(filas.usuarios[1].puntos, 25);
});

test('corregir una entrega guarda el comentario y premia solo una vez', async () => {
  const { api, filas } = apiSimulada({ usuario: 'admin', esAdmin: true });
  filas.tests[1].entrega = { nombre: 'tarea.pdf' };
  await api.completarCita('tests', '1', true, 'Muy bien, revisa el ejercicio 2.');
  assert.equal(filas.tests[1].corregida, true);
  assert.equal(filas.tests[1].correccion, 'Muy bien, revisa el ejercicio 2.');
  assert.equal(filas.usuarios[1].puntos, 10);
  await api.completarCita('tests', '1', true, 'Comentario actualizado.');
  assert.equal(filas.tests[1].correccion, 'Comentario actualizado.');
  assert.equal(filas.usuarios[1].puntos, 10);
});

test('la profesora concede puntos y el alumno no puede hacerlo', async () => {
  const admin = apiSimulada({ usuario: 'admin', esAdmin: true });
  await admin.api.darPuntos('1', 30);
  assert.equal(admin.filas.usuarios[1].puntos, 30);
  await assert.rejects(admin.api.darPuntos('1', -5));
  const alumno = apiSimulada({ usuario: 'ana', esAdmin: false });
  await assert.rejects(alumno.api.darPuntos('1', 30), /Solo administración/);
});

test('solo la profesora puede quitar puntos sin dejar un saldo negativo', async () => {
  const { api, filas } = apiSimulada({ usuario: 'admin', esAdmin: true });
  filas.usuarios[1].puntos = 30;
  await api.darPuntos('1', 10, 'restar');
  assert.equal(filas.usuarios[1].puntos, 20);
  await assert.rejects(api.darPuntos('1', 21, 'restar'), /solo tiene 20/);
  assert.equal(filas.usuarios[1].puntos, 20);
  await api.darPuntos('1', 20, 'restar');
  assert.equal(filas.usuarios[1].puntos, 0);
  const alumno = apiSimulada({ usuario: 'ana', esAdmin: false });
  await assert.rejects(alumno.api.darPuntos('1', 1, 'restar'), /Solo administración/);
});

test('comprar descuenta del propio saldo una vez y equipar no vuelve a cobrar', async () => {
  const { api, filas } = apiSimulada({ usuario: 'ana', esAdmin: false, puntos: 50 });
  await api.personalizarPerfil('gato');
  assert.equal(filas.usuarios[0].puntos, 30);
  assert.equal(filas.usuarios[0].avatar, 'gato');
  await api.personalizarPerfil('gato');
  assert.equal(filas.usuarios[0].puntos, 30);
  await api.personalizarPerfil('menta');
  assert.equal(filas.usuarios[0].tema, 'menta');
  await assert.rejects(api.personalizarPerfil('dragon'), /suficientes/);
  assert.equal(filas.usuarios[0].puntos, 30);
  assert.equal(filas.usuarios[1].puntos, undefined);
});

test('el administrador ve todas las citas y asigna la entrega a un único alumno', async () => {
  const { api, escrituras } = apiSimulada({ usuario: 'admin', esAdmin: true });
  assert.equal((await api.obtenerAgenda()).length, 4);
  await api.crearCita({ usuario: 'bea', tipo: 'tarea', titulo: 'Entrega', fecha: '2026-09-12', hora: '11:00', url: '' });
  assert.equal(escrituras.length, 1);
  assert.equal(escrituras[0].ref.nombre, 'tests');
  assert.equal(escrituras[0].dato.usuario, 'bea');
  await assert.rejects(api.crearCita({ usuario: 'noexiste', tipo: 'clase', titulo: 'Clase', fecha: '2026-09-12', hora: '11:00', url: '' }), /alumno válido/);
});
