import { getStorage, ref, uploadBytes, getBlob } from 'firebase/storage';
import { doc, getDoc, collection, query, where, getDocs, runTransaction } from 'firebase/firestore';
import { db, obtenerUsuarioActual, completarCita } from './login.js';
import { estadoSuscripcion } from './suscripcion.js';

export function validarArchivo(archivo) {
  if (!archivo || !archivo.size) throw new Error('Selecciona un archivo que no esté vacío.');
  if (archivo.size > 10 * 1024 * 1024) throw new Error('El archivo no puede superar los 10 MB.');
  if (!/\.(pdf|doc|docx|odt|txt|jpg|jpeg|png|ppt|pptx|xls|xlsx)$/i.test(archivo.name)) throw new Error('Usa PDF, Word, OpenDocument, texto, imagen, PowerPoint o Excel.');
}

async function accesoTarea(id) {
  const actual = await obtenerUsuarioActual();
  if (!actual || estadoSuscripcion(actual).caducada) throw new Error('Tu sesión no está disponible.');
  const referencia = doc(db, 'tests', id);
  const tarea = await getDoc(referencia);
  if (!tarea.exists() || (!actual.esAdmin && tarea.data().usuario !== actual.usuario)) throw new Error('No tienes acceso a esta tarea.');
  return { actual, referencia, tarea: tarea.data() };
}

export async function entregarArchivo(id, archivo) {
  validarArchivo(archivo);
  const { actual, referencia, tarea } = await accesoTarea(id);
  if (actual.esAdmin) throw new Error('Solo el alumno asignado puede entregar esta tarea.');
  if (tarea.entrega || tarea.completada) throw new Error('Esta tarea ya está entregada.');
  const alumnos = await getDocs(query(collection(db, 'usuarios'), where('usuario', '==', actual.usuario)));
  if (alumnos.empty) throw new Error('Alumno no disponible.');
  const ruta = `entregas/${alumnos.docs[0].id}/${id}/${crypto.randomUUID()}`;
  await uploadBytes(ref(getStorage(), ruta), archivo, { contentType: archivo.type || 'application/octet-stream', contentDisposition: 'attachment' });
  // No se guarda una URL pública: la descarga se solicita a Storage al abrirla.
  await runTransaction(db, async tx => {
    const vigente = await tx.get(referencia);
    if (!vigente.exists() || vigente.data().usuario !== actual.usuario || vigente.data().entrega || vigente.data().completada) throw new Error('La tarea ha cambiado o ya está entregada. Actualiza la agenda.');
    tx.update(referencia, { entrega: { ruta, nombre: archivo.name, tipo: archivo.type || '', fecha: new Date().toISOString(), tamano: archivo.size }, corregida: false });
  });
}

export async function descargarEntrega(id) {
  const { tarea } = await accesoTarea(id);
  if (!tarea.entrega?.ruta) throw new Error('Esta tarea no tiene archivo adjunto.');
  const blob = await getBlob(ref(getStorage(), tarea.entrega.ruta), 10 * 1024 * 1024);
  return { blob, nombre: tarea.entrega.nombre };
}

export async function corregirEntrega(id, comentario) {
  if (!comentario.trim() || comentario.length > 5000) throw new Error('Escribe una corrección de entre 1 y 5.000 caracteres.');
  await completarCita('tests', id, true, comentario.trim());
}
