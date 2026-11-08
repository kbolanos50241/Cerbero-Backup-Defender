import { Router } from 'express';
import { manejar, entero, ErrorHttp } from '../config/utilidades.js';
import * as sesionRepo from '../repositories/sesionRepo.js';
import * as archivoRepo from '../repositories/archivoRepo.js';
import * as puntoRepo from '../repositories/puntoRepo.js';

const router = Router();

router.post('/', manejar(async (req, res) => {
  const alias = String(req.body?.alias ?? '').trim().slice(0, 50);
  res.status(201).json(await sesionRepo.crear(alias));
}));

// Estado completo para pintar la interfaz: cola, pila y estadísticas
router.get('/:id/estado', manejar(async (req, res) => {
  const id = entero(req.params.id, 'id');
  const sesion = await sesionRepo.obtener(id);
  if (!sesion) throw new ErrorHttp(404, 'Sesión no encontrada');
  const [cola, pila, estadisticas] = await Promise.all([
    archivoRepo.pendientes(id),
    puntoRepo.activos(id),
    sesionRepo.estadisticas(id),
  ]);
  res.json({ sesion, cola, pila, estadisticas });
}));

router.get('/:id/estadisticas', manejar(async (req, res) => {
  res.json(await sesionRepo.estadisticas(entero(req.params.id, 'id')));
}));

router.patch('/:id/puntaje', manejar(async (req, res) => {
  const id = entero(req.params.id, 'id');
  const puntaje = Number(req.body?.puntaje);
  if (!Number.isInteger(puntaje)) throw new ErrorHttp(400, 'puntaje inválido');
  const sesion = await sesionRepo.actualizarPuntaje(id, puntaje);
  if (!sesion) throw new ErrorHttp(404, 'Sesión no encontrada');
  res.json(sesion);
}));

router.post('/:id/finalizar', manejar(async (req, res) => {
  const sesion = await sesionRepo.finalizar(entero(req.params.id, 'id'));
  if (!sesion) throw new ErrorHttp(404, 'Sesión no encontrada');
  res.json(sesion);
}));

export default router;