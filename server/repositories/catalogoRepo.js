import { query } from '../config/db.js';

export async function tipos() {
  const { rows } = await query('SELECT * FROM tipo_archivo ORDER BY id');
  return rows;
}

export async function reglas() {
  const { rows } = await query('SELECT * FROM regla_deteccion ORDER BY id');
  return rows;
}

export async function actualizarRegla(id, peso, activa) {
  const { rows } = await query(
    `UPDATE regla_deteccion
     SET peso = COALESCE($2::numeric, peso),
         activa = COALESCE($3::boolean, activa)
     WHERE id = $1 RETURNING *`,
    [id, peso ?? null, activa ?? null]
  );
  return rows[0] ?? null;
}

export async function lenguajes() {
  const { rows } = await query('SELECT * FROM lenguaje_historia ORDER BY anio, id');
  return rows;
}