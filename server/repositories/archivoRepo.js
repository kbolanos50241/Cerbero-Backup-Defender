import { query, transaccion } from '../config/db.js';
import { ErrorHttp } from '../config/utilidades.js';

// Encola archivos al final de la cola (enqueue), asignando posiciones consecutivas
export function encolar(sesionId, archivos) {
  return transaccion(async (c) => {
    const { rows } = await c.query(
      'SELECT COALESCE(MAX(posicion_cola), 0) AS ultima FROM archivo WHERE sesion_id = $1',
      [sesionId]
    );
    let posicion = rows[0].ultima;
    const creados = [];

    for (const a of archivos) {
      posicion += 1;
      const r = await c.query(
        `INSERT INTO archivo
           (sesion_id, tipo_archivo_id, nombre, tamano_kb, es_malware,
            es_prioritario, estado, posicion_cola)
         SELECT $1::int, t.id, $2::varchar, $3::int, $4::boolean,
                $5::boolean, 'pendiente'::estado_archivo, $6::int
         FROM tipo_archivo t
         WHERE t.extension = $7
         RETURNING *`,
        [sesionId, a.nombre, a.tamano_kb, a.es_malware, a.es_prioritario, posicion, a.extension]
      );
      if (r.rowCount === 0) {
        throw new ErrorHttp(400, `Extensión no soportada: ${a.extension}`);
      }
      creados.push({ ...r.rows[0], extension: a.extension });
    }
    return creados;
  });
}

export async function listar(sesionId, estado) {
  const { rows } = await query(
    `SELECT a.*, t.extension, t.nivel_riesgo, t.es_ejecutable
     FROM archivo a
     JOIN tipo_archivo t ON t.id = a.tipo_archivo_id
     WHERE a.sesion_id = $1
       AND ($2::estado_archivo IS NULL OR a.estado = $2::estado_archivo)
     ORDER BY a.id`,
    [sesionId, estado ?? null]
  );
  return rows;
}

// Contenido actual de la cola, en orden FIFO
export async function pendientes(sesionId) {
  const { rows } = await query(
    `SELECT a.*, t.extension, t.nivel_riesgo, t.es_ejecutable
     FROM archivo a
     JOIN tipo_archivo t ON t.id = a.tipo_archivo_id
     WHERE a.sesion_id = $1 AND a.estado = 'pendiente'
     ORDER BY a.posicion_cola`,
    [sesionId]
  );
  return rows;
}

// Sacar de la cola (dequeue) y registrar el resultado del procesamiento
export async function actualizarEstado(id, estado, puntajeRiesgo) {
  const { rows } = await query(
    `UPDATE archivo
     SET estado = $2::estado_archivo,
         posicion_cola = NULL,
         puntaje_riesgo = $3::numeric,
         procesado_en = now()
     WHERE id = $1
     RETURNING *`,
    [id, estado, puntajeRiesgo ?? null]
  );
  return rows[0] ?? null;
}