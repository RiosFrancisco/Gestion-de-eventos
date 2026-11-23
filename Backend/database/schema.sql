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


CREATE TABLE eventos (
    id BIGSERIAL PRIMARY KEY,
    creador_id BIGINT NOT NULL REFERENCES usuarios(id),
    categoria_id INTEGER NOT NULL REFERENCES categorias_evento(id),
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    ubicacion VARCHAR(200) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'publicado'
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
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) NOT NULL DEFAULT 'publicado'
    CHECK (estado IN ('publicado', 'cancelado', 'finalizado'))
);


CREATE TABLE inscripciones_actividades (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL
        REFERENCES usuarios(id),
    actividad_id BIGINT NOT NULL
        REFERENCES actividades(id)
        ON DELETE CASCADE,
    estado VARCHAR(20) NOT NULL DEFAULT 'activa'
        CHECK (estado IN ('activa', 'cancelada')),
    fecha_inscripcion TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,
    fecha_cancelacion TIMESTAMP NULL,
    UNIQUE (usuario_id, actividad_id)
);

CREATE TABLE inscripciones_eventos (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL
        REFERENCES usuarios(id),
    evento_id BIGINT NOT NULL
        REFERENCES eventos(id)
        ON DELETE CASCADE,
    estado VARCHAR(20) NOT NULL DEFAULT 'activa'
        CHECK (estado IN ('activa', 'cancelada')),
    fecha_inscripcion TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,
    fecha_cancelacion TIMESTAMP NULL,
    UNIQUE (usuario_id, evento_id)
);


CREATE TABLE asistencias (
    id BIGSERIAL PRIMARY KEY,
    inscripcion_actividad_id BIGINT NOT NULL
        REFERENCES inscripciones_actividades(id)
        ON DELETE CASCADE,
    presente BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_registro TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (inscripcion_actividad_id)
);



