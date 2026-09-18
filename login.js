import { format } from 'date-fns';
import { estadoSuscripcion, calcularRenovacion } from './suscripcion.js';
import { normalizarCita, validarCita, ordenarCitas } from './agenda-modelo.js';
import { saldo, cantidadPuntos, comprarOEquipar } from './recompensas-modelo.js';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, getDoc, runTransaction, addDoc, deleteDoc, updateDoc, doc, query, where } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCkY1Ysfd41xuy6xUNUpGHChFNQrr1rgBk",
  authDomain: "appvideoclases.firebaseapp.com",
  projectId: "appvideoclases",
  storageBucket: "appvideoclases.firebasestorage.app",
  messagingSenderId: "965834988246",
  appId: "1:965834988246:web:fa293b5f0e2d50bd968777"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const cuentaCreada = async (usuario) => {
  const q = query(collection(db, "usuarios"), where("usuario", "==", usuario));
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
};

export const crearCuenta = async (nombreCompleto, usuario, contraseña) => {
  const regexUsuario = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]{1,20}$/;
  const regexPassword = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]{9,20}$/;
  const regexNombre = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]{1,50}$/;

  if (!nombreCompleto || nombreCompleto.trim() === "") {
    return "El nombre y apellidos son obligatorios.";
  }

  if(!regexNombre.test(nombreCompleto)){
    return "El nombre y apellidos solo debe de incluir letras (Como máximo 50).";
  }

  if (!regexUsuario.test(usuario)) {
    return "El nombre de usuario solo permite letras y números. La longitud debe de ser mínimo 1 caracter y máximo 20.";
  }

  if (!regexPassword.test(contraseña)) {
    return "La contraseña solo permite letras y números. La longitud debe de ser mínimo 9 caracteres y máximo 20.";
  }

  const existe = await cuentaCreada(usuario);
  if (existe) {
    return "El usuario ya existe.";
  }

  let fecha = new Date();
  let fechaFormateada = format(fecha, 'dd-MM-yyyy');

  await addDoc(collection(db, "usuarios"), {
    nombreCompleto: nombreCompleto,
    usuario: usuario,
    password: contraseña,
    fecha: fechaFormateada,
    esAdmin: false
  });

  return "La cuenta se ha creado con éxito.";
}

export const esUnicoAdmin = async () => {
  const q = query(collection(db, "usuarios"), where("esAdmin", "==", true));
  const querySnapshot = await getDocs(q);
  return querySnapshot.size === 1;
}

export const borrarCuenta = async (usuario, contraseña) => {
  const q = query(collection(db, "usuarios"), where("usuario", "==", usuario), where("password", "==", contraseña));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return "No se encontró el usuario o la contraseña es incorrecta.";
  }

  let docId = null;
  let esAdmin = false;
  
  querySnapshot.forEach((doc) => {
    docId = doc.id;
    esAdmin = doc.data().esAdmin;
  });

  if (esAdmin) {
    const unico = await esUnicoAdmin();
    if (unico) {
      return "Eres el único admin, no puedes borrar tu cuenta.";
    }
  }

  await deleteDoc(doc(db, "usuarios", docId));
  return "Exito";
}

export const iniciarSesion = async (usuario, contraseña) => {
  const dbRef = collection(db, "usuarios");
  const snapshotAll = await getDocs(dbRef);
  
  if (snapshotAll.empty && usuario === 'admin' && contraseña === '123') {
     await addDoc(dbRef, {
        nombreCompleto: 'Admin Predeterminado',
        usuario: 'admin',
        password: '123',
        fecha: format(new Date(), 'dd-MM-yyyy'),
        esAdmin: true
     });
  }

  const q = query(dbRef, where("usuario", "==", usuario), where("password", "==", contraseña));
  const querySnapshot = await getDocs(q);

  if(querySnapshot.empty){
    const qUser = query(dbRef, where("usuario", "==", usuario));
    const userSnap = await getDocs(qUser);
    if(userSnap.empty) {
        return "El usuario o la contraseña son incorrectos. Inténtelo de nuevo.";
    }
    return "La contraseña es incorrecta. Inténtelo de nuevo.";
  }

  let userData = null;
  querySnapshot.forEach((doc) => {
    userData = doc.data();
  });

  if (estadoSuscripcion(userData).caducada) {
    return "Tu suscripción ha caducado. Contacta con administración para renovarla.";
  }
  
  return { success: true, esAdmin: userData.esAdmin };
}

