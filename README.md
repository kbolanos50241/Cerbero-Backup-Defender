# Cerbero Backup Defender

Aplicación web educativa que simula un sistema de gestión de respaldos y defensa contra malware, utilizando estructuras de datos dinámicas propias (cola y pila) y una base de datos PostgreSQL. Está inspirada en las operaciones de resiliencia de Veeam Software, aunque no se conecta con ella ni realiza respaldos reales.

Trabajo final de investigación, segundo avance. Curso: Paradigmas de la programación, Universidad Fidélitas.
Autor: Kevin Bolaños Arce.

## Tecnologías

- Frontend: HTML, CSS y JavaScript (módulos ES, sin frameworks)
- Backend: Node.js, Express y la librería `pg`
- Base de datos: PostgreSQL 18 (compatible con versiones 15 o superiores)
- Pruebas: módulo `node:test` incluido en Node.js

## Requisitos previos

- Node.js 20 o superior (desarrollado con v26.13.0)
- PostgreSQL con acceso al usuario `postgres` (desarrollado con 18.4)
- Git

## Instalación y ejecución

1. Clonar el repositorio e instalar las dependencias:

```bash
git clone https://github.com/kbolanos50241/cerbero-backup-defender.git
cd cerbero-backup-defender
npm install
```

2. Crear el archivo `.env` a partir del ejemplo y escribir la contraseña del usuario `postgres`:

```bash
cp .env.example .env
```

3. Crear la base de datos y ejecutar los scripts en este orden:

```bash
psql -U postgres -h localhost -c "CREATE DATABASE cerbero;"
psql -U postgres -h localhost -d cerbero -f database/01_schema.sql
psql -U postgres -h localhost -d cerbero -f database/02_indexes.sql
psql -U postgres -h localhost -d cerbero -f database/03_seed.sql
```

Notas:
- Si `psql` no se reconoce, agregue la carpeta `bin` de PostgreSQL al PATH (por ejemplo `C:\Program Files\PostgreSQL\18\bin`) o ejecute los tres scripts desde la herramienta Query Tool de pgAdmin 4, conectado a la base `cerbero`.
- En Git Bash puede ser necesario anteponer `winpty` a los comandos `psql` para que pida la contraseña.
- `01_schema.sql` elimina y vuelve a crear las tablas, por lo que reinicia los datos.

4. Iniciar el servidor:

```bash
npm start
```

5. Abrir <http://localhost:3000> en el navegador.

## Cómo probar la aplicación

La pantalla tiene cuatro zonas:

1. **Cola de respaldo (FIFO):** archivos que llegan al servidor. Los que el detector considera sospechosos aparecen con una alerta roja.
2. **Área de procesamiento:** estado del servidor (en espera, amenaza retenida o sistema comprometido).
3. **Panel de acciones:** botones y estadísticas de la sesión.
4. **Pila de restauración (LIFO):** puntos de restauración generados; la cima indica el estado actual del sistema.

Flujo del juego:

- **Procesar siguiente:** retira el primer archivo de la cola. Si tiene alerta, queda retenido como amenaza; si no, se respalda y se apila un punto de restauración.
- **Neutralizar malware:** aísla la amenaza retenida (+50 puntos si era malware real, -15 si era un falso positivo).
- **Ejecutar rollback:** retira el punto de la cima de la pila (+30 si estaba comprometido, -10 si estaba limpio).
- Algunos malware disfrazados no son detectados. Si se respaldan, el sistema queda **comprometido** y se bloquea el procesamiento hasta ejecutar rollback.
- Los archivos llegan automáticamente cada 7 segundos (se puede desactivar). El botón "Lote de 5" agrega archivos manualmente y "Nueva sesión" reinicia la partida.
- La sesión se guarda en PostgreSQL: al recargar la página se retoma la cola, la pila y la amenaza retenida.

## Pruebas automáticas

```bash
npm test             # pruebas unitarias de Cola, Pila, Archivo/Malware, detector y generador
npm run benchmark    # comparación de rendimiento y resultados en docs/resultados_rendimiento.csv
```

## Estructura del proyecto

```
cerbero-backup-defender/
├── database/        scripts SQL: esquema, índices y datos iniciales
├── server/          API REST (config, routes, repositories)
├── public/          interfaz web
│   ├── css/
│   └── js/          structures, models, logic, ui, api.js y main.js
├── tests/           pruebas automáticas y benchmark
└── docs/            capturas de pantalla y resultados
```

## API REST (resumen)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/salud` | Verifica la conexión con PostgreSQL |
| POST | `/api/sesiones` | Crea una sesión y su respaldo base |
| GET | `/api/sesiones/:id/estado` | Cola, pila y estadísticas de la sesión |
| PATCH | `/api/sesiones/:id/puntaje` | Actualiza el puntaje |
| POST | `/api/archivos` | Encola archivos |
| PATCH | `/api/archivos/:id/estado` | Registra el resultado del procesamiento |
| POST | `/api/puntos` | Apila un punto de restauración |
| POST | `/api/puntos/:id/restaurar` | Retira el punto de la cima (LIFO) |
| POST | `/api/registros/incidentes` | Registra un incidente |
| POST | `/api/registros/bitacora` | Registra un evento |
| GET | `/api/catalogos/reglas` | Reglas de detección y sus pesos |

## Base de datos

Diez tablas: `sesion`, `tipo_archivo`, `archivo`, `punto_restauracion`, `punto_restauracion_archivo`, `incidente`, `bitacora_evento`, `regla_deteccion`, `generacion_genetica` y `lenguaje_historia`. Incluye tipos `ENUM`, restricciones `CHECK`, índices parciales y un índice GIN sobre una columna `JSONB`. Algunas tablas (`generacion_genetica`, `lenguaje_historia`) quedan preparadas para avances posteriores.

## Alcance y limitaciones

Todo es simulado: los archivos, las amenazas, el consumo de CPU y RAM y los puntos de restauración. La aplicación no realiza respaldos reales, no analiza archivos del equipo ni detecta malware real, y no es un antivirus.