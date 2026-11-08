import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { pool } from './config/db.js';
import { ErrorHttp, manejar } from './config/utilidades.js';
import sesiones from './routes/sesiones.js';
import archivos from './routes/archivos.js';
import puntos from './routes/puntos.js';
import registros from './routes/registros.js';
import catalogos from './routes/catalogos.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/salud', manejar(async (req, res) => {
  const { rows } = await pool.query('SELECT version() AS version, now() AS ahora');
  res.json({ ok: true, ...rows[0] });
}));

app.use('/api/sesiones', sesiones);
app.use('/api/archivos', archivos);
app.use('/api/puntos', puntos);
app.use('/api/registros', registros);
app.use('/api/catalogos', catalogos);

app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// Manejo centralizado de errores
app.use((err, req, res, _next) => {
  if (err instanceof ErrorHttp) return res.status(err.status).json({ error: err.message });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido' });
  if (err.code === '23505') return res.status(409).json({ error: 'Registro duplicado', detalle: err.detail });
  if (err.code?.startsWith('22') || err.code?.startsWith('23')) {
    return res.status(400).json({ error: 'Datos inválidos', detalle: err.detail ?? err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PUERTO = process.env.PORT || 3000;
app.listen(PUERTO, () => console.log(`Cerbero Backup Defender en http://localhost:${PUERTO}`));