export const obtenerUsuarios = async () => {
  const querySnapshot = await getDocs(collection(db, "usuarios"));
  let usuarios = [];
  querySnapshot.forEach((doc) => {
    usuarios.push({ id: doc.id, ...doc.data() });
  });
  return usuarios;
}

export const obtenerAgenda = async () => {
  const actual = await obtenerUsuarioActual();
  if (!actual || estadoSuscripcion(actual).caducada) throw new Error('La sesión no está disponible.');
  const resultados = await Promise.all(['tests', 'enlaces'].map(async nombre => {
    const referencia = collection(db, nombre);
    const consulta = actual.esAdmin ? referencia : query(referencia, where('usuario', '==', actual.usuario));
    const snapshot = await getDocs(consulta);
    return snapshot.docs.map(documento => normalizarCita({ ...documento.data(), id: documento.id }, nombre));
  }));
  return ordenarCitas(resultados.flat());
};

async function comprobarAdministradorAgenda() {
  const actual = await obtenerUsuarioActual();
  if (!actual?.esAdmin) throw new Error('Solo administración puede modificar la agenda.');
}

export const crearCita = async cita => {
  await comprobarAdministradorAgenda();
  validarCita(cita);
  const alumnos = await getDocs(query(collection(db, 'usuarios'), where('usuario', '==', cita.usuario)));
  if (alumnos.empty || alumnos.docs.some(alumno => alumno.data().esAdmin)) throw new Error('Selecciona un alumno válido.');
  await addDoc(collection(db, cita.tipo === 'tarea' ? 'tests' : 'enlaces'), {
    usuario: cita.usuario, titulo: cita.titulo.trim(), fecha: cita.fecha,
    hora: cita.hora, url: cita.url.trim(), completada: false,
    puntosRecompensa: cita.tipo === 'tarea' ? cantidadPuntos(cita.puntosRecompensa ?? 10) : 0
  });
};

export const completarTarea = async (id, completada) => {
  await completarCita('tests', id, completada);
};

export const completarCita = async (coleccion, id, completada, correccion = null) => {
  await comprobarAdministradorAgenda();
  if (!['tests', 'enlaces'].includes(coleccion)) throw new Error('Cita no válida.');
  if (coleccion !== 'tests' || !completada) {
    await updateDoc(doc(db, coleccion, id), { completada: !!completada });
    return;
  }
  const referencia = doc(db, 'tests', id);
  // Resolver el alumno antes de la transacción; se comprueba de nuevo dentro.
  const tareaInicial = await getDoc(referencia);
  if (!tareaInicial.exists()) throw new Error('La tarea ya no existe.');
  const usuario = tareaInicial.data().usuario;
  const alumnos = await getDocs(query(collection(db, 'usuarios'), where('usuario', '==', usuario)));
  if (alumnos.empty) throw new Error('No se encuentra el alumno de esta tarea.');
  await runTransaction(db, async tx => {
    const tarea = await tx.get(referencia);
    const refAlumno = doc(db, 'usuarios', alumnos.docs[0].id);
    const alumno = await tx.get(refAlumno);
    if (!tarea.exists() || !alumno.exists() || tarea.data().usuario !== alumno.data().usuario || alumno.data().esAdmin) throw new Error('La tarea o el alumno han cambiado.');
    const datos = tarea.data();
    if (correccion !== null && !datos.entrega) throw new Error('Esta tarea no tiene una entrega para corregir.');
    const premiar = !datos.completada && !datos.puntosOtorgados;
    const puntos = cantidadPuntos(datos.puntosRecompensa ?? 10);
    if (premiar) tx.update(refAlumno, { puntos: saldo(alumno.data()) + puntos });
    tx.update(referencia, { completada: true, puntosOtorgados: true, ...(premiar ? { recompensaConcedida: puntos } : {}), ...(correccion !== null ? { correccion, corregida: true, fechaCorreccion: new Date().toISOString() } : {}) });
  });
};

