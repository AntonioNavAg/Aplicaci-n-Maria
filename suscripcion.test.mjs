import test from 'node:test';
import assert from 'node:assert/strict';
import { estadoSuscripcion, calcularRenovacion } from './suscripcion.js';

test('el alumno caduca exactamente al vencer el mes y conserva su cuenta', () => {
  const alumno = { fecha: '09-08-2026', esAdmin: false };
  assert.equal(estadoSuscripcion(alumno, new Date(2026, 8, 8, 23, 59)).caducada, false);
  assert.equal(estadoSuscripcion(alumno, new Date(2026, 8, 9)).caducada, true);
  assert.equal(alumno.fecha, '09-08-2026');
});

test('el fin de mes se ajusta a febrero, incluidos años bisiestos', () => {
  assert.equal(estadoSuscripcion({ fecha: '31-01-2026' }).vencimiento.getDate(), 28);
  assert.equal(estadoSuscripcion({ fecha: '31-01-2024' }).vencimiento.getDate(), 29);
});

test('la renovación de una cuenta caducada empieza ahora y permite el acceso', () => {
  const ahora = new Date(2026, 8, 9, 12);
  const alumno = { fecha: '01-01-2026' };
  alumno.suscripcionHasta = calcularRenovacion(alumno, ahora);
  assert.equal(new Date(alumno.suscripcionHasta).getTime(), new Date(2026, 9, 9, 12).getTime());
  assert.equal(estadoSuscripcion(alumno, ahora).caducada, false);
});

test('la renovación anticipada conserva el tiempo pendiente', () => {
  const alumno = { fecha: '20-08-2026' };
  const hasta = calcularRenovacion(alumno, new Date(2026, 8, 9));
  assert.equal(new Date(hasta).getTime(), new Date(2026, 9, 20).getTime());
});

test('los administradores están exentos y las fechas inválidas requieren renovación', () => {
  assert.equal(estadoSuscripcion({ esAdmin: true, fecha: '01-01-2000' }).caducada, false);
  for (const alumno of [{}, { fecha: '31-02-2026' }, { suscripcionHasta: 'incorrecta' }]) {
    assert.equal(estadoSuscripcion(alumno).caducada, true);
    assert.ok(Number.isFinite(Date.parse(calcularRenovacion(alumno))));
  }
});
test('cancelar bloquea una suscripción vigente y renovar inicia un mes nuevo', () => {
  const ahora = new Date(2026, 8, 10);
  const usuario = { suscripcionHasta: new Date(2027, 0, 1).toISOString(), suscripcionCancelada: true };
  assert.equal(estadoSuscripcion(usuario, ahora).caducada, true);
  const hasta = calcularRenovacion(usuario, ahora);
  assert.equal(new Date(hasta).getTime(), new Date(2026, 9, 10).getTime());
  assert.equal(estadoSuscripcion({ ...usuario, suscripcionHasta: hasta, suscripcionCancelada: false }, ahora).caducada, false);
});
