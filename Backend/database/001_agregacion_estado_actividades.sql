BEGIN;

ALTER TABLE actividades
ADD COLUMN estado VARCHAR(20)
NOT NULL DEFAULT 'publicado';

ALTER TABLE actividades
ADD CONSTRAINT chk_actividades_estado
CHECK (estado IN ('publicado', 'cancelado', 'finalizado'));

COMMIT;