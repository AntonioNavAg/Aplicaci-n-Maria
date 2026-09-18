import { CATALOGO } from './recompensas-modelo.js';

const perfil = { usuario: 'alumno-demo', nombreCompleto: 'Alumno de prueba', esAdmin: false, puntos: 1000, avatar: 'avatar-inicial', tema: 'clasico', desbloqueados: CATALOGO.map(item => item.id) };
const fecha = new Date();
const hoy = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
const citas = [
  { id: 'clase-demo', coleccion: 'enlaces', tipo: 'clase', usuario: perfil.usuario, titulo: 'Clase de repaso', fecha: hoy, hora: '17:00', url: '', completada: false },
  { id: 'tarea-demo', coleccion: 'tests', tipo: 'tarea', usuario: perfil.usuario, titulo: 'Mi reto de matemáticas', fecha: hoy, hora: '18:00', url: '', completada: false, puntosRecompensa: 10 },
  { id: 'corregida-demo', coleccion: 'tests', tipo: 'tarea', usuario: perfil.usuario, titulo: 'Lectura de la semana', fecha: hoy, hora: '12:00', url: '', completada: true, puntosOtorgados: true, corregida: true, correccion: '¡Buen trabajo! Has explicado muy bien la idea principal.' }
];
export const obtenerUsuarioActual = async () => structuredClone(perfil);
export const obtenerUsuarios = async () => [structuredClone(perfil)];
export const obtenerAgenda = async () => structuredClone(citas);
export async function personalizarPerfil(id) {
  const item = CATALOGO.find(item => item.id === id);
  if (!item) throw new Error('Artículo no disponible.');
  perfil[item.tipo === 'avatar' ? 'avatar' : 'tema'] = id;
}
export const crearCita = async () => {};
export const completarCita = async () => {};
export const eliminarCita = async () => {};
export const darPuntos = async () => {};
const archivos = new Map();
export async function entregarArchivo(id, archivo) {
  if (!archivo || !archivo.size) throw new Error('Selecciona un archivo.');
  if (archivo.size > 10 * 1024 * 1024) throw new Error('El archivo no puede superar los 10 MB.');
  const cita = citas.find(cita => cita.id === id && cita.tipo === 'tarea');
  if (!cita || cita.entrega || cita.completada) throw new Error('Tarea no disponible.');
  archivos.set(id, archivo);
  cita.entrega = { nombre: archivo.name, fecha: new Date().toISOString(), tamano: archivo.size };
}
export async function descargarEntrega(id) {
  const archivo = archivos.get(id);
  if (!archivo) throw new Error('No hay archivo de prueba.');
  return { blob: archivo, nombre: archivo.name };
}
export const corregirEntrega = async () => {};
