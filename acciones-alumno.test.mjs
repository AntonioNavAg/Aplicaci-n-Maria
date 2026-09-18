import test from 'node:test';
import assert from 'node:assert/strict';
import { accionesAlumno } from './acciones-alumno.js';

function dibujar(cita, abrir = () => {}) {
  const anterior = globalThis.document;
  globalThis.document = { createElement: tag => ({
    tag, children: [], eventos: {},
    append(nodo) { this.children.push(nodo); },
    addEventListener(evento, accion) { this.eventos[evento] = accion; }
  }) };
  try { return accionesAlumno(cita, abrir); }
  finally { globalThis.document = anterior; }
}

test('la clase muestra una acción destacada con el enlace de la profesora', () => {
  const vista = dibujar({ tipo: 'clase', url: 'https://zoom.us/j/123' });
  const enlace = vista.children[0];
  assert.equal(enlace.textContent, 'Unirse a la clase');
  assert.equal(enlace.href, 'https://zoom.us/j/123');
  assert.equal(enlace.target, '_blank');
  assert.equal(enlace.className, 'accion-alumno-principal');
});

test('una tarea sin enlace también permite abrir su entrega', () => {
  const tarea = { id: 'tarea-1', tipo: 'tarea', completada: false };
  let seleccionada;
  const vista = dibujar(tarea, cita => { seleccionada = cita; });
  const boton = vista.children.find(nodo => nodo.tag === 'button');
  assert.equal(boton.textContent, 'Entregar tarea');
  boton.eventos.click();
  assert.equal(seleccionada.id, 'tarea-1');
});

test('un test con enlace permite abrir el enunciado y entregar un archivo', () => {
  const vista = dibujar({ tipo: 'tarea', url: 'https://example.com/test' });
  assert.equal(vista.children[0].tag, 'a');
  assert.equal(vista.children[1].textContent, 'Entregar tarea');
});

test('informa de clases sin enlace y no repite entregas ya realizadas', () => {
  const clase = dibujar({ tipo: 'clase', url: '' });
  assert.match(clase.children[0].textContent, /aún no ha añadido/);
  const tarea = dibujar({ tipo: 'tarea', entrega: { nombre: 'ejercicios.pdf' } });
  assert.equal(tarea.children.some(nodo => nodo.tag === 'button'), false);
  assert.equal(tarea.children[0].textContent, '✓ Tarea entregada');
});
