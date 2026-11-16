import test from 'node:test';
import assert from 'node:assert/strict';
import { enviarAvisoChat } from './aviso-chat.js';

test('envía un aviso sin incluir el contenido del chat y comprueba la aceptación', async () => {
  let cuerpo;
  await enviarAvisoChat('alumno', 'https://aula.example/menu.html', async (_url, opciones) => {
    cuerpo = JSON.parse(opciones.body);
    return { ok: true, json: async () => ({ success: 'true' }) };
  });
  assert.equal(cuerpo.Alumno, 'alumno');
  assert.equal(cuerpo.Plataforma, 'https://aula.example/menu.html');
  assert.equal(Object.hasOwn(cuerpo, 'texto'), false);
});
test('no anuncia éxito cuando el proveedor rechaza aunque HTTP sea 200', async () => {
  await assert.rejects(enviarAvisoChat('alumno', 'https://aula.example', async () => ({ ok: true, json: async () => ({ success: 'false' }) })));
});
test('un error HTTP o de red permite informar del fallo', async () => {
  await assert.rejects(enviarAvisoChat('alumno', '', async () => ({ ok: false, json: async () => ({ success: true }) })));
  await assert.rejects(enviarAvisoChat('alumno', '', async () => { throw new Error('offline'); }));
});
test('no envía sin identificar al alumno', async () => {
  await assert.rejects(enviarAvisoChat('', '', async () => assert.fail('No debe enviar')));
});
