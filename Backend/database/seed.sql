INSERT INTO roles (nombre)
VALUES
    ('usuario'),
    ('creador'),
    ('admin');


INSERT INTO categorias_evento (nombre)
VALUES
    ('Tecnología'),
    ('Música'),
    ('Deportes'),
    ('Educación'),
    ('Gastronomía');


INSERT INTO planes (
    nombre,
    descripcion,
    precio,
    duracion_dias
)
VALUES
(
    'Plan Básico',
    'Permite administrar un evento.',
    10000,
    30
),
(
    'Plan Profesional',
    'Permite administrar eventos con funcionalidades adicionales.',
    25000,
    90
);