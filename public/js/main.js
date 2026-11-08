import { api } from './api.js';
import { Cola } from './structures/Cola.js';
import { Pila } from './structures/Pila.js';
import { crearArchivo } from './models/Archivo.js';
import { PuntoRestauracion } from './models/PuntoRestauracion.js';
import { generarLote } from './models/generadorArchivos.js';
import { evaluarArchivo } from './logic/detector.js';
import * as vista from './ui/vista.js';

const CLAVE_SESION = 'cerbero_sesion_id';
const MAX_COLA = 10;
const INTERVALO_LLEGADA_MS = 7000;

const estado = {
  sesionId: null,
  cola: new Cola(),
  pila: new Pila(),
  amenaza: null,   // archivo retenido en el servidor por alerta
  actual: null,    // último archivo respaldado
  reglas: [],
  tipos: {},
  puntaje: 0,
  estadisticas: null,
  bitacora: [],
  ocupado: false,
};

// ---------- Utilidades ----------

function aArchivo(datos) {
  const tipo = estado.tipos[datos.extension];
  const archivo = crearArchivo({ ...datos, es_ejecutable: tipo?.es_ejecutable ?? false });
  archivo.analisis = evaluarArchivo(archivo, estado.reglas);
  return archivo;
}

function registrar(tipo, descripcion, datos = {}) {
  estado.bitacora.unshift({ tipo, descripcion, hora: new Date() });
  if (estado.bitacora.length > 30) estado.bitacora.pop();
  vista.renderBitacora(estado.bitacora);
  if (estado.sesionId) {
    api.bitacora({ sesion_id: estado.sesionId, tipo, descripcion, datos }).catch(console.error);
  }
}

async function sumarPuntaje(delta) {
  estado.puntaje = Math.max(0, estado.puntaje + delta);
  await api.puntaje(estado.sesionId, estado.puntaje);
}

// Reconstruye las estructuras en memoria a partir de lo guardado en la base de datos
function cargar(datos) {
  estado.sesionId = datos.sesion.id;
  estado.puntaje = datos.sesion.puntaje;
  estado.cola = new Cola();
  datos.cola.forEach((d) => estado.cola.encolar(aArchivo(d)));
  estado.pila = new Pila();
  [...datos.pila].reverse().forEach((d) => estado.pila.apilar(new PuntoRestauracion(d)));
  estado.estadisticas = datos.estadisticas;
}

async function recuperarAmenaza() {
  const [infectados, sospechosos] = await Promise.all([
    api.archivos(estado.sesionId, 'infectado'),
    api.archivos(estado.sesionId, 'sospechoso'),
  ]);
  const retenidos = [...infectados, ...sospechosos].sort((a, b) => b.id - a.id);
  estado.amenaza = retenidos.length > 0 ? aArchivo(retenidos[0]) : null;
}

async function recargar() {
  cargar(await api.estado(estado.sesionId));
  await recuperarAmenaza();
}

// Ejecuta una acción evitando que se solapen y resincroniza si algo falla
async function ejecutar(accion) {
  if (estado.ocupado) return;
  estado.ocupado = true;
  vista.render(estado);
  try {
    await accion();
  } catch (error) {
    registrar('error', `Error: ${error.message}`);
    try { await recargar(); } catch (e) { console.error(e); }
  } finally {
    try { estado.estadisticas = await api.estadisticas(estado.sesionId); } catch { /* se ignora */ }
    estado.ocupado = false;
    vista.render(estado);
  }
}

// ---------- Acciones del juego ----------

async function encolarLote(cantidad) {
  const n = Math.min(cantidad, MAX_COLA - estado.cola.tamano());
  if (n <= 0) return registrar('info', 'La cola está llena');
  const creados = await api.encolar(estado.sesionId, generarLote(n));
  creados.forEach((d) => estado.cola.encolar(aArchivo(d)));
  const alertas = creados.filter((d) => aArchivo(d).analisis.alerta).length;
  registrar('llegada', `Llegaron ${n} archivo(s) a la cola (${alertas} con alerta)`);
}

