// Acciones visibles tanto en la lista de pendientes como en el calendario.
export function accionesAlumno(cita, abrirEntrega) {
  const contenedor = document.createElement('div');
  contenedor.className = 'acciones-alumno';
  if (cita.url) {
    const enlace = document.createElement('a');
    enlace.textContent = cita.tipo === 'clase' ? 'Unirse a la clase' : 'Abrir enunciado / test';
    enlace.className = cita.tipo === 'clase' ? 'accion-alumno-principal' : 'accion-alumno-enunciado';
    enlace.href = cita.url;
    enlace.target = '_blank';
    enlace.rel = 'noopener noreferrer';
    contenedor.append(enlace);
  } else if (cita.tipo === 'clase') {
    const aviso = document.createElement('p');
    aviso.textContent = 'La profesora aún no ha añadido el enlace de esta clase.';
    contenedor.append(aviso);
  }
  if (cita.tipo === 'tarea') {
    if (!cita.entrega && !cita.completada) {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'accion-alumno-principal';
      boton.textContent = 'Entregar tarea';
      boton.addEventListener('click', () => abrirEntrega(cita));
      contenedor.append(boton);
    } else {
      const estado = document.createElement('p');
      estado.textContent = cita.corregida ? '✓ Tarea corregida' : '✓ Tarea entregada';
      contenedor.append(estado);
    }
  }
  return contenedor;
}
