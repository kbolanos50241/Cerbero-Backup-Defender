import { Router } from 'express';
import { manejar, entero, ErrorHttp } from '../config/utilidades.js';
import * as catalogoRepo from '../repositories/catalogoRepo.js';

const router = Router();

router.get('/tipos', manejar(async (req, res) => res.json(await catalogoRepo.tipos())));
router.get('/reglas', manejar(async (req, res) => res.json(await catalogoRepo.reglas())));
router.get('/lenguajes', manejar(async (req, res) => res.json(await catalogoRepo.lenguajes())));

router.put('/reglas/:id', manejar(async (req, res) => {
  const id = entero(req.params.id, 'id');
  const { peso, activa } = req.body ?? {};
  if (peso != null && !(Number(peso) >= 0 && Number(peso) <= 1)) {
    throw new ErrorHttp(400, 'peso debe estar entre 0 y 1');
  }
  const regla = await catalogoRepo.actualizarRegla(id, peso, activa);
  if (!regla) throw new ErrorHttp(404, 'Regla no encontrada');
  res.json(regla);
}));

export default router;