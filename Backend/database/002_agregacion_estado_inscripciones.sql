BEGIN;

ALTER TABLE inscripciones
ADD COLUMN estado VARCHAR(20) NOT NULL DEFAULT 'activa'
    CHECK (estado IN ('activa', 'cancelada')),
ADD COLUMN fecha_cancelacion TIMESTAMP NULL;

COMMIT;