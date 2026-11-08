import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Archivo, Malware, crearArchivo } from '../public/js/models/Archivo.js';

const datos = {
  id: 1,
  nombre: 'Informe_Gerencia_05',
  extension: 'docx',
  tamano_kb: 300,
  es_malware: false,
  es_prioritario: false,
  es_ejecutable: false,
  estado: 'pendiente',
};

test('Archivo: comportamiento de un archivo legítimo', () => {
  const archivo = new Archivo(datos);
  assert.equal(archivo.nombreCompleto(), 'Informe_Gerencia_05.docx');
  assert.equal(archivo.icono(), '📘');
  assert.equal(archivo.veredictoReal(), 'Archivo legítimo');
  assert.equal(archivo.puntosAlNeutralizar(), -15);
  assert.equal(archivo.puntosAlRespaldar(), 10);
  assert.equal(archivo.estadoSistemaAlRespaldar(), 'Limpio');
});

test('Archivo: un archivo prioritario otorga más puntos al respaldarse', () => {
  const archivo = new Archivo({ ...datos, es_prioritario: true });
  assert.equal(archivo.puntosAlRespaldar(), 20);
});

test('Malware: hereda de Archivo y sobrescribe su comportamiento (polimorfismo)', () => {
  const malware = new Malware({ ...datos, es_malware: true });
  assert.ok(malware instanceof Archivo);
  assert.equal(malware.veredictoReal(), 'Malware confirmado');
  assert.equal(malware.puntosAlNeutralizar(), 50);
  assert.equal(malware.puntosAlRespaldar(), 0);
  assert.equal(malware.estadoSistemaAlRespaldar(), 'Comprometido');
});

test('crearArchivo: elige la clase según es_malware', () => {
  assert.ok(crearArchivo({ ...datos, es_malware: true }) instanceof Malware);
  const legitimo = crearArchivo(datos);
  assert.ok(legitimo instanceof Archivo);
  assert.ok(!(legitimo instanceof Malware));
});

test('Archivo: una extensión desconocida usa el ícono por defecto', () => {
  assert.equal(new Archivo({ ...datos, extension: 'xyz' }).icono(), '📄');
});