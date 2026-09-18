import { iniciarAgenda } from './agenda.js';
import { organizarAlumno } from './alumno-layout.js';
import { organizarAdmin } from './admin-layout.js';
import { iniciarRecompensas } from './recompensas.js';
import { obtenerUsuarios, borrarCuentaAdmin, hacerAdmin, borrarCuenta, crearCuenta, obtenerAnuncios, crearAnuncio, borrarAnuncio, enviarMensaje, obtenerMensajes } from './login.js';
import { renovarSuscripcion, cancelarSuscripcion, obtenerUsuarioActual, obtenerNombreUsuario } from './login.js';
import { estadoSuscripcion } from './suscripcion.js';

async function comprobarAcceso() {
  try {
    const usuario = await obtenerUsuarioActual();
    if (!usuario || estadoSuscripcion(usuario).caducada) {
      sessionStorage.removeItem('esAdmin');
      sessionStorage.removeItem('nombreUsuario');
      sessionStorage.setItem('avisoSesion', 'Tu suscripción ha caducado o tu cuenta ya no está disponible. Contacta con administración para renovarla.');
      window.location.replace('index.html');
      return false;
    }
    sessionStorage.setItem('esAdmin', String(!!usuario.esAdmin));
    return true;
  } catch {
    document.body.textContent = 'No se ha podido comprobar tu suscripción. Recarga la página para volver a intentarlo.';
    return false;
  }
}

if (!await comprobarAcceso()) throw new Error('Acceso no disponible');

if (sessionStorage.getItem('esAdmin') === null) {
  window.location.replace('index.html');
}

const esAdmin = sessionStorage.getItem('esAdmin') === 'true';
const nombreGuardado = sessionStorage.getItem('nombreUsuario');
iniciarAgenda(esAdmin);
iniciarRecompensas(esAdmin);
const elementoSaludo = document.getElementById('saludo-usuario');

if (elementoSaludo && nombreGuardado) {
    elementoSaludo.textContent = `¡BIENVENID@, ${nombreGuardado.toUpperCase()}!`;
}

const btnVerMatriculados = document.getElementById('btn-ver-matriculados');
const listaContenedor = document.getElementById('lista-matriculados');
const errorEliminarPropia = document.getElementById('error-eliminar-propia');
const btnEliminarCuenta = document.getElementById('btn-eliminar-cuenta');
const listaEliminarContenedor = document.getElementById('lista-eliminar-cuenta');

const btnCrearCuentaAdmin = document.getElementById('btn-crear-cuenta-admin');
const panelCrearCuenta = document.getElementById('panel-crear-cuenta');
const inputNuevoNombre = document.getElementById('input-nuevo-nombre');
const inputNuevoUsuario = document.getElementById('input-nuevo-usuario');
const inputNuevaPassword = document.getElementById('input-nueva-password');
const inputNuevaPasswordConfirm = document.getElementById('input-nueva-password-confirm');
const errorCrearCuenta = document.getElementById('error-crear-cuenta');
const btnConfirmarCrear = document.getElementById('btn-confirmar-crear');
const btnCancelarCrear = document.getElementById('btn-cancelar-crear');

const btnHacerAdmin = document.getElementById('btn-hacer-admin');
const listaHacerAdminContenedor = document.getElementById('lista-hacer-admin');

const btnEliminarPropiaCuenta = document.getElementById('btn-eliminar-propia-cuenta');
const confirmacionEliminarPropia = document.getElementById('confirmacion-eliminar-propia');
const inputEliminarUsuario = document.getElementById('input-eliminar-usuario');
const inputEliminarPassword = document.getElementById('input-eliminar-password');
const btnConfirmarEliminar = document.getElementById('btn-confirmar-eliminar');
const btnCancelarEliminar = document.getElementById('btn-cancelar-eliminar');

const panelConfirmacion = document.getElementById('confirmacion-accion');
const tituloConfirmacion = document.getElementById('titulo-confirmacion');
const textoConfirmacion = document.getElementById('texto-confirmacion');
const btnConfirmarAccion = document.getElementById('btn-confirmar-accion');
const btnCancelarAccion = document.getElementById('btn-cancelar-accion');

