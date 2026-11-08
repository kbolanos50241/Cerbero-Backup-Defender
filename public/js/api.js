async function llamar(ruta, { metodo = 'GET', cuerpo } = {}) {
  const respuesta = await fetch(`/api${ruta}`, {
    method: metodo,
    headers: cuerpo ? { 'Content-Type': 'application/json' } : undefined,
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(datos.error ?? `Error ${respuesta.status}`);
  return datos;
}

export const api = {
  crearSesion: (alias) => llamar('/sesiones', { metodo: 'POST', cuerpo: { alias } }),
  estado: (id) => llamar(`/sesiones/${id}/estado`),
  estadisticas: (id) => llamar(`/sesiones/${id}/estadisticas`),
  puntaje: (id, puntaje) => llamar(`/sesiones/${id}/puntaje`, { metodo: 'PATCH', cuerpo: { puntaje } }),
  reglas: () => llamar('/catalogos/reglas'),
  tipos: () => llamar('/catalogos/tipos'),
  encolar: (sesion_id, archivos) => llamar('/archivos', { metodo: 'POST', cuerpo: { sesion_id, archivos } }),
  archivos: (sesion_id, estado) => llamar(`/archivos?sesion_id=${sesion_id}&estado=${estado}`),
  cambiarEstado: (id, estado, puntaje_riesgo) =>
    llamar(`/archivos/${id}/estado`, { metodo: 'PATCH', cuerpo: { estado, puntaje_riesgo } }),
  crearPunto: (cuerpo) => llamar('/puntos', { metodo: 'POST', cuerpo }),
  restaurar: (id) => llamar(`/puntos/${id}/restaurar`, { metodo: 'POST' }),
  incidente: (cuerpo) => llamar('/registros/incidentes', { metodo: 'POST', cuerpo }),
  bitacora: (cuerpo) => llamar('/registros/bitacora', { metodo: 'POST', cuerpo }),
};