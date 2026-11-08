const aleatorio = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const elegir = (lista) => lista[aleatorio(0, lista.length - 1)];
const sufijo = () => String(aleatorio(1, 99)).padStart(2, '0');

const DOCUMENTOS = [
  ['Archivo_Clientes', 'xlsx'], ['Inventario_Q4', 'xlsx'], ['BaseDatos', 'sql'],
  ['Respaldo_Ventas', 'sql'], ['Contrato_Proveedor', 'docx'], ['Informe_Gerencia', 'docx'],
  ['Manual_Usuario', 'pdf'], ['Fotos_Evento', 'jpg'], ['Configuracion', 'config'],
  ['Logs_Servidor', 'zip'],
];
const EJECUTABLES_LEGITIMOS = [
  ['Instalador_Agente', 'exe'], ['Mantenimiento_Programado', 'bat'], ['Libreria_Reportes', 'dll'],
];
const MALWARE_EVIDENTE = ['Ransomware_Malware', 'Keygen_Crack', 'Trojan_Update', 'Virus_Hack'];
// [nombre base, falsa extensión o null]
const MALWARE_DISFRAZADO = [
  ['Factura_2026', 'pdf'], ['Resumen_Anual', 'docx'], ['Fotos_Vacaciones', 'jpg'],
  ['Actualizacion_Sistema', null], ['Parche_Seguridad', null],
];

export function generarArchivo() {
  const azar = Math.random();

  if (azar < 0.12) { // malware evidente: el detector casi siempre lo atrapa
    return {
      nombre: `${elegir(MALWARE_EVIDENTE)}_${sufijo()}`,
      extension: elegir(['exe', 'bat']),
      tamano_kb: aleatorio(300, 2000),
      es_malware: true,
      es_prioritario: false,
    };
  }
  if (azar < 0.24) { // malware disfrazado: puede pasar sin ser detectado
    const [base, falsa] = elegir(MALWARE_DISFRAZADO);
    return {
      nombre: `${base}_${sufijo()}${falsa ? `.${falsa}` : ''}`,
      extension: elegir(['exe', 'bat']),
      tamano_kb: aleatorio(80, 1500),
      es_malware: true,
      es_prioritario: false,
    };
  }
  if (azar < 0.32) { // ejecutable legítimo: algunos disparan falsos positivos
    const [base, extension] = elegir(EJECUTABLES_LEGITIMOS);
    return {
      nombre: `${base}_${sufijo()}`,
      extension,
      tamano_kb: aleatorio(100, 4000),
      es_malware: false,
      es_prioritario: Math.random() < 0.15,
    };
  }
  const [base, extension] = elegir(DOCUMENTOS);
  return {
    nombre: `${base}_${sufijo()}`,
    extension,
    tamano_kb: aleatorio(20, 8000),
    es_malware: false,
    es_prioritario: Math.random() < 0.15,
  };
}

export const generarLote = (cantidad) => Array.from({ length: cantidad }, generarArchivo);