const adminControlsAnuncios = document.getElementById('admin-controls-anuncios');
const inputNuevoAnuncio = document.getElementById('input-nuevo-anuncio');
const btnAnadirAnuncio = document.getElementById('btn-anadir-anuncio');
const listaAnuncios = document.getElementById('lista-anuncios');

const seccionDudas = document.getElementById('seccion-dudas');
const inputDuda = document.getElementById('input-duda');
const btnEnviarDuda = document.getElementById('btn-enviar-duda');
const mensajeDudaEstado = document.getElementById('mensaje-duda-estado');

const btnCerrarSesion = document.getElementById('btn-cerrarSesion');

const btnAbrirChat = document.getElementById('btn-abrir-chat');
const seccionChat = document.getElementById('seccion-chat');
const cajaMensajes = document.getElementById('caja-mensajes');
const inputTextoChat = document.getElementById('input-texto-chat');
const btnEnviarChat = document.getElementById('btn-enviar-chat');
const selectUsuarioChat = document.getElementById('select-usuario-chat');
const adminSelectorChat = document.getElementById('admin-selector-chat');

let usuarioChatActivo = esAdmin ? "" : "admin"; 

let accionPendiente = null;
let usuarioObjetivo = null;

if (esAdmin) {
  if (btnVerMatriculados) btnVerMatriculados.classList.remove('oculto');
  if (btnEliminarCuenta) btnEliminarCuenta.classList.remove('oculto');
  if (btnCrearCuentaAdmin) btnCrearCuentaAdmin.classList.remove('oculto');
  if (btnHacerAdmin) btnHacerAdmin.classList.remove('oculto');
  if (btnEliminarPropiaCuenta) btnEliminarPropiaCuenta.classList.remove('oculto');
  if (adminControlsAnuncios) adminControlsAnuncios.classList.remove('oculto');


} else {
  if (seccionDudas) seccionDudas.classList.remove('oculto');
}

if (btnCrearCuentaAdmin) {
  btnCrearCuentaAdmin.addEventListener('click', () => {
    if (!panelCrearCuenta.classList.contains('oculto')) {
      panelCrearCuenta.classList.add('oculto');
      return;
    }
    listaContenedor.classList.add('oculto');
    listaEliminarContenedor.classList.add('oculto');
    listaHacerAdminContenedor.classList.add('oculto');
    panelConfirmacion.classList.add('oculto');
    confirmacionEliminarPropia.classList.add('oculto');

    inputNuevoNombre.value = '';
    inputNuevoUsuario.value = '';
    inputNuevaPassword.value = '';
    inputNuevaPasswordConfirm.value = '';
    errorCrearCuenta.classList.add('oculto');

    panelCrearCuenta.classList.remove('oculto');
  });
}

if (btnConfirmarCrear) {
  btnConfirmarCrear.addEventListener('click', async () => {
    const nombre = inputNuevoNombre.value;
    const usuario = inputNuevoUsuario.value;
    const password = inputNuevaPassword.value;
    const passwordConfirm = inputNuevaPasswordConfirm.value;

    if (password !== passwordConfirm) {
      errorCrearCuenta.style.color = "#e11d48";
      errorCrearCuenta.style.backgroundColor = "#fff1f2";
      errorCrearCuenta.style.borderColor = "#ffe4e6";
      errorCrearCuenta.textContent = "Las contraseñas no coinciden.";
      errorCrearCuenta.classList.remove('oculto');
      return;
    }

    const res = await crearCuenta(nombre, usuario, password);
    if (res === "La cuenta se ha creado con éxito.") {
      errorCrearCuenta.style.color = "#10b981"; 
      errorCrearCuenta.style.backgroundColor = "#d1fae5";
      errorCrearCuenta.style.borderColor = "#a7f3d0";
      errorCrearCuenta.textContent = "¡Alumno creado correctamente!";
      errorCrearCuenta.classList.remove('oculto');
      
      inputNuevoNombre.value = '';
      inputNuevoUsuario.value = '';
      inputNuevaPassword.value = '';
      inputNuevaPasswordConfirm.value = '';

      setTimeout(() => {
        panelCrearCuenta.classList.add('oculto');
        errorCrearCuenta.style.color = "#e11d48";
        errorCrearCuenta.style.backgroundColor = "#fff1f2";
        errorCrearCuenta.style.borderColor = "#ffe4e6";
        errorCrearCuenta.classList.add('oculto');
      }, 2000);
    } else {
      errorCrearCuenta.style.color = "#e11d48";
      errorCrearCuenta.style.backgroundColor = "#fff1f2";
      errorCrearCuenta.style.borderColor = "#ffe4e6";
      errorCrearCuenta.textContent = res;
      errorCrearCuenta.classList.remove('oculto');
    }
  });
}

