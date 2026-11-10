import { pool } from "../config/database";
import type {
    Actividad,
    CrearActividad,
    ActualizarActividad
} from "../models/actividad.model";
import { mapActividad } from "../utils/actividadMapper";



export async function getActividadesByEventoId(
    eventoId: number
): Promise<Actividad[]> {

    const resultado = await pool.query(
        `SELECT
            id,
            evento_id,
            nombre,
            descripcion,
            fecha::text AS fecha,
            hora::text AS hora,
            capacidad,
            estado,
            created_at
        FROM actividades
        WHERE evento_id = $1
        ORDER BY fecha ASC, hora ASC`,
        [eventoId]
    );


    return resultado.rows.map(mapActividad);
}

export async function getActividadById(
    actividadId: number
): Promise<Actividad | undefined> {

    const resultado = await pool.query(
        `SELECT
            id,
            evento_id,
            nombre,
            descripcion,
            fecha::text AS fecha,
            hora::text AS hora,
            capacidad,
            estado,
            created_at
        FROM actividades
        WHERE evento_id = $1
        ORDER BY fecha ASC, hora ASC`,
        [actividadId]
    );

    const actividad = resultado.rows[0];

    if (!actividad) {
        return undefined;
    }

    return mapActividad(actividad);
}

export async function createActividad(
    datos: CrearActividad
): Promise<Actividad> {

    const resultado = await pool.query(
        `INSERT INTO actividades (
            evento_id,
            nombre,
            descripcion,
            fecha,
            hora,
            capacidad
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
            id,
            evento_id,
            nombre,
            descripcion,
            fecha::text AS fecha,
            hora::text AS hora,
            capacidad,
            estado,
            created_at`,
        [
            datos.evento_id,
            datos.nombre,
            datos.descripcion,
            datos.fecha,
            datos.hora,
            datos.capacidad
        ]
    );

    return mapActividad(resultado.rows[0]);
}


export async function updateActividad(
    actividadId: number,
    datos: ActualizarActividad
): Promise<Actividad | undefined> {

    const camposPermitidos = [
        "nombre",
        "descripcion",
        "fecha",
        "hora",
        "capacidad"
    ] as const;

    const campos: string[] = [];
    const valores: unknown[] = [];

    for (const campo of camposPermitidos) {
        const valor = datos[campo];

        if (valor !== undefined) {
            valores.push(valor);
            campos.push(`${campo} = $${valores.length}`);
        }
    }

    if (campos.length === 0) {
        throw new Error("No se proporcionaron campos para actualizar");
    }

    valores.push(actividadId);

    const resultado = await pool.query(
        `UPDATE actividades
         SET ${campos.join(", ")}
         WHERE id = $${valores.length}
         RETURNING
            id,
            evento_id,
            nombre,
            descripcion,
            fecha::text AS fecha,
            hora::text AS hora,
            capacidad,
            estado,
            created_at`,
        valores
    );

    const actividad = resultado.rows[0];

    return actividad ? mapActividad(actividad) : undefined;
}

export async function cancelarActividad(
    actividadId: number
): Promise<Actividad | undefined> {

    const resultado = await pool.query(
        `UPDATE actividades
         SET estado = 'cancelado'
         WHERE id = $1
           AND estado = 'publicado'
         RETURNING
            id,
            evento_id,
            nombre,
            descripcion,
            fecha::text AS fecha,
            hora::text AS hora,
            capacidad,
            estado,
            created_at`,
        [actividadId]
    );

    const actividad = resultado.rows[0];

    return actividad ? mapActividad(actividad) : undefined;
}
