const ICONOS = {
  xlsx: '📗', sql: '🗄️', docx: '📘', pdf: '📕', jpg: '🖼️',
  config: '⚙️', zip: '🗜️', dll: '🧩', bat: '📜', exe: '⚙️',
};

// Archivo legítimo (clase base)
export class Archivo {
  constructor(datos) {
    this.id = datos.id;
    this.nombre = datos.nombre;
    this.extension = datos.extension;
    this.tamanoKb = datos.tamano_kb;
    this.esMalware = datos.es_malware;
    this.esPrioritario = datos.es_prioritario;
    this.esEjecutable = datos.es_ejecutable;
    this.estado = datos.estado;
    this.analisis = null; // lo asigna el detector
  }

  nombreCompleto() {
    return `${this.nombre}.${this.extension}`;
  }

  icono() {
    return ICONOS[this.extension] ?? '📄';
  }

  // Métodos que las subclases sobrescriben (polimorfismo)
  veredictoReal() { return 'Archivo legítimo'; }
  puntosAlNeutralizar() { return -15; }          // falso positivo
  puntosAlRespaldar() { return this.esPrioritario ? 20 : 10; }
  estadoSistemaAlRespaldar() { return 'Limpio'; }
}

// Malware: hereda de Archivo y cambia su comportamiento
export class Malware extends Archivo {
  veredictoReal() { return 'Malware confirmado'; }
  puntosAlNeutralizar() { return 50; }
  puntosAlRespaldar() { return 0; }
  estadoSistemaAlRespaldar() { return 'Comprometido'; }
}

export function crearArchivo(datos) {
  return datos.es_malware ? new Malware(datos) : new Archivo(datos);
}