if (btnCancelarCrear) {
  btnCancelarCrear.addEventListener('click', () => {
    panelCrearCuenta.classList.add('oculto');
  });
}

if (btnEliminarPropiaCuenta) {
  btnEliminarPropiaCuenta.addEventListener('click', () => {
    if (!confirmacionEliminarPropia.classList.contains('oculto')) {
      confirmacionEliminarPropia.classList.add('oculto');
      return;
    }
    listaContenedor.classList.add('oculto');
    listaEliminarContenedor.classList.add('oculto');
    listaHacerAdminContenedor.classList.add('oculto');
    panelConfirmacion.classList.add('oculto');
    panelCrearCuenta.classList.add('oculto');
    
    errorEliminarPropia.classList.add('oculto');
    inputEliminarUsuario.value = '';
    inputEliminarPassword.value = '';

    confirmacionEliminarPropia.classList.remove('oculto');
  });
}

if (btnConfirmarEliminar) {
  btnConfirmarEliminar.addEventListener('click', async () => {
    const usuario = inputEliminarUsuario.value;
    const password = inputEliminarPassword.value;
    
    if (usuario && password) {
      const res = await borrarCuenta(usuario, password);
      if (res === "Exito") {
        sessionStorage.removeItem('esAdmin');
        window.location.href = 'index.html';
      } else {
        errorEliminarPropia.textContent = res;
        errorEliminarPropia.classList.remove('oculto');
      }
    } else {
      errorEliminarPropia.textContent = "Por favor, introduce tu usuario y contraseña.";
      errorEliminarPropia.classList.remove('oculto');
    }
  });
}

if (btnCancelarEliminar) {
  btnCancelarEliminar.addEventListener('click', () => {
    confirmacionEliminarPropia.classList.add('oculto');
    inputEliminarUsuario.value = '';
    inputEliminarPassword.value = '';
    errorEliminarPropia.classList.add('oculto');
  });
}

if (btnConfirmarAccion) {
  btnConfirmarAccion.addEventListener('click', async () => {
    if (accionPendiente === 'eliminar') {
      await borrarCuentaAdmin(usuarioObjetivo);
      await renderizarListaEliminar();
      if (!listaHacerAdminContenedor.classList.contains('oculto')) await renderizarListaHacerAdmin();
      if (!listaContenedor.classList.contains('oculto')) await renderizarMatriculados();
      listaEliminarContenedor.classList.remove('oculto');
    } else if (accionPendiente === 'admin') {
      await hacerAdmin(usuarioObjetivo);
      await renderizarListaHacerAdmin();
      listaHacerAdminContenedor.classList.remove('oculto');
    }
    
    panelConfirmacion.classList.add('oculto');
    accionPendiente = null;
    usuarioObjetivo = null;
  });
}

if (btnCancelarAccion) {
  btnCancelarAccion.addEventListener('click', () => {
    panelConfirmacion.classList.add('oculto');
    
    if (accionPendiente === 'eliminar') {
      listaEliminarContenedor.classList.remove('oculto');
    } else if (accionPendiente === 'admin') {
      listaHacerAdminContenedor.classList.remove('oculto');
    }
    
    accionPendiente = null;
    usuarioObjetivo = null;
  });
}