export const darPuntos = async (id, cantidad, operacion = 'sumar') => {
  await comprobarAdministradorAgenda();
  if (!['sumar', 'restar'].includes(operacion)) throw new Error('Operación no válida.');
  const puntos = cantidadPuntos(cantidad);
  if (!puntos) throw new Error('Indica al menos un punto.');
  await runTransaction(db, async tx => {
    const ref = doc(db, 'usuarios', id);
    const alumno = await tx.get(ref);
    if (!alumno.exists() || alumno.data().esAdmin) throw new Error('Alumno no disponible.');
    const actual = saldo(alumno.data());
    if (operacion === 'restar' && puntos > actual) throw new Error(`El alumno solo tiene ${actual} puntos. No puedes quitar más.`);
    tx.update(ref, { puntos: actual + (operacion === 'restar' ? -puntos : puntos) });
  });
};

export const personalizarPerfil = async id => {
  const usuario = sessionStorage.getItem('nombreUsuario');
  if (!usuario) throw new Error('Inicia sesión de nuevo.');
  const resultados = await getDocs(query(collection(db, 'usuarios'), where('usuario', '==', usuario)));
  if (resultados.empty) throw new Error('Cuenta no disponible.');
  return runTransaction(db, async tx => {
    const ref = doc(db, 'usuarios', resultados.docs[0].id);
    const cuenta = await tx.get(ref);
    if (!cuenta.exists() || cuenta.data().esAdmin || estadoSuscripcion(cuenta.data()).caducada) throw new Error('Perfil de alumno no disponible.');
    const cambios = comprarOEquipar(cuenta.data(), id);
    tx.update(ref, cambios);
    return { nuevoDesbloqueo: cambios.puntos < saldo(cuenta.data()) };
  });
};

export const eliminarCita = async (coleccion, id) => {
  await comprobarAdministradorAgenda();
  if (!['tests', 'enlaces'].includes(coleccion)) throw new Error('Cita no válida.');
  await deleteDoc(doc(db, coleccion, id));
};

export const obtenerUsuarioActual = async () => {
  const usuario = sessionStorage.getItem('nombreUsuario');
  if (!usuario) return null;
  const resultado = await getDocs(query(collection(db, 'usuarios'), where('usuario', '==', usuario)));
  return resultado.empty ? null : resultado.docs[0].data();
};

export const obtenerNombreUsuario = async usuario => {
  const resultado = await getDocs(query(collection(db, 'usuarios'), where('usuario', '==', usuario)));
  return resultado.empty ? usuario : resultado.docs[0].data().nombreCompleto || usuario;
};

export const renovarSuscripcion = async (id) => {
  const administrador = await obtenerUsuarioActual();
  if (!administrador?.esAdmin) throw new Error('Solo administración puede renovar suscripciones.');
  return runTransaction(db, async transaction => {
    const referencia = doc(db, 'usuarios', id);
    const alumno = await transaction.get(referencia);
    if (!alumno.exists() || alumno.data().esAdmin) throw new Error('El alumno ya no está disponible.');
    const suscripcionHasta = calcularRenovacion(alumno.data());
    transaction.update(referencia, { suscripcionHasta, suscripcionCancelada: false });
    return suscripcionHasta;
  });
};

export const cancelarSuscripcion = async id => {
  const administrador = await obtenerUsuarioActual();
  if (!administrador?.esAdmin) throw new Error('Solo administración puede cancelar suscripciones.');
  await runTransaction(db, async tx => {
    const referencia = doc(db, 'usuarios', id);
    const alumno = await tx.get(referencia);
    if (!alumno.exists() || alumno.data().esAdmin) throw new Error('El alumno ya no está disponible.');
    tx.update(referencia, { suscripcionCancelada: true });
  });
};

