import { query } from '../config/db.js';

export async function crearIncidente(i) {
  const { rows } = await query(
    `INSERT INTO incidente (sesion_id, archivo_id, detectado_por, accion, severidad)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [i.sesion_id, i.archivo_id, i.detectado_por, i.accion, i.severidad]
  );
  return rows[0];
}

export async function listarIncidentes(sesionId) {
  const { rows } = await query(
    `SELECT i.*, a.nombre, t.extension
     FROM incidente i
     JOIN archivo a ON a.id = i.archivo_id
     JOIN tipo_archivo t ON t.id = a.tipo_archivo_id
     WHERE i.sesion_id = $1
     ORDER BY i.detectado_en DESC`,
    [sesionId]
  );
  return rows;
}

export async function crearBitacora({ sesion_id, tipo, descripcion, datos }) {
  const { rows } = await query(
    `INSERT INTO bitacora_evento (sesion_id, tipo, descripcion, datos)
     VALUES ($1, $2, $3, $4::jsonb) RETURNING *`,
    [sesion_id, tipo, descripcion, JSON.stringify(datos)]
  );
  return rows[0];
}

export async function listarBitacora(sesionId, limite) {
  const { rows } = await query(
    `SELECT * FROM bitacora_evento
     WHERE sesion_id = $1
     ORDER BY creado_en DESC, id DESC
     LIMIT $2`,
    [sesionId, limite]
  );
  return rows;
}

export async function crearGeneracion(g) {
  const { rows } = await query(
    `INSERT INTO generacion_genetica
       (sesion_id, numero_generacion, mejor_aptitud, aptitud_promedio, pesos)
     VALUES ($1, $2, $3, $4, $5::jsonb) RETURNING *`,
    [g.sesion_id, g.numero_generacion, g.mejor_aptitud, g.aptitud_promedio, JSON.stringify(g.pesos)]
  );
  return rows[0];
}

export async function listarGeneraciones(sesionId) {
  const { rows } = await query(
    'SELECT * FROM generacion_genetica WHERE sesion_id = $1 ORDER BY numero_generacion',
    [sesionId]
  );
  return rows;
}