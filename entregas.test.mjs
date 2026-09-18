import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function entorno(usuario = 'ana', falloSubida = false) {
  const tarea = { usuario: 'ana', completada: false };
  let subidas = 0;
  let descargas = 0;
  const mocks = {
    obtenerUsuarioActual: async () => ({ usuario, esAdmin: usuario === 'admin' }),
    estadoSuscripcion: () => ({ caducada: false }),
    db: {}, doc: () => ({}), getDoc: async () => ({ exists: () => true, data: () => tarea }),
    collection: () => ({}), query: () => ({}), where: () => ({}),
    getDocs: async () => ({ empty: false, docs: [{ id: 'alumno-1' }] }),
    getStorage: () => ({}), ref: (_, ruta) => ruta,
    uploadBytes: async () => { if (falloSubida) throw new Error('Sin conexión'); subidas++; },
    getBlob: async () => { descargas++; return new Blob(['documento']); },
    crypto: { randomUUID: () => 'archivo-1' },
    runTransaction: async (_, accion) => accion({ get: async () => ({ exists: () => true, data: () => tarea }), update: (_, campos) => Object.assign(tarea, campos) }),
    completarCita: async () => {}
  };
  const codigo = readFileSync(new URL('./entregas.js', import.meta.url), 'utf8').replace(/^import .*;\r?\n/gm, '').replace(/export /g, '');
  const api = new Function(...Object.keys(mocks), `${codigo}; return { entregarArchivo, descargarEntrega, validarArchivo };`)(...Object.values(mocks));
  return { api, tarea, subidas: () => subidas, descargas: () => descargas };
}
const archivo = { name: 'ejercicios.pdf', size: 150, type: 'application/pdf' };

test('entregar guarda el archivo y deja la tarea pendiente de corrección, sin otorgar puntos', async () => {
  const e = entorno();
  await e.api.entregarArchivo('tarea-1', archivo);
  assert.equal(e.subidas(), 1);
  assert.equal(e.tarea.entrega.nombre, archivo.name);
  assert.equal(e.tarea.completada, false);
  assert.equal(e.tarea.corregida, false);
  await assert.rejects(e.api.entregarArchivo('tarea-1', archivo), /ya está entregada/);
  assert.equal(e.subidas(), 1);
  assert.equal((await e.api.descargarEntrega('tarea-1')).nombre, archivo.name);
});

test('otro alumno no puede subir ni descargar archivos de la tarea', async () => {
  const e = entorno('bea');
  await assert.rejects(e.api.entregarArchivo('tarea-1', archivo), /No tienes acceso/);
  await assert.rejects(e.api.descargarEntrega('tarea-1'), /No tienes acceso/);
  assert.equal(e.subidas(), 0);
  assert.equal(e.descargas(), 0);
});

test('un fallo de almacenamiento no marca la tarea como entregada', async () => {
  const e = entorno('ana', true);
  await assert.rejects(e.api.entregarArchivo('tarea-1', archivo), /Sin conexión/);
  assert.equal(e.tarea.entrega, undefined);
});

test('rechaza archivos vacíos, demasiado grandes y formatos ejecutables', () => {
  const { api } = entorno();
  for (const invalido of [null, { ...archivo, size: 0 }, { ...archivo, size: 11 * 1024 * 1024 }, { ...archivo, name: 'programa.exe' }]) assert.throws(() => api.validarArchivo(invalido));
  assert.doesNotThrow(() => api.validarArchivo({ ...archivo, name: 'ejercicios.docx' }));
});
