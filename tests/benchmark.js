import { performance } from 'node:perf_hooks';
import { writeFileSync } from 'node:fs';
import { Cola } from '../public/js/structures/Cola.js';
import { Pila } from '../public/js/structures/Pila.js';

const TAMANOS = [1_000, 10_000, 50_000, 100_000, 200_000];
const REPETICIONES = 3;

// Cada escenario inserta n elementos y luego los retira todos (2n operaciones)
const escenarios = {
  'Cola enlazada (ms)': (n) => {
    const cola = new Cola();
    for (let i = 0; i < n; i++) cola.encolar(i);
    while (!cola.estaVacia()) cola.desencolar();
  },
  'Arreglo push/shift (ms)': (n) => {
    const arreglo = [];
    for (let i = 0; i < n; i++) arreglo.push(i);
    while (arreglo.length > 0) arreglo.shift();
  },
  'Pila enlazada (ms)': (n) => {
    const pila = new Pila();
    for (let i = 0; i < n; i++) pila.apilar(i);
    while (!pila.estaVacia()) pila.desapilar();
  },
  'Arreglo push/pop (ms)': (n) => {
    const arreglo = [];
    for (let i = 0; i < n; i++) arreglo.push(i);
    while (arreglo.length > 0) arreglo.pop();
  },
};

function medir(fn, n) {
  const inicio = performance.now();
  fn(n);
  return performance.now() - inicio;
}

const mediana = (valores) => [...valores].sort((a, b) => a - b)[Math.floor(valores.length / 2)];

// Calentamiento para que el motor optimice el código antes de medir
Object.values(escenarios).forEach((fn) => fn(1_000));

console.log(`Comparación de estructuras (mediana de ${REPETICIONES} repeticiones). Puede tardar unos segundos...\n`);

const filas = [];
for (const n of TAMANOS) {
  const fila = { elementos: n, operaciones: 2 * n };
  for (const [nombre, fn] of Object.entries(escenarios)) {
    const tiempos = Array.from({ length: REPETICIONES }, () => medir(fn, n));
    fila[nombre] = Number(mediana(tiempos).toFixed(2));
  }
  filas.push(fila);
}

console.table(filas);

const columnas = Object.keys(filas[0]);
const csv = [columnas.join(','), ...filas.map((f) => columnas.map((c) => f[c]).join(','))].join('\n');
writeFileSync(new URL('../docs/resultados_rendimiento.csv', import.meta.url), csv);
console.log('\nResultados guardados en docs/resultados_rendimiento.csv');