const renderizarMatriculados = async () => {
  listaContenedor.innerHTML = '<h4 style="margin-top:0; color:#17a2b8;">Cargando...</h4>';
  let usuariosDb;
  try {
    usuariosDb = (await obtenerUsuarios()).filter(user => !user.esAdmin);
  } catch {
    listaContenedor.textContent = 'No se han podido cargar los matriculados. Cierra y vuelve a abrir la lista para reintentar.';
    return;
  }
  actualizarAlerta(usuariosDb);
  
  const activas = usuariosDb.filter(user => !estadoSuscripcion(user).caducada).length;
  const canceladas = usuariosDb.filter(user => estadoSuscripcion(user).cancelada).length;
  listaContenedor.innerHTML = `<div class="matriculas-cabecera"><h3>Alumnos y suscripciones</h3><p>Consulta el acceso de cada alumno y gestiona sus renovaciones.</p></div>
    <div class="matriculas-resumen"><div><strong>${usuariosDb.length}</strong><span>Alumnos</span></div><div><strong>${activas}</strong><span>Activas</span></div><div><strong>${usuariosDb.length - activas - canceladas}</strong><span>Caducadas</span></div><div><strong>${canceladas}</strong><span>Canceladas</span></div></div>`;
  const buscador = document.createElement('input');
  buscador.type = 'search';
  buscador.placeholder = 'Buscar por nombre o usuario…';
  buscador.setAttribute('aria-label', 'Buscar alumnos');
  const listado = document.createElement('div');
  listado.className = 'matriculas-listado';
  const sinResultados = document.createElement('p');
  sinResultados.textContent = 'No se encontraron alumnos.';
  sinResultados.hidden = true;
  sinResultados.setAttribute('role', 'status');
  listaContenedor.append(buscador, listado, sinResultados);
  buscador.addEventListener('input', () => {
    const busqueda = buscador.value.trim().toLocaleLowerCase('es');
    for (const tarjeta of listado.children) tarjeta.hidden = !tarjeta.dataset.busqueda.includes(busqueda);
    sinResultados.hidden = [...listado.children].some(tarjeta => !tarjeta.hidden) || !usuariosDb.length;
  });
  usuariosDb.sort((a, b) => (a.nombreCompleto || a.usuario).localeCompare(b.nombreCompleto || b.usuario, 'es'));
  
  usuariosDb.forEach(user => {
    const nombre = user.nombreCompleto ? user.nombreCompleto : user.usuario;
    const div = document.createElement('div');
    div.className = 'matricula-tarjeta';
    div.dataset.busqueda = `${nombre} ${user.usuario}`.toLocaleLowerCase('es');
    const estado = estadoSuscripcion(user);
    const detalle = document.createElement('div');
    detalle.className = 'matricula-identidad';
    const iniciales = document.createElement('span');
    iniciales.className = 'matricula-avatar';
    iniciales.setAttribute('aria-hidden', 'true');
    iniciales.textContent = nombre.trim().split(/\s+/).slice(0, 2).map(parte => parte[0]).join('').toUpperCase();
    const datos = document.createElement('div');
    const titulo = document.createElement('strong'); titulo.textContent = nombre;
    const usuario = document.createElement('small'); usuario.textContent = `@${user.usuario}`;
    datos.append(titulo, usuario); detalle.append(iniciales, datos);
    div.appendChild(detalle);
    const informacion = document.createElement('div'); informacion.className = 'matricula-estado';
    const etiqueta = document.createElement('span');
    etiqueta.className = `matricula-insignia ${estado.cancelada ? 'cancelada' : estado.caducada ? 'caducada' : 'activa'}`;
    etiqueta.textContent = estado.cancelada ? 'Cancelada' : estado.caducada ? 'Caducada' : 'Activa';
    const fecha = document.createElement('small');
    fecha.textContent = estado.vencimiento ? `${estado.caducada ? 'Caducó' : 'Vence'} el ${estado.vencimiento.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}` : estado.cancelada ? 'Acceso suspendido' : 'Pendiente de renovación';
    if (estado.vencimiento) fecha.title = estado.vencimiento.toLocaleString('es-ES');
    informacion.append(etiqueta, fecha); div.append(informacion);
    const boton = document.createElement('button');
    boton.textContent = estado.caducada ? 'Reactivar y renovar 1 mes' : 'Renovar 1 mes';
    boton.className = 'matricula-renovar';
    const cancelar = document.createElement('button');
    cancelar.type = 'button';
    cancelar.className = 'matricula-cancelar';
    cancelar.textContent = estado.cancelada ? 'Suscripción cancelada' : 'Cancelar suscripción';
    cancelar.disabled = !!estado.cancelada;
    cancelar.addEventListener('click', async () => {
      if (!window.confirm(`¿Cancelar la suscripción de ${nombre}? Perderá el acceso hasta que la renueves.`)) return;
      cancelar.disabled = true;
      boton.disabled = true;
      cancelar.textContent = 'Cancelando…';
      try {
        await cancelarSuscripcion(user.id);
        await renderizarMatriculados();
      } catch {
        cancelar.disabled = false;
        boton.disabled = false;
        cancelar.textContent = 'No se pudo cancelar. Reintentar';
      }
    });
    boton.addEventListener('click', async () => {
      boton.disabled = true;
      cancelar.disabled = true;
      boton.textContent = 'Renovando…';
      try {
        const hasta = await renovarSuscripcion(user.id);
        await renderizarMatriculados();
        const mensaje = document.createElement('p');
        mensaje.setAttribute('role', 'status');
        mensaje.textContent = `Suscripción de ${nombre} renovada hasta ${new Date(hasta).toLocaleString('es-ES')}.`;
        listaContenedor.prepend(mensaje);
      } catch {
        boton.disabled = false;
        cancelar.disabled = !!estado.cancelada;
        boton.textContent = 'No se pudo renovar. Reintentar';
      }
    });
    const acciones = document.createElement('div'); acciones.className = 'matricula-acciones';
    acciones.append(boton, cancelar); div.append(acciones);
    listado.appendChild(div);
  });
  if (!usuariosDb.length) listaContenedor.append('No hay alumnos matriculados.');
};

