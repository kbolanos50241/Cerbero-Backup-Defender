import { Nodo } from './Nodo.js';

// Pila LIFO implementada con lista enlazada: apilar y desapilar son O(1)
export class Pila {
  #cima = null;
  #tamano = 0;

  apilar(valor) {
    const nodo = new Nodo(valor);
    nodo.siguiente = this.#cima;
    this.#cima = nodo;
    this.#tamano++;
  }

  desapilar() {
    if (!this.#cima) return null;
    const nodo = this.#cima;
    this.#cima = nodo.siguiente;
    this.#tamano--;
    return nodo.valor;
  }

  cima() {
    return this.#cima ? this.#cima.valor : null;
  }

  estaVacia() {
    return this.#tamano === 0;
  }

  tamano() {
    return this.#tamano;
  }

  // Recorre de la cima hacia la base
  *[Symbol.iterator]() {
    let actual = this.#cima;
    while (actual) {
      yield actual.valor;
      actual = actual.siguiente;
    }
  }
}