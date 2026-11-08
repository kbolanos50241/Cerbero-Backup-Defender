import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generarLote } from '../public/js/models/generadorArchivos.js';

const EXTENSIONES = ['xlsx', 'sql', 'docx', 'pdf', 'jpg', 'config', 'zip', 'dll', 'bat', 'exe'];

test('Generador: crea la cantidad pedida con datos válidos', () => {
  const lote = generarLote(200);
  assert.equal(lote.length, 200);
  for (const a of lote) {
    assert.ok(a.nombre.length > 0 && a.nombre.length <= 120);
    assert.ok(EXTENSIONES.includes(a.extension));
    assert.ok(Number.isInteger(a.tamano_kb) && a.tamano_kb > 0);
    assert.equal(typeof a.es_malware, 'boolean');
    assert.equal(typeof a.es_prioritario, 'boolean');
  }
});

test('Generador: todo malware generado es un ejecutable (exe o bat)', () => {
  for (const a of generarLote(300).filter((x) => x.es_malware)) {
    assert.ok(['exe', 'bat'].includes(a.extension));
  }
});

test('Generador: un lote de cero archivos es una lista vacía', () => {
  assert.deepEqual(generarLote(0), []);
});