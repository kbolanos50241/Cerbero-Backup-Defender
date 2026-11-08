import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Cola } from '../public/js/structures/Cola.js';

test('Cola: respeta el orden FIFO', () => {
  const cola = new Cola();
  ['a', 'b', 'c'].forEach((x) => cola.encolar(x));
  assert.equal(cola.desencolar(), 'a');
  assert.equal(cola.desencolar(), 'b');
  assert.equal(cola.desencolar(), 'c');
});

test('Cola: desencolar en una cola vacía devuelve null', () => {
  assert.equal(new Cola().desencolar(), null);
});

test('Cola: tamano() y estaVacia() se mantienen consistentes', () => {
  const cola = new Cola();
  assert.equal(cola.estaVacia(), true);
  cola.encolar(1);
  cola.encolar(2);
  assert.equal(cola.tamano(), 2);
  assert.equal(cola.estaVacia(), false);
  cola.desencolar();
  cola.desencolar();
  assert.equal(cola.tamano(), 0);
  assert.equal(cola.estaVacia(), true);
});

test('Cola: frente() consulta sin retirar el elemento', () => {
  const cola = new Cola();
  cola.encolar('x');
  assert.equal(cola.frente(), 'x');
  assert.equal(cola.tamano(), 1);
});

test('Cola: el iterador recorre del primero al último sin modificarla', () => {
  const cola = new Cola();
  cola.encolar('x');
  cola.encolar('y');
  assert.deepEqual([...cola], ['x', 'y']);
  assert.equal(cola.tamano(), 2);
});

test('Cola: puede reutilizarse después de vaciarse', () => {
  const cola = new Cola();
  cola.encolar(1);
  cola.desencolar();
  cola.encolar(2);
  assert.equal(cola.frente(), 2);
  assert.equal(cola.tamano(), 1);
});