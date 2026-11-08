import { Router } from 'express';
import { manejar, entero, ErrorHttp } from '../config/utilidades.js';
import * as puntoRepo from '../repositories/puntoRepo.js';

const router = Router();

router.post('/', manejar(async (req, res) => {
  const sesion_id = entero(req.body?.sesion_id, 'sesion_id');
  const etiqueta = String(req.body?.etiqueta ?? '').trim();
  if (!etiqueta || etiqueta.length > 80) throw new ErrorHttp(400, 'etiqueta inválida');
  const estado_sistema = String(req.body?.estado_sistema ?? 'Limpio').trim().slice(0, 30);
  const archivo_ids = Array.isArray(req.body?.archivo_ids)
    ? req.body.archivo_ids.map((x) => entero(x, 'archivo_id'))
    : [];
  res.status(201).json(await puntoRepo.crear({ sesion_id, etiqueta, estado_sistema, archivo_ids }));
}));

router.get('/', manejar(async (req, res) => {
  res.json(await puntoRepo.activos(entero(req.query.sesion_id, 'sesion_id')));
}));

router.post('/:id/restaurar', manejar(async (req, res) => {
  res.json(await puntoRepo.restaurar(entero(req.params.id, 'id')));
}));

export default router;