const alertaSuscripciones = document.createElement('p');
alertaSuscripciones.className = 'alerta-suscripciones oculto';
alertaSuscripciones.setAttribute('role', 'status');
btnVerMatriculados?.before(alertaSuscripciones);

function actualizarAlerta(usuarios) {
  const caducados = usuarios.filter(user => !user.esAdmin && estadoSuscripcion(user).caducada);
  alertaSuscripciones.textContent = caducados.length
    ? `⚠ ${caducados.length} alumno(s) con suscripción caducada o cancelada: ${caducados.map(user => user.nombreCompleto || user.usuario).join(', ')}. Abre «Ver matriculados» para reactivar y renovar.`
    : '';
  alertaSuscripciones.classList.toggle('oculto', !caducados.length);
}

async function revisarSuscripciones() {
  if (!esAdmin) {
    await comprobarAcceso();
    return;
  }
  try {
    actualizarAlerta(await obtenerUsuarios());
  } catch {
    alertaSuscripciones.textContent = 'No se han podido comprobar las suscripciones. Se reintentará automáticamente.';
    alertaSuscripciones.classList.remove('oculto');
  }
}
revisarSuscripciones();
setInterval(revisarSuscripciones, 60000);
window.addEventListener('focus', revisarSuscripciones);

const renderizarListaEliminar = async () => {
  listaEliminarContenedor.innerHTML = '<h4 style="margin-top:0; color:#f43f5e;">Cargando...</h4>';
  const usuariosDb = await obtenerUsuarios();

  listaEliminarContenedor.innerHTML = '<h4 style="margin-top:0; color:#f43f5e;">Eliminar Usuarios</h4>';
  
  usuariosDb.forEach(user => {
    if (user.usuario !== 'admin') {
      const nombre = user.nombreCompleto ? user.nombreCompleto : user.usuario;
      const div = document.createElement('div');
      div.className = 'item-matriculado';
      div.textContent = `${nombre} (${user.usuario})`;

      const btnEliminar = document.createElement('button');
      btnEliminar.textContent = 'Eliminar';
      btnEliminar.className = 'btn-eliminar-item';
      
      btnEliminar.addEventListener('click', () => {
        accionPendiente = 'eliminar';
        usuarioObjetivo = user.usuario;
        tituloConfirmacion.textContent = 'Confirmar eliminación';
        tituloConfirmacion.style.color = '#f43f5e';
        textoConfirmacion.textContent = `¿Estás seguro de que quieres eliminar a ${nombre}?`;
        btnConfirmarAccion.style.backgroundColor = '#f43f5e';
        btnConfirmarAccion.textContent = 'Eliminar';
        
        listaEliminarContenedor.classList.add('oculto');
        panelConfirmacion.classList.remove('oculto');
      });

      div.appendChild(btnEliminar);
      listaEliminarContenedor.appendChild(div);
    }
  });
};

