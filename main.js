import { iniciarSesion } from './login.js';

const inputUsuario = document.getElementById('input-usuario');
const inputPassword = document.getElementById('input-password');
const checkMostrarPassword = document.getElementById('check-mostrar-password');
const btnIniciarSesion = document.getElementById('btn-iniciarSesion');
const cajaMensaje = document.getElementById('mensaje-salida');

const mostrarEnPantalla = (mensaje) => {
  cajaMensaje.textContent = mensaje;
  cajaMensaje.style.display = 'block';
};

const avisoSesion = sessionStorage.getItem('avisoSesion');
if (avisoSesion) {
  mostrarEnPantalla(avisoSesion);
  sessionStorage.removeItem('avisoSesion');
}

checkMostrarPassword.addEventListener('change', () => {
  if (checkMostrarPassword.checked) {
    inputPassword.type = 'text';
  } else {
    inputPassword.type = 'password';
  }
});

const formularioLogin = document.getElementById('formulario');
formularioLogin.addEventListener('keydown', evento => {
  if (evento.key === 'Enter' && !evento.isComposing && evento.target.tagName === 'INPUT') {
    evento.preventDefault();
    if (!btnIniciarSesion.disabled) formularioLogin.requestSubmit(btnIniciarSesion);
  }
});

formularioLogin.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  if (btnIniciarSesion.disabled) return;
  btnIniciarSesion.disabled = true;
  const usuario = inputUsuario.value;
  const password = inputPassword.value;
  
  try {
  const resultado = await iniciarSesion(usuario, password);
  
  if (resultado && resultado.success) {
    sessionStorage.setItem('esAdmin', resultado.esAdmin);
    sessionStorage.setItem('nombreUsuario', inputUsuario.value);
    window.location.href = 'menu.html';
  } else {
    mostrarEnPantalla(resultado);
  }
  } catch {
    mostrarEnPantalla('No hemos podido conectar. Vuelve a intentarlo en un momento.');
  } finally {
    btnIniciarSesion.disabled = false;
  }
});
