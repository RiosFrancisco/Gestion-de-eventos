CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL UNIQUE
);


CREATE TABLE usuarios (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password TEXT NOT NULL,
    rol_id INTEGER NOT NULL REFERENCES roles(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE categorias_evento (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL UNIQUE
);


CREATE TABLE planes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    precio NUMERIC(12,2) NOT NULL CHECK (precio >= 0),
    duracion_dias INTEGER NOT NULL CHECK (duracion_dias > 0),
    activo BOOLEAN NOT NULL DEFAULT TRUE
);


CREATE TABLE eventos (
    id BIGSERIAL PRIMARY KEY,
    creador_id BIGINT NOT NULL REFERENCES usuarios(id),
    categoria_id INTEGER NOT NULL REFERENCES categorias_evento(id),

    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    ubicacion VARCHAR(200) NOT NULL,
    estado VARCHAR(20) NOT NULL
    CHECK (estado IN ('publicado', 'finalizado', 'cancelado')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE actividades (
    id BIGSERIAL PRIMARY KEY,
    evento_id BIGINT NOT NULL
        REFERENCES eventos(id)
        ON DELETE CASCADE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,

    capacidad INTEGER CHECK (capacidad > 0),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE inscripciones (
    id BIGSERIAL PRIMARY KEY,

    usuario_id BIGINT NOT NULL
        REFERENCES usuarios(id),
    actividad_id BIGINT NOT NULL
        REFERENCES actividades(id)
        ON DELETE CASCADE,
    fecha_inscripcion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (usuario_id, actividad_id)
);


CREATE TABLE asistencias (
    id BIGSERIAL PRIMARY KEY,
    inscripcion_id BIGINT NOT NULL
        REFERENCES inscripciones(id)
        ON DELETE CASCADE,
    presente BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (inscripcion_id)
);


CREATE TABLE noticias (
    id BIGSERIAL PRIMARY KEY,
    evento_id BIGINT NOT NULL
        REFERENCES eventos(id)
        ON DELETE CASCADE,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    imagen TEXT,
    fecha_publicacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE propuestas_gastronomicas (
    id BIGSERIAL PRIMARY KEY,
    evento_id BIGINT NOT NULL
        REFERENCES eventos(id)
        ON DELETE CASCADE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    ubicacion VARCHAR(150),
    horarios VARCHAR(150),
    informacion_adicional TEXT
);

CREATE TABLE contrataciones (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL
        REFERENCES usuarios(id),
    plan_id INTEGER NOT NULL
        REFERENCES planes(id),
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP NOT NULL,
    estado VARCHAR(20) NOT NULL
    CHECK (estado IN ('pendiente', 'activa', 'vencida', 'cancelada')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (fecha_fin > fecha_inicio)
);

CREATE TABLE pagos (
    id BIGSERIAL PRIMARY KEY,
    contratacion_id BIGINT NOT NULL
        REFERENCES contrataciones(id),
    monto NUMERIC(12,2) NOT NULL CHECK (monto >= 0),
    fecha_pago TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) NOT NULL
    CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
    metodo_pago VARCHAR(50),
    referencia_externa VARCHAR(150)
);