const renderizarListaHacerAdmin = async () => {
  listaHacerAdminContenedor.innerHTML = '<h4 style="margin-top:0; color:#10b981;">Cargando...</h4>';
  const usuariosDb = await obtenerUsuarios();

  listaHacerAdminContenedor.innerHTML = '<h4 style="margin-top:0; color:#10b981;">Añadir Administrador</h4>';
  
  usuariosDb.forEach(user => {
    if (!user.esAdmin) {
      const nombre = user.nombreCompleto ? user.nombreCompleto : user.usuario;
      const div = document.createElement('div');
      div.className = 'item-matriculado';
      div.textContent = `${nombre} (${user.usuario})`;

      const btnHacer = document.createElement('button');
      btnHacer.textContent = 'Hacer Admin';
      btnHacer.className = 'btn-hacer-admin-item';
      
      btnHacer.addEventListener('click', () => {
        accionPendiente = 'admin';
        usuarioObjetivo = user.usuario;
        tituloConfirmacion.textContent = 'Confirmar administrador';
        tituloConfirmacion.style.color = '#10b981';
        textoConfirmacion.textContent = `¿Estás seguro de que quieres hacer administrador a ${nombre}?`;
        btnConfirmarAccion.style.backgroundColor = '#10b981';
        btnConfirmarAccion.textContent = 'Hacer Admin';
        
        listaHacerAdminContenedor.classList.add('oculto');
        panelConfirmacion.classList.remove('oculto');
      });

      div.appendChild(btnHacer);
      listaHacerAdminContenedor.appendChild(div);
    }
  });
};

if (btnVerMatriculados) {
  btnVerMatriculados.addEventListener('click', async () => {
    if (!listaContenedor.classList.contains('oculto')) {
      listaContenedor.classList.add('oculto');
      return;
    }
    confirmacionEliminarPropia.classList.add('oculto');
    listaEliminarContenedor.classList.add('oculto');
    listaHacerAdminContenedor.classList.add('oculto');
    panelConfirmacion.classList.add('oculto');
    panelCrearCuenta.classList.add('oculto');
    
    listaContenedor.classList.remove('oculto');
    await renderizarMatriculados();
  });
}

if (btnEliminarCuenta) {
  btnEliminarCuenta.addEventListener('click', async () => {
    if (!listaEliminarContenedor.classList.contains('oculto')) {
      listaEliminarContenedor.classList.add('oculto');
      return;
    }
    confirmacionEliminarPropia.classList.add('oculto');
    listaContenedor.classList.add('oculto');
    listaHacerAdminContenedor.classList.add('oculto');
    panelConfirmacion.classList.add('oculto');
    panelCrearCuenta.classList.add('oculto');
    
    listaEliminarContenedor.classList.remove('oculto');
    await renderizarListaEliminar();
  });
}

if (btnHacerAdmin) {
  btnHacerAdmin.addEventListener('click', async () => {
    if (!listaHacerAdminContenedor.classList.contains('oculto')) {
      listaHacerAdminContenedor.classList.add('oculto');
      return;
    }
    confirmacionEliminarPropia.classList.add('oculto');
    listaContenedor.classList.add('oculto');
    listaEliminarContenedor.classList.add('oculto');
    panelConfirmacion.classList.add('oculto');
    panelCrearCuenta.classList.add('oculto');
    
    listaHacerAdminContenedor.classList.remove('oculto');
    await renderizarListaHacerAdmin();
  });
}

