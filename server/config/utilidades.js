export class ErrorHttp extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}

// Envuelve un manejador async para que sus errores lleguen al middleware de errores
export const manejar = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Valida que un valor sea un entero positivo
export function entero(valor, nombre) {
  const n = Number(valor);
  if (!Number.isInteger(n) || n <= 0) {
    throw new ErrorHttp(400, `${nombre} inválido`);
  }
  return n;
}