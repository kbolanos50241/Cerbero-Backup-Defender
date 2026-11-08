export const UMBRAL_ALERTA = 0.5;
export const UMBRAL_INFECTADO = 0.65;

const PALABRAS_SOSPECHOSAS = /(ransom|malware|crack|keygen|trojan|virus|hack)/i;

// Cada condición es una función pura: (archivo) => boolean
export const CONDICIONES = {
  EXT_EJECUTABLE: (a) => a.esEjecutable,
  NOMBRE_SOSPECHOSO: (a) => PALABRAS_SOSPECHOSAS.test(a.nombre),
  DOBLE_EXTENSION: (a) => a.esEjecutable && /\.(pdf|docx|xlsx|jpg|txt)$/i.test(a.nombre),
  TAMANO_ANOMALO: (a) => a.esEjecutable && a.tamanoKb < 150,
};

// Devuelve el análisis del archivo según las reglas (con sus pesos) cargadas desde la BD
export function evaluarArchivo(archivo, reglas) {
  const activadas = reglas.filter((r) => r.activa && CONDICIONES[r.codigo]?.(archivo));
  const suma = activadas.reduce((total, r) => total + r.peso, 0);
  const puntaje = Math.round(Math.min(1, suma) * 1000) / 1000;
  return {
    puntaje,
    reglas: activadas.map((r) => r.codigo),
    alerta: puntaje >= UMBRAL_ALERTA,
    infectado: puntaje >= UMBRAL_INFECTADO,
    severidad: Math.min(5, Math.max(1, Math.round(puntaje * 5))),
  };
}