async function procesarSiguiente() {
  if (estado.amenaza) {
    return registrar('advertencia', 'Hay una amenaza retenida: neutralícela antes de continuar');
  }
  const cima = estado.pila.cima();
  if (cima?.comprometido) {
    return registrar('advertencia', 'El sistema está comprometido: ejecute un rollback');
  }
  if (estado.cola.estaVacia()) return registrar('info', 'La cola está vacía');

  const archivo = estado.cola.desencolar(); // dequeue
  const { analisis } = archivo;

  if (analisis.alerta) {
    const nuevoEstado = analisis.infectado ? 'infectado' : 'sospechoso';
    await api.cambiarEstado(archivo.id, nuevoEstado, analisis.puntaje);
    archivo.estado = nuevoEstado;
    estado.amenaza = archivo;
    return registrar(
      'amenaza',
      `Amenaza detectada: ${archivo.nombreCompleto()} (riesgo ${Math.round(analisis.puntaje * 100)}%)`,
      { reglas: analisis.reglas }
    );
  }

  await api.cambiarEstado(archivo.id, 'respaldado', analisis.puntaje);
  archivo.estado = 'respaldado';
  const punto = await api.crearPunto({
    sesion_id: estado.sesionId,
    etiqueta: `Punto #${estado.pila.tamano() + 1} · ${archivo.nombreCompleto()}`,
    estado_sistema: archivo.estadoSistemaAlRespaldar(),
    archivo_ids: [archivo.id],
  });
  estado.pila.apilar(new PuntoRestauracion(punto)); // push
  estado.actual = archivo;
  await sumarPuntaje(archivo.puntosAlRespaldar());
  registrar('respaldo', `Respaldo completado: ${archivo.nombreCompleto()}`);
  if (archivo.esMalware) {
    registrar('advertencia', 'Se detectó comportamiento anómalo en el servidor');
  }
}

async function neutralizar() {
  const amenaza = estado.amenaza;
  if (!amenaza) return registrar('info', 'No hay amenazas retenidas');

  const delta = amenaza.puntosAlNeutralizar();
  await api.cambiarEstado(amenaza.id, 'aislado', amenaza.analisis.puntaje);
  await api.incidente({
    sesion_id: estado.sesionId,
    archivo_id: amenaza.id,
    detectado_por: 'regla_logica',
    accion: amenaza.esMalware ? 'neutralizado' : 'aislado',
    severidad: amenaza.analisis.severidad,
  });
  amenaza.estado = 'aislado';
  estado.amenaza = null;
  await sumarPuntaje(delta);
  registrar(
    amenaza.esMalware ? 'incidente' : 'advertencia',
    `${amenaza.veredictoReal()}: ${amenaza.nombreCompleto()} (${delta > 0 ? '+' : ''}${delta} pts)`
  );
}

async function rollback() {
  if (estado.pila.tamano() <= 1) {
    return registrar('info', 'Solo existe el respaldo base: no hay nada que revertir');
  }
  const cima = estado.pila.cima();
  await api.restaurar(cima.id);
  estado.pila.desapilar(); // pop
  const delta = cima.comprometido ? 30 : -10;
  await sumarPuntaje(delta);
  registrar(
    cima.comprometido ? 'restauracion' : 'advertencia',
    cima.comprometido
      ? `Rollback exitoso: se descartó ${cima.etiqueta} (comprometido) (+30 pts)`
      : `Rollback innecesario: ${cima.etiqueta} estaba limpio (-10 pts)`
  );
}

// ---------- Sesión e inicio ----------

async function abrirSesion(nueva) {
  const guardada = Number(localStorage.getItem(CLAVE_SESION)) || null;
  let datos = null;
  if (guardada && !nueva) {
    try { datos = await api.estado(guardada); } catch { datos = null; }
  }

  if (datos) {
    cargar(datos);
    await recuperarAmenaza();
    registrar('sistema', `Sesión #${estado.sesionId} retomada`);
  } else {
    const sesion = await api.crearSesion('Administrador');
    localStorage.setItem(CLAVE_SESION, String(sesion.id));
    cargar(await api.estado(sesion.id));
    estado.amenaza = null;
    estado.actual = null;
    estado.bitacora = [];
    registrar('sistema', `Sesión #${sesion.id} iniciada con respaldo base`);
    await encolarLote(6);
  }
  estado.estadisticas = await api.estadisticas(estado.sesionId);
}

async function iniciar() {
  const [reglas, tipos] = await Promise.all([api.reglas(), api.tipos()]);
  estado.reglas = reglas;
  estado.tipos = Object.fromEntries(tipos.map((t) => [t.extension, t]));

  vista.enlazar({
    procesar: () => ejecutar(procesarSiguiente),
    neutralizar: () => ejecutar(neutralizar),
    rollback: () => ejecutar(rollback),
    lote: () => ejecutar(() => encolarLote(5)),
    nueva: () => ejecutar(() => abrirSesion(true)),
  });
  vista.iniciarMonitor(() => estado);

  await abrirSesion(false);
  vista.render(estado);

  setInterval(() => {
    if (vista.autoActivo() && !estado.ocupado && estado.cola.tamano() < MAX_COLA) {
      ejecutar(() => encolarLote(1));
    }
  }, INTERVALO_LLEGADA_MS);
}

iniciar().catch((error) => {
  console.error(error);
  document.getElementById('sesion-info').textContent =
    `No se pudo conectar con el servidor: ${error.message}`;
});