import { obtenerAgenda, obtenerUsuarios, crearCita, completarCita, eliminarCita } from './login.js';
import { accionesAlumno } from './acciones-alumno.js';
// Storage solo se carga al subir, descargar o corregir un archivo.
const entregarArchivo = async (...args) => (await import('./entregas.js')).entregarArchivo(...args);
const descargarEntrega = async (...args) => (await import('./entregas.js')).descargarEntrega(...args);
const corregirEntrega = async (...args) => (await import('./entregas.js')).corregirEntrega(...args);

export function iniciarAgenda(esAdmin) {
  const elemento = id => document.getElementById(id);
  const seccion = elemento('seccion-agenda');
  const formulario = elemento('form-cita');
  const estado = elemento('agenda-estado');
  function mostrarVista(vista) {
    for (const nombre of ['calendario', 'pendientes', 'entregadas']) {
      elemento(`vista-${nombre}`).classList.toggle('oculto', nombre !== vista);
      elemento(`ver-${nombre}`).setAttribute('aria-pressed', String(nombre === vista));
    }
  }
  for (const vista of ['calendario', 'pendientes', 'entregadas']) {
    elemento(`ver-${vista}`).addEventListener('click', () => mostrarVista(vista));
  }
  const dialogoCita = elemento('dialogo-cita');
  const dialogoDetalle = elemento('dialogo-detalle-cita');
  elemento('cerrar-detalle-cita').addEventListener('click', () => dialogoDetalle.close());
  const dialogoEntrega = elemento('dialogo-entrega');
  let tareaEntrega = null;
  let enviando = false;
  elemento('cerrar-cita').addEventListener('click', () => dialogoCita.close());
  elemento('cerrar-entrega').addEventListener('click', () => { if (!enviando) dialogoEntrega.close(); });
  dialogoEntrega.addEventListener('cancel', evento => { if (enviando) evento.preventDefault(); });
  elemento('form-entrega').addEventListener('submit', async evento => {
    evento.preventDefault();
    if (enviando || !tareaEntrega) return;
    enviando = true;
    const boton = evento.currentTarget.querySelector('[type="submit"]');
    boton.disabled = true;
    elemento('cerrar-entrega').disabled = true;
    elemento('entrega-estado').textContent = 'Subiendo archivo…';
    try {
      await entregarArchivo(tareaEntrega, elemento('archivo-entrega').files[0]);
      dialogoEntrega.close();
      mostrarVista('entregadas');
      estado.textContent = 'Tarea entregada. Tu profesora ya puede revisarla.';
      await cargar();
    } catch (error) { elemento('entrega-estado').textContent = `No se pudo entregar. ${error.message}`; }
    finally { enviando = false; boton.disabled = false; elemento('cerrar-entrega').disabled = false; }
  });
  let citas = [];
  let nombres = new Map();
  let mes = new Date();
  mes.setDate(1);
  let cargando = false;
  const fechaLocal = fecha => `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
  const crear = (etiqueta, texto, clase) => {
    const nodo = document.createElement(etiqueta);
    nodo.textContent = texto;
    if (clase) nodo.className = clase;
    return nodo;
  };

  function tarjeta(cita, compacta = false) {
    if (esAdmin && compacta) {
      const boton = crear('button', `${cita.hora || 'Sin hora'} · ${cita.titulo}`, `agenda-cita-resumen agenda-${cita.tipo}`);
      boton.type = 'button';
      boton.setAttribute('aria-haspopup', 'dialog');
      boton.setAttribute('aria-controls', 'dialogo-detalle-cita');
      boton.title = `${cita.tipo === 'clase' ? 'Clase' : 'Entrega'} · ${cita.titulo} · ${nombres.get(cita.usuario) || cita.usuario || 'Sin alumno'}`;
      boton.addEventListener('click', () => {
        elemento('detalle-cita').replaceChildren(tarjeta(cita));
        dialogoDetalle.showModal();
      });
      return boton;
    }
    const articulo = crear('article', '', `agenda-cita agenda-${cita.tipo}`);
    articulo.append(crear('strong', `${cita.tipo === 'clase' ? '● Clase' : '◆ Entrega'}${cita.completada ? (cita.tipo === 'clase' ? ' ✓ Realizada' : ' ✓ Entregada') : ''}`));
    articulo.append(crear('div', cita.titulo));
    if (cita.entrega) articulo.append(crear('small', cita.corregida ? '✓ Corregida' : '✓ Entregada · Pendiente de corrección'));
    if (cita.tipo === 'tarea') articulo.append(crear('small', cita.puntosOtorgados ? 'Recompensa ya concedida' : `${cita.puntosRecompensa ?? 10} puntos al entregar`));
    if (esAdmin) articulo.append(crear('small', nombres.get(cita.usuario) || cita.usuario || 'Sin alumno asignado'));
    const fecha = cita.fecha ? new Date(`${cita.fecha}T12:00:00`).toLocaleDateString('es-ES') : 'Sin fecha';
    articulo.append(crear('small', `${compacta ? '' : fecha + ' · '}${cita.hora || 'Sin hora'}`));
    if (!cita.completada && !cita.entrega && cita.tipo === 'tarea' && cita.fecha && new Date(`${cita.fecha}T${cita.hora || '23:59'}`) < new Date()) {
      articulo.append(crear('small', 'Plazo vencido', 'agenda-vencida'));
    }
    if (esAdmin && cita.url) {
      const enlace = crear('a', cita.tipo === 'clase' ? 'Unirse a la clase' : 'Abrir tarea');
      enlace.href = cita.url;
      enlace.target = '_blank';
      enlace.rel = 'noopener noreferrer';
      articulo.append(enlace);
    }
    if (!esAdmin) {
      articulo.append(accionesAlumno(cita, tarea => {
        tareaEntrega = tarea.id;
        elemento('form-entrega').reset();
        elemento('nombre-tarea-entrega').textContent = tarea.titulo;
        elemento('entrega-estado').textContent = '';
        dialogoEntrega.showModal();
      }));
    }
    if (cita.entrega) {
      articulo.append(crear('small', `Entregado: ${new Date(cita.entrega.fecha).toLocaleString('es-ES')} · ${cita.entrega.nombre}`));
      const descargar = crear('button', 'Abrir / descargar archivo');
      descargar.type = 'button';
      const aviso = crear('p', ''); aviso.setAttribute('role', 'status');
      descargar.addEventListener('click', async () => {
        descargar.disabled = true;
        aviso.textContent = 'Preparando archivo…';
        try {
          const { blob, nombre } = await descargarEntrega(cita.id);
          const url = URL.createObjectURL(blob);
          const enlace = crear('a', `Descargar ${nombre}`);
          enlace.href = url; enlace.download = nombre;
          aviso.replaceChildren(enlace);
          let vistaUrl;
          if (/\.pdf$/i.test(nombre)) {
            vistaUrl = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
            const ver = crear('a', 'Ver PDF');
            ver.href = vistaUrl; ver.target = '_blank'; ver.rel = 'noopener noreferrer';
            aviso.append(document.createTextNode(' · '), ver);
          }
          enlace.click();
          setTimeout(() => { URL.revokeObjectURL(url); if (vistaUrl) URL.revokeObjectURL(vistaUrl); aviso.textContent = 'Archivo descargado. Puedes abrirlo desde tus descargas.'; }, 60000);
        } catch (error) { aviso.textContent = `No se pudo abrir el archivo. ${error.message}`; }
        finally { descargar.disabled = false; }
      });
      articulo.append(descargar, aviso);
      if (cita.correccion) articulo.append(crear('p', `Corrección: ${cita.correccion}`));
      if (esAdmin && !compacta) {
        const revision = crear('form', '', 'agenda-revision');
        const label = crear('label', 'Corrección y comentarios');
        const comentario = crear('textarea', ''); comentario.required = true; comentario.maxLength = 5000; comentario.value = cita.correccion || '';
        label.append(comentario);
        const guardar = crear('button', cita.corregida ? 'Guardar corrección' : 'Corregir y conceder puntos'); guardar.type = 'submit';
        revision.append(label, guardar);
        revision.addEventListener('submit', evento => { evento.preventDefault(); modificar(guardar, () => corregirEntrega(cita.id, comentario.value), 'Corrección guardada.'); });
        articulo.append(revision);
      }
    }
    if (esAdmin) {
      const acciones = crear('div', '', 'agenda-acciones');
      if (!cita.entrega) {
        const completar = crear('button', cita.completada ? 'Marcar pendiente' : (cita.tipo === 'clase' ? 'Marcar realizada' : 'Marcar entregada'));
        completar.type = 'button';
        completar.addEventListener('click', () => modificar(completar, () => completarCita(cita.coleccion, cita.id, !cita.completada), 'Estado de la cita actualizado.'));
        acciones.append(completar);
      }
      const eliminar = crear('button', 'Eliminar');
      eliminar.type = 'button';
      eliminar.addEventListener('click', () => {
        if (window.confirm(`¿Eliminar «${cita.titulo}» de la agenda?`)) modificar(eliminar, () => eliminarCita(cita.coleccion, cita.id), 'Cita eliminada.');
      });
      acciones.append(eliminar);
      articulo.append(acciones);
    }
    return articulo;
  }

  async function modificar(boton, accion, mensaje) {
    boton.disabled = true;
    try {
      await accion();
      if (dialogoDetalle.open) dialogoDetalle.close();
      window.dispatchEvent(new Event('puntos-actualizados'));
      estado.textContent = mensaje;
      await cargar();
    } catch {
      estado.textContent = 'No se ha podido guardar el cambio. Inténtalo de nuevo.';
    } finally { boton.disabled = false; }
  }

  function pintar() {
    const pendientes = elemento('agenda-pendientes');
    pendientes.replaceChildren(...citas.filter(cita => !cita.completada && !cita.entrega).map(cita => tarjeta(cita)));
    if (!pendientes.childElementCount) pendientes.append(crear('p', 'No hay tareas pendientes.'));
    const entregadas = elemento('agenda-entregadas');
    entregadas.replaceChildren(...citas.filter(cita => cita.tipo === 'tarea' && (cita.entrega || cita.completada)).map(cita => tarjeta(cita)));
    if (!entregadas.childElementCount) entregadas.append(crear('p', 'Todavía no hay tareas entregadas.'));
    const antiguas = citas.filter(cita => !cita.fecha);
    elemento('agenda-sin-fecha').replaceChildren(...antiguas.map(cita => tarjeta(cita)));
    elemento('agenda-antiguas').hidden = antiguas.length === 0;
    elemento('agenda-mes').textContent = mes.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    const calendario = elemento('agenda-calendario');
    calendario.replaceChildren();
    for (const dia of ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']) calendario.append(crear('div', dia, 'agenda-dia-semana'));
    const inicio = new Date(mes.getFullYear(), mes.getMonth(), 1);
    const desplazamiento = (inicio.getDay() + 6) % 7;
    const dias = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
    const celdas = Math.ceil((dias + desplazamiento) / 7) * 7;
    for (let i = 0; i < celdas; i++) {
      const fecha = new Date(mes.getFullYear(), mes.getMonth(), i - desplazamiento + 1);
      const clave = fechaLocal(fecha);
      const celda = crear('div', '', 'agenda-dia');
      celda.setAttribute('aria-label', fecha.toLocaleDateString('es-ES'));
      if (fecha.getMonth() !== mes.getMonth()) celda.classList.add('agenda-otro-mes');
      if (clave === fechaLocal(new Date())) celda.classList.add('agenda-hoy');
      celda.append(crear('strong', String(fecha.getDate())));
      citas.filter(cita => cita.fecha === clave).forEach(cita => celda.append(tarjeta(cita, true)));
      calendario.append(celda);
    }
  }

  async function cargar() {
    if (cargando) return;
    cargando = true;
    elemento('agenda-actualizar').disabled = true;
    seccion.setAttribute('aria-busy', 'true');
    try {
      const [agenda, alumnos] = await Promise.all([obtenerAgenda(), esAdmin ? obtenerUsuarios() : Promise.resolve([])]);
      citas = agenda;
      nombres = new Map(alumnos.map(alumno => [alumno.usuario, alumno.nombreCompleto || alumno.usuario]));
      if (esAdmin) {
        const selector = elemento('agenda-alumno');
        const seleccionado = selector.value;
        selector.replaceChildren(new Option('Selecciona alumno', ''));
        alumnos.filter(alumno => !alumno.esAdmin).forEach(alumno => selector.add(new Option(`${alumno.nombreCompleto || alumno.usuario} (${alumno.usuario})`, alumno.usuario)));
        selector.value = seleccionado;
      }
      pintar();
    } catch {
      estado.textContent = 'No se ha podido actualizar la agenda. Pulsa «Actualizar agenda» para reintentar.';
    } finally {
      cargando = false;
      elemento('agenda-actualizar').disabled = false;
      seccion.setAttribute('aria-busy', 'false');
    }
  }

  if (esAdmin) {
    formulario.elements.tipo.addEventListener('change', () => {
      elemento('detalles-cita').classList.toggle('oculto', !formulario.elements.tipo.value);
      elemento('detalles-cita').disabled = !formulario.elements.tipo.value;
      elemento('campo-puntos-tarea').classList.toggle('oculto', formulario.elements.tipo.value !== 'tarea');
    });
    const nuevaCita = elemento('btn-nueva-cita');
    nuevaCita.classList.remove('oculto');
    nuevaCita.addEventListener('click', () => {
      elemento('cita-estado').textContent = '';
      dialogoCita.showModal();
      formulario.elements.titulo.focus();
    });
    for (let minuto = 0; minuto < 1440; minuto += 15) {
      const hora = `${String(Math.floor(minuto / 60)).padStart(2, '0')}:${String(minuto % 60).padStart(2, '0')}`;
      elemento('agenda-hora').add(new Option(hora, hora));
    }
    formulario.addEventListener('submit', async evento => {
      evento.preventDefault();
      const boton = formulario.querySelector('button[type="submit"]');
      boton.disabled = true;
      elemento('cerrar-cita').disabled = true;
      elemento('cita-estado').textContent = 'Guardando cita…';
      try {
        await crearCita(Object.fromEntries(new FormData(formulario)));
        mes = new Date(`${formulario.elements.fecha.value.slice(0, 7)}-01T12:00:00`);
        formulario.reset();
        elemento('campo-puntos-tarea').classList.add('oculto');
        elemento('detalles-cita').classList.add('oculto');
        elemento('detalles-cita').disabled = true;
        dialogoCita.close();
        mostrarVista('calendario');
        nuevaCita.focus();
        estado.textContent = 'Cita guardada y asignada al alumno seleccionado.';
        await cargar();
      } catch (error) {
        elemento('cita-estado').textContent = `No se pudo guardar la cita. ${error.message || 'Inténtalo de nuevo.'}`;
      } finally { boton.disabled = false; elemento('cerrar-cita').disabled = false; }
    });
    dialogoCita.addEventListener('cancel', evento => { if (formulario.querySelector('[type="submit"]').disabled) evento.preventDefault(); });
  }
  elemento('btn-agenda').addEventListener('click', async () => {
    const abierta = seccion.classList.contains('oculto');
    seccion.classList.toggle('oculto', !abierta);
    elemento('btn-agenda').setAttribute('aria-expanded', String(abierta));
    if (abierta) {
      mostrarVista('calendario');
      elemento('seccion-recompensas').classList.add('oculto');
      elemento('btn-recompensas').setAttribute('aria-expanded', 'false');
      elemento('seccion-chat').classList.add('oculto');
      elemento('btn-abrir-chat').setAttribute('aria-expanded', 'false');
    }
    if (abierta) { estado.textContent = 'Cargando agenda…'; await cargar(); if (estado.textContent === 'Cargando agenda…') estado.textContent = ''; }
  });
  elemento('agenda-actualizar').addEventListener('click', () => { estado.textContent = ''; cargar(); });
  elemento('mes-anterior').addEventListener('click', () => { mes.setMonth(mes.getMonth() - 1); pintar(); });
  elemento('mes-siguiente').addEventListener('click', () => { mes.setMonth(mes.getMonth() + 1); pintar(); });
  elemento('mes-hoy').addEventListener('click', () => { mes = new Date(); mes.setDate(1); pintar(); });
}
