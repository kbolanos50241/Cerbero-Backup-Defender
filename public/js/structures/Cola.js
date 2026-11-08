import { Nodo } from './Nodo.js';

// Cola FIFO implementada con lista enlazada: encolar y desencolar son O(1)
export class Cola {
  #frente = null;
  #final = null;
  #tamano = 0;

  encolar(valor) {
    const nodo = new Nodo(valor);
    if (this.#final) this.#final.siguiente = nodo;
    else this.#frente = nodo;
    this.#final = nodo;
    this.#tamano++;
  }

  desencolar() {
    if (!this.#frente) return null;
    const nodo = this.#frente;
    this.#frente = nodo.siguiente;
    if (!this.#frente) this.#final = null;
    this.#tamano--;
    return nodo.valor;
  }

  frente() {
    return this.#frente ? this.#frente.valor : null;
  }

  estaVacia() {
    return this.#tamano === 0;
  }

  tamano() {
    return this.#tamano;
  }

  // Recorre del primero al último en llegar
  *[Symbol.iterator]() {
    let actual = this.#frente;
    while (actual) {
      yield actual.valor;
      actual = actual.siguiente;
    }
  }
}