const renderizarAnuncios = async () => {
  if (!listaAnuncios) return;
  listaAnuncios.innerHTML = '<p style="text-align: center; color: #b45309; font-weight: bold;">Cargando anuncios...</p>';
  
  const anunciosDb = await obtenerAnuncios();
  anunciosDb.sort((a, b) => b.timestamp - a.timestamp);
  
  listaAnuncios.innerHTML = '';
  
  if (anunciosDb.length === 0) {
    listaAnuncios.innerHTML = '<p style="text-align: center; color: #92400e; font-style: italic;">No hay anuncios en este momento.</p>';
    return;
  }

  anunciosDb.forEach(anuncio => {
    const div = document.createElement('div');
    div.style.backgroundColor = 'white';
    div.style.padding = '15px';
    div.style.borderRadius = '12px';
    div.style.marginBottom = '10px';
    div.style.border = '1px solid #fde68a';
    div.style.boxShadow = '0 2px 4px rgba(245, 158, 11, 0.05)';
    div.style.display = 'flex';
    div.style.flexDirection = 'column';
    div.style.gap = '5px';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'flex-start';

    const fechaP = document.createElement('small');
    fechaP.textContent = anuncio.fecha;
    fechaP.style.color = '#92400e';
    fechaP.style.fontWeight = 'bold';

    const textoP = document.createElement('p');
    textoP.textContent = anuncio.mensaje;
    textoP.style.margin = '5px 0 0 0';
    textoP.style.color = '#334155';
    textoP.style.fontSize = '15px';

    header.appendChild(fechaP);

    if (esAdmin) {
      const btnBorrar = document.createElement('button');
      btnBorrar.textContent = '✖';
      btnBorrar.style.backgroundColor = 'transparent';
      btnBorrar.style.color = '#ef4444';
      btnBorrar.style.border = 'none';
      btnBorrar.style.cursor = 'pointer';
      btnBorrar.style.padding = '0 5px';
      btnBorrar.style.fontSize = '16px';
      btnBorrar.style.boxShadow = 'none';
      btnBorrar.style.minWidth = 'auto';
      
      btnBorrar.addEventListener('click', async () => {
        await borrarAnuncio(anuncio.id);
        await renderizarAnuncios();
      });
      header.appendChild(btnBorrar);
    }

    div.appendChild(header);
    div.appendChild(textoP);
    listaAnuncios.appendChild(div);
  });
}

if (btnAnadirAnuncio) {
  btnAnadirAnuncio.addEventListener('click', async () => {
    const mensaje = inputNuevoAnuncio.value.trim();
    if (mensaje) {
      btnAnadirAnuncio.textContent = '...';
      btnAnadirAnuncio.disabled = true;
      await crearAnuncio(mensaje);
      await renderizarAnuncios();
      inputNuevoAnuncio.value = '';
      btnAnadirAnuncio.textContent = 'Publicar';
      btnAnadirAnuncio.disabled = false;
    }
  });
}

renderizarAnuncios();

if (btnEnviarDuda) {
  btnEnviarDuda.addEventListener('click', async () => {
    const duda = inputDuda.value.trim();
    if (!duda) return;

    mensajeDudaEstado.textContent = "Enviando mensaje...";
    mensajeDudaEstado.style.color = "#3b82f6";
    mensajeDudaEstado.classList.remove('oculto');
    btnEnviarDuda.disabled = true;

    try {
      const respuesta = await fetch("https://formsubmit.co/ajax/eduardo.terry.8@gmail.com", {
        method: "POST",
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            Alumno: nombreGuardado || "Alumno",
            Mensaje: duda,
            _subject: "AppVideoClases: Nueva duda de " + (nombreGuardado || "un alumno")
        })
      });

      if (respuesta.ok) {
        mensajeDudaEstado.textContent = "¡Duda enviada correctamente a la profesora!";
        mensajeDudaEstado.style.color = "#10b981";
        inputDuda.value = '';
      } else {
        throw new Error("Error");
      }
    } catch (error) {
      mensajeDudaEstado.textContent = "Hubo un error al enviar. Inténtalo más tarde.";
      mensajeDudaEstado.style.color = "#e11d48";
    } finally {
      btnEnviarDuda.disabled = false;
      setTimeout(() => {
        mensajeDudaEstado.classList.add('oculto');
      }, 5000);
    }
  });
}



if (btnCerrarSesion) {
  btnCerrarSesion.addEventListener('click', () => {
    sessionStorage.removeItem('esAdmin');
    window.location.href = 'index.html';
  });
}

