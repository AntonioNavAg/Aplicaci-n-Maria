// El identificador de la cuenta se conserva para acceder y mantener sus conversaciones.
export function nombreVisible(usuario, nombreCompleto = '') {
  return usuario === 'admin' ? 'María' : nombreCompleto || usuario;
}
