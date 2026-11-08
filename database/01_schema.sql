-- Cerbero Backup Defender - Esquema para PostgreSQL 17
BEGIN;

DROP TABLE IF EXISTS generacion_genetica, bitacora_evento, incidente,
    punto_restauracion_archivo, punto_restauracion, archivo, tipo_archivo,
    regla_deteccion, lenguaje_historia, sesion CASCADE;
DROP TYPE IF EXISTS estado_archivo, accion_incidente, origen_deteccion;

CREATE TYPE estado_archivo AS ENUM
    ('pendiente', 'seguro', 'sospechoso', 'infectado', 'aislado', 'respaldado');
CREATE TYPE accion_incidente AS ENUM ('neutralizado', 'aislado', 'ignorado');
CREATE TYPE origen_deteccion AS ENUM ('regla_logica', 'algoritmo_genetico', 'manual');

CREATE TABLE sesion (
    id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    alias         VARCHAR(50)  NOT NULL DEFAULT 'Administrador',
    iniciada_en   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    finalizada_en TIMESTAMPTZ,
    puntaje       INTEGER      NOT NULL DEFAULT 0,
    CHECK (finalizada_en IS NULL OR finalizada_en >= iniciada_en)
);

CREATE TABLE tipo_archivo (
    id            SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    extension     VARCHAR(10) NOT NULL UNIQUE,
    descripcion   VARCHAR(80) NOT NULL,
    nivel_riesgo  SMALLINT    NOT NULL CHECK (nivel_riesgo BETWEEN 0 AND 3),
    es_ejecutable BOOLEAN     NOT NULL DEFAULT false
);

CREATE TABLE archivo (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sesion_id       INTEGER      NOT NULL REFERENCES sesion(id) ON DELETE CASCADE,
    tipo_archivo_id SMALLINT     NOT NULL REFERENCES tipo_archivo(id),
    nombre          VARCHAR(120) NOT NULL,
    tamano_kb       INTEGER      NOT NULL CHECK (tamano_kb > 0),
    es_malware      BOOLEAN      NOT NULL DEFAULT false,
    es_prioritario  BOOLEAN      NOT NULL DEFAULT false,
    estado          estado_archivo NOT NULL DEFAULT 'pendiente',
    posicion_cola   INTEGER,
    puntaje_riesgo  NUMERIC(4,3) CHECK (puntaje_riesgo BETWEEN 0 AND 1),
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    procesado_en    TIMESTAMPTZ,
    -- Un archivo tiene posición en la cola si y solo si está pendiente
    CHECK ((estado = 'pendiente') = (posicion_cola IS NOT NULL))
);

CREATE TABLE punto_restauracion (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sesion_id      INTEGER     NOT NULL REFERENCES sesion(id) ON DELETE CASCADE,
    etiqueta       VARCHAR(80) NOT NULL,
    estado_sistema VARCHAR(30) NOT NULL DEFAULT 'Limpio',
    activo         BOOLEAN     NOT NULL DEFAULT true,
    creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
    restaurado_en  TIMESTAMPTZ
);

CREATE TABLE punto_restauracion_archivo (
    punto_id   BIGINT NOT NULL REFERENCES punto_restauracion(id) ON DELETE CASCADE,
    archivo_id BIGINT NOT NULL REFERENCES archivo(id) ON DELETE CASCADE,
    PRIMARY KEY (punto_id, archivo_id)
);

CREATE TABLE incidente (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sesion_id    INTEGER          NOT NULL REFERENCES sesion(id) ON DELETE CASCADE,
    archivo_id   BIGINT           NOT NULL REFERENCES archivo(id) ON DELETE CASCADE,
    detectado_por origen_deteccion NOT NULL,
    accion       accion_incidente NOT NULL,
    severidad    SMALLINT         NOT NULL CHECK (severidad BETWEEN 1 AND 5),
    detectado_en TIMESTAMPTZ      NOT NULL DEFAULT now()
);

CREATE TABLE bitacora_evento (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sesion_id   INTEGER     NOT NULL REFERENCES sesion(id) ON DELETE CASCADE,
    tipo        VARCHAR(30) NOT NULL,
    descripcion TEXT        NOT NULL,
    datos       JSONB       NOT NULL DEFAULT '{}'::jsonb,
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE regla_deteccion (
    id          SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo      VARCHAR(40)  NOT NULL UNIQUE,
    descripcion VARCHAR(200) NOT NULL,
    peso        NUMERIC(4,3) NOT NULL CHECK (peso BETWEEN 0 AND 1),
    activa      BOOLEAN      NOT NULL DEFAULT true
);

CREATE TABLE generacion_genetica (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sesion_id         INTEGER      NOT NULL REFERENCES sesion(id) ON DELETE CASCADE,
    numero_generacion INTEGER      NOT NULL CHECK (numero_generacion >= 0),
    mejor_aptitud     NUMERIC(5,4) NOT NULL CHECK (mejor_aptitud BETWEEN 0 AND 1),
    aptitud_promedio  NUMERIC(5,4) NOT NULL CHECK (aptitud_promedio BETWEEN 0 AND 1),
    pesos             JSONB        NOT NULL,
    creado_en         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE (sesion_id, numero_generacion)
);

CREATE TABLE lenguaje_historia (
    id                SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre            VARCHAR(40)  NOT NULL UNIQUE,
    anio              SMALLINT     NOT NULL CHECK (anio BETWEEN 1940 AND 2100),
    creador           VARCHAR(80)  NOT NULL,
    paradigma         VARCHAR(60)  NOT NULL,
    aporte            VARCHAR(200) NOT NULL,
    usado_en_proyecto BOOLEAN      NOT NULL DEFAULT false
);

COMMIT;