if (esAdmin) {
    adminSelectorChat.classList.remove('oculto');
    obtenerUsuarios().then(usuarios => {
        let optionsHTML = '<option value="">-- Selecciona alumno --</option>';
        usuarios.forEach(u => { if (!u.esAdmin) optionsHTML += `<option value="${u.usuario}">${u.nombreCompleto || u.usuario}</option>`; });
        selectUsuarioChat.innerHTML = optionsHTML;
    });
}

const nombresChat = new Map();
let cargaChat = 0;
const cargarChat = async () => {
    if (!usuarioChatActivo) return;
    const cargaActual = ++cargaChat;
    const mensajes = await obtenerMensajes(nombreGuardado, usuarioChatActivo);
    await Promise.all([...new Set(mensajes.map(m => m.emisor))].filter(usuario => usuario !== nombreGuardado && !nombresChat.has(usuario)).map(async usuario => {
      try { nombresChat.set(usuario, await obtenerNombreUsuario(usuario)); }
      catch { /* Si no se puede consultar el nombre, se muestra el usuario. */ }
    }));
    if (cargaActual !== cargaChat) return;
    cajaMensajes.innerHTML = "";
    mensajes.forEach(m => {
        const div = document.createElement('div');
        const soyYo = m.emisor === nombreGuardado;
        div.style.alignSelf = soyYo ? 'flex-end' : 'flex-start';
        div.style.backgroundColor = soyYo ? '#ddd6fe' : '#f3f4f6';
        div.style.padding = '8px 12px';
        div.style.borderRadius = '12px';
        div.style.maxWidth = '80%';
        const cabecera = document.createElement('div');
        cabecera.className = 'chat-cabecera-mensaje';
        const remitente = document.createElement('strong');
        remitente.textContent = soyYo ? 'Tú' : nombresChat.get(m.emisor) || m.emisor;
        const fecha = document.createElement('time');
        fecha.textContent = m.fechaLegible || '';
        if (Number.isFinite(m.fecha)) fecha.dateTime = new Date(m.fecha).toISOString();
        cabecera.append(remitente, fecha);
        const texto = document.createElement('div');
        texto.className = 'chat-texto-mensaje';
        texto.textContent = m.texto;
        div.append(cabecera, texto);
        cajaMensajes.appendChild(div);
    });
    cajaMensajes.scrollTop = cajaMensajes.scrollHeight;
};

btnAbrirChat.addEventListener('click', () => {
    seccionChat.classList.toggle('oculto');
    const abierto = !seccionChat.classList.contains('oculto');
    btnAbrirChat.setAttribute('aria-expanded', String(abierto));
    if (abierto) {
      document.getElementById('seccion-recompensas').classList.add('oculto');
      document.getElementById('btn-recompensas').setAttribute('aria-expanded', 'false');
      document.getElementById('seccion-agenda').classList.add('oculto');
      document.getElementById('btn-agenda').setAttribute('aria-expanded', 'false');
      cargarChat();
    }
});

selectUsuarioChat?.addEventListener('change', (e) => {
    usuarioChatActivo = e.target.value;
    cargarChat();
});

btnEnviarChat.addEventListener('click', async () => {
    if (btnEnviarChat.disabled) return;
    const texto = inputTextoChat.value.trim();
    if (texto && usuarioChatActivo) {
      btnEnviarChat.disabled = true;
      const original = inputTextoChat.value;
      try {
        await enviarMensaje(nombreGuardado, usuarioChatActivo, texto);
        if (inputTextoChat.value === original) inputTextoChat.value = "";
        cargarChat();
      } catch {
        alert('No se pudo enviar el mensaje. Inténtalo de nuevo.');
      } finally {
        btnEnviarChat.disabled = false;
      }
    } else if (!usuarioChatActivo) {
        alert("Selecciona un alumno primero");
    }
});

inputTextoChat.addEventListener('keydown', evento => {
    if (evento.key === 'Enter' && !evento.isComposing) {
        evento.preventDefault();
        if (!evento.repeat) btnEnviarChat.click();
    }
});

if (!esAdmin) organizarAlumno();
else organizarAdmin();
