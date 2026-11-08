const $ = (id) => document.getElementById(id);

function el(etiqueta, clase, texto) {
  const nodo = document.createElement(etiqueta);
  if (clase) nodo.className = clase;
  if (texto !== undefined) nodo.textContent = texto;
  return nodo;
}

const porcentaje = (valor) => `${Math.round(valor * 100)}%`;

function renderCola(cola) {
  const contenedor = $('lista-cola');
  contenedor.replaceChildren();
  if (cola.estaVacia()) {
    contenedor.append(el('p', 'vacio', 'Cola vacía: esperando archivos...'));
    return;
  }
  let posicion = 0;
  for (const archivo of cola) {
    const alerta = archivo.analisis.alerta;
    const fila = el('div', `item${alerta ? ' alerta' : ''}${posicion === 0 ? ' siguiente' : ''}`);
    fila.append(el('span', '', alerta ? '⚠️' : archivo.icono()));
    fila.append(el('span', 'nombre', `→ ${archivo.nombreCompleto()}`));
    if (archivo.esPrioritario) fila.append(el('span', 'etiqueta prioridad', 'Prioridad'));
    if (alerta) fila.append(el('span', 'etiqueta peligro', 'ALERTA'));
    contenedor.append(fila);
    posicion++;
  }
}

function renderServidor(estado) {
  const caja = $('zona-servidor');
  caja.replaceChildren();
  const cima = estado.pila.cima();
  const comprometido = cima ? cima.comprometido : false;

  const rack = el('div', `servidor${estado.amenaza ? ' peligro' : comprometido ? ' comprometido' : ''}`);
  for (let i = 0; i < 4; i++) {
    const bahia = el('div', 'bahia');
    bahia.append(el('span', 'led'));
    rack.append(bahia);
  }
  caja.append(rack);

  let titulo;
  let detalle;
  if (estado.amenaza) {
    const a = estado.amenaza;
    titulo = `☠ Amenaza retenida: ${a.nombreCompleto()}`;
    detalle = `Riesgo ${porcentaje(a.analisis.puntaje)} · Reglas: ${a.analisis.reglas.join(', ')}`;
  } else if (comprometido) {
    titulo = '⚠ SISTEMA COMPROMETIDO';
    detalle = 'Un respaldo infectado pasó la revisión. Ejecute un rollback.';
  } else if (estado.actual) {
    titulo = `✔ Último respaldo: ${estado.actual.nombreCompleto()}`;
    detalle = `Riesgo ${porcentaje(estado.actual.analisis.puntaje)}`;
  } else {
    titulo = 'Servidor en espera';
    detalle = 'Procese el siguiente archivo de la cola.';
  }
  caja.append(el('div', 'estado-titulo', titulo));
  caja.append(el('div', 'estado-detalle', detalle));

  const leyenda = el('div', 'leyenda');
  const seguro = el('span');
  seguro.append(el('span', 'punto seguro'), 'Archivo Seguro');
  const amenaza = el('span');
  amenaza.append(el('span', 'punto amenaza'), 'Amenaza Detectada');
  leyenda.append(seguro, amenaza);
  caja.append(leyenda);
}

function filaPila(texto, ok) {
  const fila = el('div', `item pila${ok ? '' : ' alerta'}`);
  fila.append(el('span', 'nombre', `- [${texto}]`));
  fila.append(el('span', 'marca', ok ? '✔' : '✖'));
  return fila;
}

function renderPila(pila) {
  const contenedor = $('lista-pila');
  contenedor.replaceChildren();
  const cima = pila.cima();
  contenedor.append(filaPila(`Estado Actual: ${cima ? cima.estadoSistema : 'Sin datos'}`, !cima?.comprometido));
  for (const punto of pila) {
    contenedor.append(filaPila(`${punto.etiqueta} — ${punto.estadoSistema}`, !punto.comprometido));
  }
}

function renderEstadisticas(estado) {
  const contenedor = $('estadisticas');
  contenedor.replaceChildren();
  const s = estado.estadisticas;
  const datos = [
    ['Puntaje', estado.puntaje],
    ['Pendientes', estado.cola.tamano()],
    ['Respaldados', s ? s.respaldados : 0],
    ['Aislados', s ? s.aislados : 0],
    ['Incidentes', s ? s.incidentes : 0],
  ];
  for (const [nombre, valor] of datos) {
    const bloque = el('span', '', `${nombre}: `);
    bloque.append(el('b', '', String(valor)));
    contenedor.append(bloque);
  }
}

export function renderBitacora(eventos) {
  const contenedor = $('bitacora');
  contenedor.replaceChildren();
  for (const evento of eventos) {
    const linea = el('div', `linea ${evento.tipo}`);
    linea.append(el('span', 'hora', evento.hora.toLocaleTimeString('es-CR')));
    linea.append(evento.descripcion);
    contenedor.append(linea);
  }
}

export function render(estado) {
  $('sesion-info').textContent = `Sesión #${estado.sesionId} · Administrador`;
  renderCola(estado.cola);
  renderServidor(estado);
  renderPila(estado.pila);
  renderEstadisticas(estado);
  renderBitacora(estado.bitacora);
  for (const id of ['btn-procesar', 'btn-neutralizar', 'btn-rollback', 'btn-lote', 'btn-nueva']) {
    $(id).disabled = estado.ocupado;
  }
}

export const autoActivo = () => $('chk-auto').checked;

export function enlazar(acciones) {
  $('btn-procesar').addEventListener('click', acciones.procesar);
  $('btn-neutralizar').addEventListener('click', acciones.neutralizar);
  $('btn-rollback').addEventListener('click', acciones.rollback);
  $('btn-lote').addEventListener('click', acciones.lote);
  $('btn-nueva').addEventListener('click', acciones.nueva);
}

// Consumo simulado de CPU y RAM a partir de la carga de las estructuras
export function iniciarMonitor(obtenerEstado) {
  const actualizar = () => {
    const e = obtenerEstado();
    const carga = e.cola.tamano() * 4 + (e.ocupado ? 25 : 0) + (e.amenaza ? 15 : 0);
    const cpu = Math.min(99, 8 + carga + Math.round(Math.random() * 6));
    const ram = Math.min(99, 22 + e.cola.tamano() * 2 + e.pila.tamano() * 3 + Math.round(Math.random() * 3));
    $('cpu').textContent = `${cpu}%`;
    $('ram').textContent = `${ram}%`;
  };
  actualizar();
  setInterval(actualizar, 1500);
}