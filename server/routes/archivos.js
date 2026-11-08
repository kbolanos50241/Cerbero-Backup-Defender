import { Router } from 'express';
import { manejar, entero, ErrorHttp } from '../config/utilidades.js';
import * as archivoRepo from '../repositories/archivoRepo.js';

const router = Router();
const ESTADOS_PROCESADOS = ['seguro', 'sospechoso', 'infectado', 'aislado', 'respaldado'];

router.post('/', manejar(async (req, res) => {
  const sesion_id = entero(req.body?.sesion_id, 'sesion_id');
  const lista = req.body?.archivos;
  if (!Array.isArray(lista) || lista.length === 0 || lista.length > 100) {
    throw new ErrorHttp(400, 'Se requiere una lista de 1 a 100 archivos');
  }
  const archivos = lista.map((a) => {
    const nombre = String(a?.nombre ?? '').trim();
    const extension = String(a?.extension ?? '').trim().toLowerCase().replace(/^\./, '');
    const tamano_kb = Number(a?.tamano_kb);
    if (!nombre || nombre.length > 120 || !extension || !Number.isInteger(tamano_kb) || tamano_kb <= 0) {
      throw new ErrorHttp(400, `Archivo inválido: ${nombre || '(sin nombre)'}`);
    }
    return { nombre, extension, tamano_kb, es_malware: !!a.es_malware, es_prioritario: !!a.es_prioritario };
  });
  res.status(201).json(await archivoRepo.encolar(sesion_id, archivos));
}));

router.get('/', manejar(async (req, res) => {
  const sesion_id = entero(req.query.sesion_id, 'sesion_id');
  res.json(await archivoRepo.listar(sesion_id, req.query.estado));
}));

router.patch('/:id/estado', manejar(async (req, res) => {
  const id = entero(req.params.id, 'id');
  const { estado, puntaje_riesgo } = req.body ?? {};
  if (!ESTADOS_PROCESADOS.includes(estado)) {
    throw new ErrorHttp(400, `estado debe ser uno de: ${ESTADOS_PROCESADOS.join(', ')}`);
  }
  if (puntaje_riesgo != null && !(Number(puntaje_riesgo) >= 0 && Number(puntaje_riesgo) <= 1)) {
    throw new ErrorHttp(400, 'puntaje_riesgo debe estar entre 0 y 1');
  }
  const archivo = await archivoRepo.actualizarEstado(id, estado, puntaje_riesgo);
  if (!archivo) throw new ErrorHttp(404, 'Archivo no encontrado');
  res.json(archivo);
}));

export default router;