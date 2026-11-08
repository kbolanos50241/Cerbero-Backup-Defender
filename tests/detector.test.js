import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearArchivo } from '../public/js/models/Archivo.js';
import { evaluarArchivo } from '../public/js/logic/detector.js';

// Mismas reglas y pesos que el script 03_seed.sql
const REGLAS = [
  { codigo: 'EXT_EJECUTABLE', peso: 0.4, activa: true },
  { codigo: 'NOMBRE_SOSPECHOSO', peso: 0.3, activa: true },
  { codigo: 'DOBLE_EXTENSION', peso: 0.25, activa: true },
  { codigo: 'TAMANO_ANOMALO', peso: 0.15, activa: true },
];

function archivo(nombre, extension, tamanoKb, ejecutable, malware = false) {
  return crearArchivo({
    id: 1, nombre, extension, tamano_kb: tamanoKb,
    es_malware: malware, es_prioritario: false, es_ejecutable: ejecutable, estado: 'pendiente',
  });
}

test('Detector: un documento común no activa ninguna regla', () => {
  const r = evaluarArchivo(archivo('Informe_Gerencia_05', 'docx', 300, false), REGLAS);
  assert.equal(r.puntaje, 0);
  assert.deepEqual(r.reglas, []);
  assert.equal(r.alerta, false);
});

test('Detector: un malware evidente se marca como infectado', () => {
  const r = evaluarArchivo(archivo('Ransomware_Malware_03', 'exe', 900, true, true), REGLAS);
  assert.equal(r.puntaje, 0.7);
  assert.deepEqual(r.reglas, ['EXT_EJECUTABLE', 'NOMBRE_SOSPECHOSO']);
  assert.equal(r.alerta, true);
  assert.equal(r.infectado, true);
});

test('Detector: detecta la doble extensión de un ejecutable disfrazado', () => {
  const r = evaluarArchivo(archivo('Factura_2026_07.pdf', 'exe', 500, true, true), REGLAS);
  assert.equal(r.puntaje, 0.65);
  assert.ok(r.reglas.includes('DOBLE_EXTENSION'));
  assert.equal(r.alerta, true);
});

test('Detector: limitación conocida, un malware sin señales evidentes no genera alerta', () => {
  const malware = archivo('Actualizacion_Sistema_12', 'exe', 500, true, true);
  const r = evaluarArchivo(malware, REGLAS);
  assert.equal(malware.esMalware, true);
  assert.equal(r.puntaje, 0.4);
  assert.equal(r.alerta, false); // falso negativo: es el caso que obliga a usar el rollback
});

test('Detector: un ejecutable legítimo muy pequeño produce un falso positivo (sospechoso)', () => {
  const legitimo = archivo('Instalador_Agente_09', 'exe', 100, true, false);
  const r = evaluarArchivo(legitimo, REGLAS);
  assert.equal(legitimo.esMalware, false);
  assert.equal(r.puntaje, 0.55);
  assert.equal(r.alerta, true);
  assert.equal(r.infectado, false);
});

test('Detector: una regla desactivada no suma al puntaje', () => {
  const reglas = REGLAS.map((r) => (r.codigo === 'EXT_EJECUTABLE' ? { ...r, activa: false } : r));
  const r = evaluarArchivo(archivo('Ransomware_Malware_03', 'exe', 900, true, true), reglas);
  assert.equal(r.puntaje, 0.3);
  assert.equal(r.alerta, false);
});

test('Detector: el puntaje nunca supera 1 y la severidad es 5', () => {
  const r = evaluarArchivo(archivo('Virus_Hack.pdf', 'exe', 100, true, true), REGLAS);
  assert.equal(r.reglas.length, 4);
  assert.equal(r.puntaje, 1);
  assert.equal(r.severidad, 5);
});

test('Detector: la severidad siempre está entre 1 y 5', () => {
  const casos = [
    archivo('Informe_Gerencia_05', 'docx', 300, false),
    archivo('Instalador_Agente_09', 'exe', 100, true),
    archivo('Ransomware_Malware_03', 'exe', 900, true, true),
    archivo('Virus_Hack.pdf', 'exe', 100, true, true),
  ];
  for (const caso of casos) {
    const { severidad } = evaluarArchivo(caso, REGLAS);
    assert.ok(severidad >= 1 && severidad <= 5);
  }
});

test('Detector: es una función pura (no modifica sus argumentos y es determinista)', () => {
  const reglas = Object.freeze(REGLAS.map((r) => Object.freeze({ ...r })));
  const a = Object.freeze(archivo('Ransomware_Malware_03', 'exe', 900, true, true));
  assert.deepEqual(evaluarArchivo(a, reglas), evaluarArchivo(a, reglas));
});