-- Datos iniciales de catálogos
BEGIN;

INSERT INTO tipo_archivo (extension, descripcion, nivel_riesgo, es_ejecutable) VALUES
    ('xlsx',   'Hoja de cálculo Excel',      0, false),
    ('sql',    'Script o respaldo SQL',      0, false),
    ('docx',   'Documento Word',             0, false),
    ('pdf',    'Documento PDF',              0, false),
    ('jpg',    'Imagen JPEG',                0, false),
    ('config', 'Archivo de configuración',   1, false),
    ('zip',    'Archivo comprimido',         2, false),
    ('dll',    'Biblioteca dinámica',        2, true),
    ('bat',    'Script por lotes',           3, true),
    ('exe',    'Ejecutable',                 3, true)
ON CONFLICT (extension) DO NOTHING;

INSERT INTO regla_deteccion (codigo, descripcion, peso) VALUES
    ('EXT_EJECUTABLE',    'La extensión corresponde a un ejecutable', 0.400),
    ('NOMBRE_SOSPECHOSO', 'El nombre contiene palabras como ransomware, crack o keygen', 0.300),
    ('DOBLE_EXTENSION',   'El nombre tiene doble extensión, por ejemplo factura.pdf.exe', 0.250),
    ('TAMANO_ANOMALO',    'El tamaño es inusual para su tipo de archivo', 0.150)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO lenguaje_historia (nombre, anio, creador, paradigma, aporte, usado_en_proyecto) VALUES
    ('Fortran',    1957, 'John Backus',               'Imperativo',            'Primer lenguaje de alto nivel ampliamente usado', false),
    ('Lisp',       1958, 'John McCarthy',             'Funcional',             'Base de la programación funcional y de la IA simbólica', false),
    ('C',          1972, 'Dennis Ritchie',            'Imperativo',            'Programación de sistemas con control de memoria', false),
    ('Smalltalk',  1972, 'Alan Kay',                  'Orientado a objetos',   'Popularizó los objetos y el paso de mensajes', false),
    ('Prolog',     1972, 'Alain Colmerauer',          'Lógico',                'Programación basada en hechos, reglas e inferencia', true),
    ('SQL',        1974, 'Chamberlin y Boyce (IBM)',  'Declarativo',           'Lenguaje estándar de consulta de bases de datos relacionales', true),
    ('Haskell',    1990, 'Comité internacional',      'Funcional puro',        'Funciones puras y evaluación perezosa', false),
    ('Python',     1991, 'Guido van Rossum',          'Multiparadigma',        'Sintaxis legible; muy usado en IA', false),
    ('JavaScript', 1995, 'Brendan Eich',              'Multiparadigma',        'Lenguaje de la web, base de la interfaz y del servidor Node.js', true)
ON CONFLICT (nombre) DO NOTHING;

COMMIT;