export class PuntoRestauracion {
  constructor(datos) {
    this.id = datos.id;
    this.etiqueta = datos.etiqueta;
    this.estadoSistema = datos.estado_sistema;
    this.creadoEn = new Date(datos.creado_en);
  }

  get comprometido() {
    return this.estadoSistema === 'Comprometido';
  }
}