export const borrarCuentaAdmin = async (usuario) => {
  const q = query(collection(db, "usuarios"), where("usuario", "==", usuario));
  const querySnapshot = await getDocs(q);
  
  const promesas = [];
  querySnapshot.forEach((documento) => {
    promesas.push(deleteDoc(doc(db, "usuarios", documento.id)));
  });
  
  await Promise.all(promesas);
}

export const hacerAdmin = async (usuario) => {
  const q = query(collection(db, "usuarios"), where("usuario", "==", usuario));
  const querySnapshot = await getDocs(q);
  
  const promesas = [];
  querySnapshot.forEach((documento) => {
    promesas.push(updateDoc(doc(db, "usuarios", documento.id), { esAdmin: true }));
  });
  
  await Promise.all(promesas);
}

export const obtenerEnlaces = async (usuario, esAdmin) => {
  let q;
  if (esAdmin) {
    q = collection(db, "enlaces");
  } else {
    q = query(collection(db, "enlaces"), where("usuario", "==", usuario));
  }
  const querySnapshot = await getDocs(q);
  let enlaces = [];
  querySnapshot.forEach((doc) => {
    enlaces.push({ id: doc.id, ...doc.data() });
  });
  return enlaces;
}

export const anadirEnlace = async (fecha, url, usuario) => {
  await addDoc(collection(db, "enlaces"), { fecha, url, usuario });
}

export const borrarEnlace = async (id) => {
  await deleteDoc(doc(db, "enlaces", id));
}

export const obtenerTests = async (usuario, esAdmin) => {
  let q;
  if (esAdmin) {
    q = collection(db, "tests");
  } else {
    q = query(collection(db, "tests"), where("usuario", "==", usuario));
  }
  const querySnapshot = await getDocs(q);
  let tests = [];
  querySnapshot.forEach((doc) => {
    tests.push({ id: doc.id, ...doc.data() });
  });
  return tests;
}

export const anadirTest = async (nombre, nota, usuario) => {
  await addDoc(collection(db, "tests"), { nombre, nota, usuario });
}

export const borrarTest = async (id) => {
  await deleteDoc(doc(db, "tests", id));
}

export const obtenerAnuncios = async () => {
  const querySnapshot = await getDocs(collection(db, "anuncios"));
  let anuncios = [];
  querySnapshot.forEach((doc) => {
    anuncios.push({ id: doc.id, ...doc.data() });
  });
  return anuncios;
}

export const crearAnuncio = async (mensaje) => {
  let fecha = new Date();
  let fechaFormateada = format(fecha, 'dd-MM-yyyy HH:mm');
  await addDoc(collection(db, "anuncios"), {
    mensaje: mensaje,
    fecha: fechaFormateada,
    timestamp: fecha.getTime()
  });
}

export const borrarAnuncio = async (id) => {
  await deleteDoc(doc(db, "anuncios", id));
}

/* PARA EL CHAT PRIVADO */

export const enviarMensaje = async (emisor, receptor, texto) => {
  await addDoc(collection(db, "chats"), {
    emisor,
    receptor,
    texto,
    fecha: new Date().getTime(),
    fechaLegible: format(new Date(), 'dd-MM-yyyy HH:mm')
  });
};

export const obtenerMensajes = async (usuario1, usuario2) => {
  const treintaDiasEnMs = 30 * 24 * 60 * 60 * 1000;
  const limiteFecha = new Date().getTime() - treintaDiasEnMs;

  const q = query(
    collection(db, "chats"),
    where("fecha", ">", limiteFecha)
  );

  const querySnapshot = await getDocs(q);
  let mensajes = [];
  
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    // Filtramos manualmente para obtener solo la conversación entre estos dos usuarios
    if ((data.emisor === usuario1 && data.receptor === usuario2) || 
        (data.emisor === usuario2 && data.receptor === usuario1)) {
      mensajes.push({ id: doc.id, ...data });
    }
  });

  return mensajes.sort((a, b) => a.fecha - b.fecha);
};
