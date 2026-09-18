// Las cuentas antiguas conservan el plazo mensual desde su fecha de alta.
export function sumarMes(fecha) {
  const resultado = new Date(fecha);
  const dia = resultado.getDate();
  resultado.setDate(1);
  resultado.setMonth(resultado.getMonth() + 1);
  const ultimoDia = new Date(resultado.getFullYear(), resultado.getMonth() + 1, 0).getDate();
  resultado.setDate(Math.min(dia, ultimoDia));
  return resultado;
}

export function estadoSuscripcion(usuario, ahora = new Date()) {
  if (usuario.esAdmin) return { caducada: false, vencimiento: null };
  if (usuario.suscripcionCancelada) return { caducada: true, cancelada: true, vencimiento: null };
  let vencimiento;
  if (usuario.suscripcionHasta) {
    vencimiento = new Date(usuario.suscripcionHasta);
  } else {
    const partes = /^(\d{2})-(\d{2})-(\d{4})$/.exec(usuario.fecha || '');
    if (partes) {
      const fecha = new Date(+partes[3], +partes[2] - 1, +partes[1]);
      if (fecha.getDate() === +partes[1] && fecha.getMonth() === +partes[2] - 1) {
        vencimiento = sumarMes(fecha);
      }
    }
  }
  if (!vencimiento || !Number.isFinite(vencimiento.getTime())) {
    return { caducada: true, vencimiento: null };
  }
  return { caducada: ahora >= vencimiento, vencimiento };
}

export function calcularRenovacion(usuario, ahora = new Date()) {
  const estado = estadoSuscripcion(usuario, ahora);
  return sumarMes(estado.caducada ? ahora : estado.vencimiento).toISOString();
}
