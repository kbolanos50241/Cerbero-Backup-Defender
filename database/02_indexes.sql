-- Índices de apoyo a las consultas más frecuentes de la aplicación
BEGIN;

-- Listar archivos de una sesión por estado
CREATE INDEX idx_archivo_sesion_estado ON archivo (sesion_id, estado);

-- Garantiza una cola ordenada sin posiciones repetidas; solo indexa los pendientes (índice parcial)
CREATE UNIQUE INDEX uq_archivo_cola ON archivo (sesion_id, posicion_cola)
    WHERE posicion_cola IS NOT NULL;

CREATE INDEX idx_archivo_tipo ON archivo (tipo_archivo_id);

-- Obtener el tope de la pila de restauración (el punto activo más reciente)
CREATE INDEX idx_punto_activo ON punto_restauracion (sesion_id, creado_en DESC)
    WHERE activo;

CREATE INDEX idx_pra_archivo ON punto_restauracion_archivo (archivo_id);

CREATE INDEX idx_incidente_sesion ON incidente (sesion_id, detectado_en DESC);
CREATE INDEX idx_incidente_archivo ON incidente (archivo_id);

CREATE INDEX idx_bitacora_sesion ON bitacora_evento (sesion_id, creado_en DESC);
CREATE INDEX idx_bitacora_datos ON bitacora_evento USING GIN (datos jsonb_path_ops);

COMMIT;