import { query, transaccion } from '../config/db.js';

// Crea la sesión y su punto de restauración base (fondo de la pila)
export function crear(alias) {
  return transaccion(async (c) => {
    const s = await c.query(
      'INSERT INTO sesion (alias) VALUES (COALESCE(NULLIF($1, \'\'), \'Administrador\')) RETURNING *',
      [alias]
    );
    await c.query(
      `INSERT INTO punto_restauracion (sesion_id, etiqueta, estado_sistema)
       VALUES ($1, 'Respaldo Base', 'Limpio')`,
      [s.rows[0].id]
    );
    return s.rows[0];
  });
}

export async function obtener(id) {
  const { rows } = await query('SELECT * FROM sesion WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function estadisticas(id) {
  const { rows } = await query(
    `SELECT
       COUNT(*)::int                                        AS total,
       COUNT(*) FILTER (WHERE estado = 'pendiente')::int    AS pendientes,
       COUNT(*) FILTER (WHERE estado = 'respaldado')::int   AS respaldados,
       COUNT(*) FILTER (WHERE estado = 'aislado')::int      AS aislados,
       COUNT(*) FILTER (WHERE es_malware)::int              AS malware_total,
       (SELECT COUNT(*)::int FROM incidente WHERE sesion_id = $1) AS incidentes
     FROM archivo WHERE sesion_id = $1`,
    [id]
  );
  return rows[0];
}

export async function actualizarPuntaje(id, puntaje) {
  const { rows } = await query(
    'UPDATE sesion SET puntaje = $2 WHERE id = $1 RETURNING *',
    [id, puntaje]
  );
  return rows[0] ?? null;
}

export async function finalizar(id) {
  const { rows } = await query(
    'UPDATE sesion SET finalizada_en = now() WHERE id = $1 RETURNING *',
    [id]
  );
  return rows[0] ?? null;
}