import { obtenerUsuarioActual, obtenerUsuarios, darPuntos, personalizarPerfil } from './login.js';
import { CATALOGO, COLECCIONES, saldo } from './recompensas-modelo.js';
import { aplicarEfectosTema, alternarAnimacion, animacionPausada } from './temas-efectos.js';
import { aplicarFondoRecorrido } from './fondos-recorrido.js';

export function iniciarRecompensas(esAdmin) {
  const panel = document.getElementById('seccion-recompensas');
  const abrir = document.getElementById('btn-recompensas');
  const crear = (tag, texto, clase) => {
    const nodo = document.createElement(tag);
    nodo.textContent = texto;
    if (clase) nodo.className = clase;
    return nodo;
  };
  const mensaje = crear('p', '');
  mensaje.setAttribute('role', 'status');
  const contenido = crear('div', '');
  panel.append(crear('h3', esAdmin ? 'Puntos de mis alumnos' : 'Mi avatar y fondos'), mensaje, contenido);
  abrir.textContent = esAdmin ? 'Puntos de alumnos' : 'Mi avatar y fondos';
  let perfil;
  let ocupado = false;
  let lateral;
  if (!esAdmin) {
    lateral = crear('aside', '', 'perfil-lateral');
    lateral.setAttribute('aria-label', 'Mi perfil');
    document.querySelector('.cabecera-menu-bienvenido').before(lateral);
  }
  function pintarPerfil() {
    const avatar = CATALOGO.find(item => item.tipo === 'avatar' && item.id === perfil.avatar) || CATALOGO[0];
    const tema = CATALOGO.find(item => item.tipo === 'tema' && item.id === perfil.tema) || CATALOGO.find(item => item.id === 'clasico');
    document.body.style.background = tema.fondo;
    aplicarFondoRecorrido(tema);
    aplicarEfectosTema(tema.id);
    lateral.replaceChildren(crear('div', avatar.icono, 'perfil-avatar'), crear('strong', perfil.nombreCompleto || perfil.usuario), crear('p', `⭐ ${saldo(perfil)} puntos`));
    const boton = crear('button', 'Personalizar');
    boton.type = 'button';
    boton.addEventListener('click', () => { if (panel.classList.contains('oculto')) abrir.click(); panel.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    lateral.append(boton);
  }
  function celebrarDesbloqueo(item) {
    const dialogo = crear('dialog', '', 'premio-desbloqueado');
    const titulo = crear('h3', '¡Enhorabuena!');
    titulo.id = 'premio-titulo';
    dialogo.setAttribute('aria-labelledby', titulo.id);
    const vista = crear('div', item.tipo === 'avatar' ? item.icono : '', 'premio-vista');
    vista.setAttribute('aria-hidden', 'true');
    if (item.fondo) vista.style.background = item.fondo;
    const texto = crear('p', `Has desbloqueado ${item.tipo === 'avatar' ? 'el avatar' : 'el fondo'} «${item.nombre}». ¡Ya es tuyo!`);
    const cerrar = crear('button', '¡Genial!');
    cerrar.type = 'button';
    cerrar.addEventListener('click', () => dialogo.close());
    dialogo.append(vista, titulo, texto, cerrar);
    dialogo.addEventListener('close', () => {
      dialogo.remove();
      contenido.querySelector(`[data-articulo="${item.id}"]`)?.focus();
    });
    document.body.append(dialogo);
    dialogo.showModal();
  }
  async function accion(boton, ejecutar, desbloqueo = null) {
    if (ocupado) return;
    ocupado = true;
    boton.disabled = true;
    mensaje.textContent = 'Guardando…';
    try {
      const resultado = await ejecutar();
      mensaje.textContent = 'Guardado correctamente.';
      await cargar();
      if (desbloqueo && resultado?.nuevoDesbloqueo) celebrarDesbloqueo(desbloqueo);
    } catch (error) { mensaje.textContent = error.message || 'No se ha podido guardar. Inténtalo de nuevo.'; }
    finally { ocupado = false; boton.disabled = false; }
  }
  function pintarTienda() {
    contenido.replaceChildren(crear('p', `Tienes ${saldo(perfil)} puntos. Gánalos con tus tareas y las recompensas de tu profesora. Los artículos comprados son tuyos para siempre.`));
    contenido.append(crear('p', 'Colecciones: cada pareja combina un avatar y un fondo. Se desbloquean por separado y puedes mezclarlos como quieras.'));
    if (perfil.tema === 'galaxia') {
      const pausar = crear('button', animacionPausada() ? 'Activar cohete' : 'Pausar cohete');
      pausar.type = 'button';
      pausar.addEventListener('click', () => { pausar.textContent = alternarAnimacion() ? 'Activar cohete' : 'Pausar cohete'; });
      contenido.append(pausar);
    }
    const grupos = [{ nombre: 'Tu equipo inicial · Gratis', ids: CATALOGO.filter(item => item.precio === 0).map(item => item.id) }, ...COLECCIONES];
    for (const grupo of grupos) {
      contenido.append(crear('h4', grupo.nombre));
      const grid = crear('div', '', 'tienda-grid');
      grupo.ids.map(id => CATALOGO.find(item => item.id === id)).forEach(item => {
        const tipo = item.tipo;
        const adquirido = item.precio === 0 || (perfil.desbloqueados || []).includes(item.id);
        const equipado = item.id === (tipo === 'avatar' ? perfil.avatar || 'avatar-inicial' : perfil.tema || 'clasico');
        const tarjeta = crear('article', '', `tienda-item${adquirido ? '' : ' bloqueado'}`);
        const vista = crear('div', item.icono, 'tienda-vista');
        if (item.fondo) vista.style.background = item.fondo;
        if (item.imagenRecorrido) {
          vista.classList.add('tienda-paisaje');
          tarjeta.append(crear('small', 'Descubre el paisaje al subir y bajar por la página.'));
        }
        if (item.id === 'galaxia') vista.classList.add('tienda-galaxia');
        tarjeta.append(crear('small', tipo === 'avatar' ? 'AVATAR' : 'FONDO', 'tienda-tipo'));
        if (item.id === 'galaxia') tarjeta.append(crear('small', 'Estrellas y la profe en cohete cada minuto.'));
        tarjeta.append(vista, crear('h4', item.nombre), crear('p', adquirido ? (item.precio ? 'Desbloqueado' : 'Gratis') : `🔒 ${item.precio} puntos`));
        const boton = crear('button', equipado ? 'En uso' : adquirido ? 'Usar' : `Comprar · ${item.precio} puntos`);
        boton.type = 'button';
        boton.dataset.articulo = item.id;
        boton.disabled = equipado || (!adquirido && saldo(perfil) < item.precio);
        if (!adquirido && saldo(perfil) < item.precio) tarjeta.append(crear('small', `Te faltan ${item.precio - saldo(perfil)} puntos`));
        boton.addEventListener('click', () => accion(boton, () => personalizarPerfil(item.id), item));
        tarjeta.append(boton);
        grid.append(tarjeta);
      });
      contenido.append(grid);
    }
  }
  async function cargar() {
    try {
      if (!esAdmin) {
        perfil = await obtenerUsuarioActual();
        if (!perfil) throw new Error('No se ha podido cargar tu perfil.');
        pintarPerfil();
        pintarTienda();
      } else {
        const alumnos = (await obtenerUsuarios()).filter(user => !user.esAdmin);
        contenido.replaceChildren(crear('p', 'Concede puntos extra manualmente. Las entregas premiadas suman sus puntos automáticamente una sola vez.'));
        if (!alumnos.length) contenido.append(crear('p', 'No hay alumnos matriculados.'));
        alumnos.forEach(alumno => {
          const fila = crear('form', '', 'fila-puntos');
          fila.append(crear('strong', `${alumno.nombreCompleto || alumno.usuario} (${alumno.usuario})`), crear('span', `⭐ ${saldo(alumno)} puntos`));
          const label = crear('label', 'Cantidad de puntos');
          const input = crear('input', '');
          input.type = 'number'; input.min = '1'; input.max = '10000'; input.step = '1'; input.value = '10'; input.required = true;
          label.append(input);
          const boton = crear('button', 'Dar puntos'); boton.type = 'submit';
          const quitar = crear('button', 'Quitar puntos'); quitar.type = 'submit';
          quitar.className = 'btn-quitar-puntos';
          quitar.disabled = saldo(alumno) === 0;
          fila.append(label, boton, quitar);
          fila.addEventListener('submit', evento => {
            evento.preventDefault();
            const resta = evento.submitter === quitar;
            accion(resta ? quitar : boton, () => darPuntos(alumno.id, input.value, resta ? 'restar' : 'sumar'));
          });
          contenido.append(fila);
        });
      }
    } catch (error) { mensaje.textContent = error.message || 'No se ha podido cargar. Vuelve a abrir esta sección.'; }
  }
  abrir.addEventListener('click', () => {
    const visible = panel.classList.contains('oculto');
    panel.classList.toggle('oculto', !visible);
    abrir.setAttribute('aria-expanded', String(visible));
    if (visible) {
      for (const [seccion, boton] of [['seccion-agenda', 'btn-agenda'], ['seccion-chat', 'btn-abrir-chat']]) {
        document.getElementById(seccion).classList.add('oculto');
        document.getElementById(boton).setAttribute('aria-expanded', 'false');
      }
      cargar();
    }
  });
  window.addEventListener('puntos-actualizados', cargar);
  window.addEventListener('focus', () => { if (!esAdmin || !panel.classList.contains('oculto')) cargar(); });
  if (!esAdmin) cargar();
}
