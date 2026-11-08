import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Pila } from '../public/js/structures/Pila.js';

test('Pila: respeta el orden LIFO', () => {
  const pila = new Pila();
  ['a', 'b', 'c'].forEach((x) => pila.apilar(x));
  assert.equal(pila.desapilar(), 'c');
  assert.equal(pila.desapilar(), 'b');
  assert.equal(pila.desapilar(), 'a');
});

test('Pila: desapilar en una pila vacía devuelve null', () => {
  assert.equal(new Pila().desapilar(), null);
});

test('Pila: tamano() y estaVacia() se mantienen consistentes', () => {
  const pila = new Pila();
  assert.equal(pila.estaVacia(), true);
  pila.apilar(1);
  pila.apilar(2);
  assert.equal(pila.tamano(), 2);
  assert.equal(pila.estaVacia(), false);
  pila.desapilar();
  pila.desapilar();
  assert.equal(pila.tamano(), 0);
  assert.equal(pila.estaVacia(), true);
});

test('Pila: cima() consulta sin retirar el elemento', () => {
  const pila = new Pila();
  pila.apilar('x');
  pila.apilar('y');
  assert.equal(pila.cima(), 'y');
  assert.equal(pila.tamano(), 2);
});

test('Pila: el iterador recorre de la cima hacia la base', () => {
  const pila = new Pila();
  pila.apilar('x');
  pila.apilar('y');
  assert.deepEqual([...pila], ['y', 'x']);
  assert.equal(pila.tamano(), 2);
});

test('Pila: puede reutilizarse después de vaciarse', () => {
  const pila = new Pila();
  pila.apilar(1);
  pila.desapilar();
  pila.apilar(2);
  assert.equal(pila.cima(), 2);
  assert.equal(pila.tamano(), 1);
});