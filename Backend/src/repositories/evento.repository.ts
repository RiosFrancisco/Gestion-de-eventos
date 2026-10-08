import { pool } from "../config/database"
import { CrearEvento, Evento, EventoListado, ActualizarEvento } from "../models/evento.model"
import { mapEvento } from "../utils/eventoMapper";

//Creamos un evento nuevo
export async function createEvento(creadorId: number, datos: CrearEvento): Promise<Evento> {
    const resultados = await pool.query(
        `INSERT into eventos (creador_id, categoria_id, nombre, descripcion, fecha, hora, ubicacion)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING 
                id, 
                creador_id, 
                categoria_id, 
                nombre, 
                descripcion, 
                fecha::text AS fecha, 
                hora::text AS hora, 
                ubicacion, 
                estado, 
                created_at`,
        [
            creadorId,
            datos.categoria_id,
            datos.nombre,
            datos.descripcion,
            datos.fecha,
            datos.hora,
            datos.ubicacion
        ]
    );

    const evento = resultados.rows[0];

    return mapEvento(evento);
}

//Obtenemos todos los eventos
export async function getAllEventos(): Promise<EventoListado[]> {
    const resultados = await pool.query(
        `SELECT
            e.id,
            e.nombre,
            e.descripcion,
            e.fecha::text AS fecha,
            e.hora::text AS hora,
            e.ubicacion,
            e.estado,
            c.nombre AS categoria,
            d.nombre AS creador
            FROM eventos e
            JOIN categorias_evento c
            ON c.id = e.categoria_id
            JOIN usuarios d
            ON d.id = e.creador_id
            ORDER BY e.fecha ASC, e.hora ASC`);

    return resultados.rows.map(evento => ({
        ...evento,
        id: Number(evento.id)
    }));
}

//Obtenemos eventos por id
export async function getEventoById(eventoId: number) {
    const resultado = await pool.query(
        `SELECT 
            e.id, 
            e.nombre,
            e.descripcion,
            e.fecha::text AS fecha,
            e.hora::text AS hora,
            e.ubicacion,
            e.estado,
            c.nombre AS categoria,
            d.nombre AS creador
            FROM eventos e
            JOIN categorias_evento c
            ON c.id = e.categoria_id
            JOIN usuarios d
            ON d.id = e.creador_id
            WHERE e.id = $1`,
        [eventoId]);

    const evento = resultado.rows[0];

    if (!evento) {
        return undefined;
    }

    return {
        ...evento,
        id: Number(eventoId)
    };
}

//obtengo evento por id para modificacion sin traer categoria y creador
export async function getEventoModificable(id: number) {
    const resultado = await pool.query(
        `SELECT 
            id,
            creador_id,
            categoria_id,
            nombre,
            descripcion,
            fecha::text AS fecha,
            hora::text AS hora,
            ubicacion,
            estado
         FROM eventos
         WHERE id = $1`,
        [id]
    );

    const evento = resultado.rows[0];
    if (!evento) {
        return undefined;
    }

    return mapEvento(evento);
}


//Modificamos un evento
export async function updateEvento(eventoID: number, datos: ActualizarEvento) {
    const campos: string[] = [];
    const valores: any[] = [];

    let posicion = 1;

    for (const [clave, valor] of Object.entries(datos)) {
        campos.push(`${clave} = $${posicion}`);
        valores.push(valor);
        posicion++;
    }
    valores.push(eventoID);

    const query =
        `UPDATE eventos
                 SET ${campos.join(", ")}
                 WHERE id = $${posicion}
                 RETURNING 
                        id, 
                        creador_id, 
                        categoria_id, 
                        nombre, 
                        descripcion, 
                        fecha::text AS fecha, 
                        hora::text AS hora, 
                        ubicacion, 
                        estado, 
                        created_at`;

    const resultado = await pool.query(query, valores);

    const evento = resultado.rows[0];

    if (!evento) {
        return undefined;
    }

    return mapEvento(evento);
}

export async function cancelarEvento(eventoId: number) {
    const resultado = await pool.query(
        `UPDATE eventos
         SET estado = 'cancelado'
         WHERE id = $1
         RETURNING 
                    id, 
                    creador_id, 
                    categoria_id, 
                    nombre, 
                    descripcion, 
                    fecha::text AS fecha, 
                    hora::text AS hora, 
                    ubicacion, 
                    estado, 
                    created_at`,
        [eventoId]
    );
    const evento = resultado.rows[0];

    if (!evento) {
        return undefined;
    }

    return mapEvento(evento);
}

export async function activarEvento(eventoId: number) {
    const resultado = await pool.query(
        `UPDATE eventos
         SET estado = 'publicado'
         WHERE id = $1
         RETURNING 
                    id, 
                    creador_id, 
                    categoria_id, 
                    nombre, 
                    descripcion, 
                    fecha::text AS fecha, 
                    hora::text AS hora, 
                    ubicacion, 
                    estado, 
                    created_at`,
        [eventoId]
    );
    const evento = resultado.rows[0];

    if (!evento) {
        return undefined;
    }

    return mapEvento(evento);
}