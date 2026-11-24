import { pool } from "../config/database";
import type { InscripcionEvento } from "../models/inscripcionEvento.model";

// Convertir los datos de PostgreSQL al modelo
function mapInscripcion(row: any): InscripcionEvento {
    return {
        id: Number(row.id),
        usuario_id: Number(row.usuario_id),
        evento_id: Number(row.evento_id),
        estado: row.estado,
        fecha_inscripcion: row.fecha_inscripcion,
        fecha_cancelacion: row.fecha_cancelacion
    };
}

// Obtener una inscripción por usuario y evento
export async function getInscripcionEvento(
    usuarioId: number,
    eventoId: number
): Promise<InscripcionEvento | undefined> {

    const resultado = await pool.query(
        `SELECT *
         FROM inscripciones_eventos
         WHERE usuario_id = $1
           AND evento_id = $2`,
        [usuarioId, eventoId]
    );

    if (resultado.rows.length === 0) {
        return undefined;
    }

    return mapInscripcion(resultado.rows[0]);
}

// Crear una inscripción o reactivar una cancelada
export async function crearInscripcionEvento(
    usuarioId: number,
    eventoId: number
): Promise<InscripcionEvento | undefined> {

    const resultado = await pool.query(
        `INSERT INTO inscripciones_eventos (
            usuario_id,
            evento_id
         )
         VALUES ($1, $2)

         ON CONFLICT (usuario_id, evento_id)
         DO UPDATE SET
            estado = 'activa',
            fecha_inscripcion = CURRENT_TIMESTAMP,
            fecha_cancelacion = NULL

         WHERE inscripciones_eventos.estado = 'cancelada'

         RETURNING *`,
        [usuarioId, eventoId]
    );

    if (resultado.rows.length === 0) {
        return undefined;
    }

    return mapInscripcion(resultado.rows[0]);
}

// Cancelar la inscripción al evento y sus actividades
export async function cancelarInscripcionEvento(
    usuarioId: number,
    eventoId: number
): Promise<InscripcionEvento | undefined> {

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const resultado = await client.query(
            `UPDATE inscripciones_eventos
             SET
                estado = 'cancelada',
                fecha_cancelacion = CURRENT_TIMESTAMP
             WHERE usuario_id = $1
               AND evento_id = $2
               AND estado = 'activa'
             RETURNING *`,
            [usuarioId, eventoId]
        );

        if (resultado.rows.length === 0) {
            await client.query("ROLLBACK");
            return undefined;
        }

        await client.query(
            `UPDATE inscripciones_actividades AS ia
             SET
                estado = 'cancelada',
                fecha_cancelacion = CURRENT_TIMESTAMP
             FROM actividades AS a
             WHERE ia.actividad_id = a.id
               AND ia.usuario_id = $1
               AND a.evento_id = $2
               AND ia.estado = 'activa'`,
            [usuarioId, eventoId]
        );

        await client.query("COMMIT");

        return mapInscripcion(resultado.rows[0]);

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;

    } finally {
        client.release();
    }
}

// Consultar las inscripciones de un usuario
export async function getInscripcionesByUsuario(
    usuarioId: number
): Promise<InscripcionEvento[]> {

    const resultado = await pool.query(
        `SELECT *
         FROM inscripciones_eventos
         WHERE usuario_id = $1
         ORDER BY fecha_inscripcion DESC`,
        [usuarioId]
    );

    return resultado.rows.map(mapInscripcion);
}
