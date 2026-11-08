import { Router } from 'express';
import { manejar, entero, ErrorHttp } from '../config/utilidades.js';
import * as registroRepo from '../repositories/registroRepo.js';

const router = Router();

router.post('/incidentes', manejar(async (req, res) => {
  const b = req.body ?? {};
  res.status(201).json(await registroRepo.crearIncidente({
    sesion_id: entero(b.sesion_id, 'sesion_id'),
    archivo_id: entero(b.archivo_id, 'archivo_id'),
    detectado_por: b.detectado_por,
    accion: b.accion,
    severidad: Number(b.severidad),
  }));
}));

router.get('/incidentes', manejar(async (req, res) => {
  res.json(await registroRepo.listarIncidentes(entero(req.query.sesion_id, 'sesion_id')));
}));

router.post('/bitacora', manejar(async (req, res) => {
  const b = req.body ?? {};
  const tipo = String(b.tipo ?? '').trim();
  const descripcion = String(b.descripcion ?? '').trim();
  if (!tipo || tipo.length > 30 || !descripcion) throw new ErrorHttp(400, 'tipo y descripcion son obligatorios');
  res.status(201).json(await registroRepo.crearBitacora({
    sesion_id: entero(b.sesion_id, 'sesion_id'),
    tipo,
    descripcion,
    datos: b.datos ?? {},
  }));
}));

router.get('/bitacora', manejar(async (req, res) => {
  const limite = Math.min(Math.max(Number(req.query.limite) || 50, 1), 500);
  res.json(await registroRepo.listarBitacora(entero(req.query.sesion_id, 'sesion_id'), limite));
}));

router.post('/generaciones', manejar(async (req, res) => {
  const b = req.body ?? {};
  res.status(201).json(await registroRepo.crearGeneracion({
    sesion_id: entero(b.sesion_id, 'sesion_id'),
    numero_generacion: Number(b.numero_generacion),
    mejor_aptitud: Number(b.mejor_aptitud),
    aptitud_promedio: Number(b.aptitud_promedio),
    pesos: b.pesos ?? {},
  }));
}));

router.get('/generaciones', manejar(async (req, res) => {
  res.json(await registroRepo.listarGeneraciones(entero(req.query.sesion_id, 'sesion_id')));
}));

export default router;