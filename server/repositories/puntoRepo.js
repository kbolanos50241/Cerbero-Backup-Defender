import { query, transaccion } from '../config/db.js';
import { ErrorHttp } from '../config/utilidades.js';

// push: agrega un punto de restauración al tope de la pila
export function crear({ sesion_id, etiqueta, estado_sistema, archivo_ids }) {
  return transaccion(async (c) => {
    const { rows } = await c.query(
      `INSERT INTO punto_restauracion (sesion_id, etiqueta, estado_sistema)
       VALUES ($1, $2, $3) RETURNING *`,
      [sesion_id, etiqueta, estado_sistema]
    );
    const punto = rows[0];
    if (archivo_ids.length > 0) {
      await c.query(
        `INSERT INTO punto_restauracion_archivo (punto_id, archivo_id)
         SELECT $1::bigint, unnest($2::bigint[])
         ON CONFLICT DO NOTHING`,
        [punto.id, archivo_ids]
      );
    }
    return punto;
  });
}

// La pila completa: el primer elemento es el tope (top)
export async function activos(sesionId) {
  const { rows } = await query(
    `SELECT p.*,
            (SELECT COUNT(*)::int FROM punto_restauracion_archivo x
             WHERE x.punto_id = p.id) AS total_archivos
     FROM punto_restauracion p
     WHERE p.sesion_id = $1 AND p.activo
     ORDER BY p.creado_en DESC, p.id DESC`,
    [sesionId]
  );
  return rows;
}

// pop: solo se puede retirar el punto del tope (LIFO) y nunca el respaldo base
export function restaurar(id) {
  return transaccion(async (c) => {
    const { rows } = await c.query(
      'SELECT * FROM punto_restauracion WHERE id = $1 FOR UPDATE',
      [id]
    );
    const punto = rows[0];
    if (!punto) throw new ErrorHttp(404, 'Punto de restauración no encontrado');
    if (!punto.activo) throw new ErrorHttp(409, 'El punto ya fue restaurado');

    const tope = await c.query(
      `SELECT id FROM punto_restauracion
       WHERE sesion_id = $1 AND activo
       ORDER BY creado_en DESC, id DESC LIMIT 1`,
      [punto.sesion_id]
    );
    if (tope.rows[0].id !== punto.id) {
      throw new ErrorHttp(409, 'Solo se puede restaurar el punto del tope de la pila (LIFO)');
    }

    const total = await c.query(
      'SELECT COUNT(*)::int AS n FROM punto_restauracion WHERE sesion_id = $1 AND activo',
      [punto.sesion_id]
    );
    if (total.rows[0].n <= 1) {
      throw new ErrorHttp(409, 'No se puede retirar el respaldo base');
    }

    const r = await c.query(
      `UPDATE punto_restauracion
       SET activo = false, restaurado_en = now()
       WHERE id = $1 RETURNING *`,
      [id]
    );
    return r.rows[0];
  });
}