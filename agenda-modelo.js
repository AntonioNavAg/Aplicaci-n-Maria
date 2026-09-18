export function fechaAgenda(fecha) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(fecha || '')) return fecha;
  const antigua = /^(\d{2})-(\d{2})-(\d{4})$/.exec(fecha || '');
  return antigua ? `${antigua[3]}-${antigua[2]}-${antigua[1]}` : '';
}

export function enlaceSeguro(url) {
  try {
    const enlace = new URL(url);
    return ['https:', 'http:'].includes(enlace.protocol) ? enlace.href : '';
  } catch { return ''; }
}

export function normalizarCita(registro, coleccion) {
  return {
    ...registro,
    coleccion,
    tipo: coleccion === 'tests' ? 'tarea' : 'clase',
    titulo: registro.titulo || (coleccion === 'tests' ? registro.nota || registro.nombre || 'Tarea' : 'Clase'),
    url: enlaceSeguro(registro.url || (coleccion === 'tests' ? registro.nombre : '')),
    fecha: fechaAgenda(registro.fecha),
    hora: registro.hora || '',
    completada: registro.completada === true
  };
}

export function validarCita(cita) {
  if (!['clase', 'tarea'].includes(cita.tipo)) throw new Error('Selecciona clase o entrega de tarea.');
  if (!cita.usuario || !cita.titulo?.trim()) throw new Error('Indica un alumno y una descripción.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cita.fecha)) throw new Error('Indica una fecha válida.');
  const fecha = new Date(`${cita.fecha}T12:00:00`);
  if (!Number.isFinite(fecha.getTime()) || fecha.getDate() !== +cita.fecha.slice(8) || fecha.getMonth() + 1 !== +cita.fecha.slice(5, 7)) throw new Error('Indica una fecha válida.');
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(cita.hora)) throw new Error('Indica una hora válida.');
  if (cita.url && !enlaceSeguro(cita.url)) throw new Error('El enlace debe comenzar por https:// o http://.');
}

export function ordenarCitas(citas) {
  return [...citas].sort((a, b) => `${a.fecha || '9999'} ${a.hora}`.localeCompare(`${b.fecha || '9999'} ${b.hora}`));
}
