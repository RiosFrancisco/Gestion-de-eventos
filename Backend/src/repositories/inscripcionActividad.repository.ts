import { pool } from "../config/database";
import type {
    InscripcionActividad
} from "../models/inscripcionActividad.model";
type ResultadoInscripcion =
    | { tipo: "ok"; inscripcion: InscripcionActividad }
    | { tipo: "actividad no existe" }
    | { tipo: "evento no inscrito" }
    | { tipo: "evento no disponible" }
    | { tipo: "actividad no disponible" }
    | { tipo: "sin cupo" }
    | { tipo: "ya inscrito" };


    function mapInscripcion(
    row: Record<string, any>
): InscripcionActividad {
    return {
        id: Number(row.id),
        usuario_id: Number(row.usuario_id),
        actividad_id: Number(row.actividad_id),
        estado: row.estado,
        fecha_inscripcion: row.fecha_inscripcion,
        fecha_cancelacion: row.fecha_cancelacion
    };
}


// Crear o reactivar inscripción, respetando los cupos.
export async function crearInscripcionActividad(
    usuarioId: number,
    actividadId: number
): Promise<ResultadoInscripcion> {

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Identificamos el evento al que pertenece la actividad.
        const actividadReferencia = await client.query(
            `SELECT evento_id
             FROM actividades
             WHERE id = $1`,
            [actividadId]
        );

        if (actividadReferencia.rows.length === 0) {
            await client.query("ROLLBACK");
            return { tipo: "actividad no existe" };
        }

        const eventoId = actividadReferencia.rows[0].evento_id;

        // Bloqueamos la inscripción al evento. La cancelación de inscripción al evento también. actualiza esta fila dentro de una transacción.
        const inscripcionEvento = await client.query(
            `SELECT
                ie.estado AS inscripcion_estado,
                e.estado AS evento_estado,
                (e.fecha + e.hora > LOCALTIMESTAMP)
                    AS evento_futuro
             FROM inscripciones_eventos AS ie
             JOIN eventos AS e
                ON e.id = ie.evento_id
             WHERE ie.usuario_id = $1
               AND ie.evento_id = $2
             FOR UPDATE OF ie
             FOR SHARE OF e`,
            [usuarioId, eventoId]
        );

        if (
            inscripcionEvento.rows.length === 0 ||
            inscripcionEvento.rows[0].inscripcion_estado !== "activa"
        ) {
            await client.query("ROLLBACK");
            return { tipo: "evento no inscrito" };
        }

        const evento = inscripcionEvento.rows[0];

        if (
            evento.evento_estado !== "publicado" ||
            !evento.evento_futuro
        ) {
            await client.query("ROLLBACK");
            return { tipo: "evento no disponible" };
        }

        // Bloqueamos la actividad para evitar que dos solicitudes ocupen el último cupo.
        const resultadoActividad = await client.query(
            `SELECT
                id,
                evento_id,
                estado,
                capacidad,
                (fecha + hora > LOCALTIMESTAMP)
                    AS fecha_futura
             FROM actividades
             WHERE id = $1
             FOR UPDATE`,
            [actividadId]
        );

        if (resultadoActividad.rows.length === 0) {
            await client.query("ROLLBACK");
            return { tipo: "actividad no existe" };
        }

        const actividad = resultadoActividad.rows[0];

        if (
            Number(actividad.evento_id) !== Number(eventoId) ||
            actividad.estado !== "publicado" ||
            !actividad.fecha_futura
        ) {
            await client.query("ROLLBACK");
            return { tipo: "actividad no disponible" };
        }

        const existente = await client.query(
            `SELECT estado
             FROM inscripciones_actividades
             WHERE usuario_id = $1
               AND actividad_id = $2`,
            [usuarioId, actividadId]
        );

        if (
            existente.rows.length > 0 &&
            existente.rows[0].estado === "activa"
        ) {
            await client.query("ROLLBACK");
            return { tipo: "ya inscrito" };
        }

        // Capacidad NULL significa cupos ilimitados.
        if (actividad.capacidad !== null) {
            const resultadoCupos = await client.query(
                `SELECT COUNT(*)::integer AS ocupados
                 FROM inscripciones_actividades
                 WHERE actividad_id = $1
                   AND estado = 'activa'`,
                [actividadId]
            );

            const ocupados = Number(
                resultadoCupos.rows[0].ocupados
            );

            if (ocupados >= Number(actividad.capacidad)) {
                await client.query("ROLLBACK");
                return { tipo: "sin cupo" };
            }
        }

        // Se crea la inscripción o se reactiva si anteriormente estaba cancelada.
        const resultado = await client.query(
            `INSERT INTO inscripciones_actividades (
                usuario_id,
                actividad_id,
                estado
             )
             VALUES ($1, $2, 'activa')

             ON CONFLICT (usuario_id, actividad_id)
             DO UPDATE SET
                estado = 'activa',
                fecha_inscripcion = CURRENT_TIMESTAMP,
                fecha_cancelacion = NULL
             WHERE inscripciones_actividades.estado = 'cancelada'

             RETURNING *`,
            [usuarioId, actividadId]
        );

        if (resultado.rows.length === 0) {
            await client.query("ROLLBACK");
            return { tipo: "ya inscrito" };
        }

        await client.query("COMMIT");

        return {
            tipo: "ok",
            inscripcion: mapInscripcion(resultado.rows[0])
        };

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;

    } finally {
        client.release();
    }
}


// Buscar inscripción de un usuario a una actividad.
export async function getInscripcionActividad(
    usuarioId: number,
    actividadId: number
): Promise<InscripcionActividad | undefined> {

    const resultado = await pool.query(
        `SELECT *
         FROM inscripciones_actividades
         WHERE usuario_id = $1
           AND actividad_id = $2`,
        [usuarioId, actividadId]
    );

    if (resultado.rows.length === 0) {
        return undefined;
    }

    return mapInscripcion(resultado.rows[0]);
}


// Cancelar únicamente una inscripción activa.
export async function cancelarInscripcionActividad(
    usuarioId: number,
    actividadId: number
): Promise<InscripcionActividad | undefined> {

    const resultado = await pool.query(
        `UPDATE inscripciones_actividades
         SET
            estado = 'cancelada',
            fecha_cancelacion = CURRENT_TIMESTAMP
         WHERE usuario_id = $1
           AND actividad_id = $2
           AND estado = 'activa'
         RETURNING *`,
        [usuarioId, actividadId]
    );

    if (resultado.rows.length === 0) {
        return undefined;
    }

    return mapInscripcion(resultado.rows[0]);
}


// Consultar mis inscripciones a actividades.
export async function getInscripcionesActividadByUsuario(
    usuarioId: number
): Promise<InscripcionActividad[]> {

    const resultado = await pool.query(
        `SELECT *
         FROM inscripciones_actividades
         WHERE usuario_id = $1
         ORDER BY fecha_inscripcion DESC`,
        [usuarioId]
    );

    return resultado.rows.map(mapInscripcion);
}
