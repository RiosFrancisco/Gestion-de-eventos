import { pool } from "../config/database"
import { CrearEvento, Evento, EventoListado } from "../models/evento.model"

export async function createEvento(creadorId: number, datos: CrearEvento): Promise<Evento> {
    const resultados = await pool.query(
        `INSERT into eventos (creador_id, categoria_id, nombre, descripcion, fecha, hora, ubicacion)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, creador_id, categoria_id, nombre, descripcion, fecha::text AS fecha, hora::text AS hora, ubicacion, estado, created_at`,
        [
            creadorId, datos.categoria_id, datos.nombre, datos.descripcion, datos.fecha, datos.hora, datos.ubicacion
        ]
    );

    const evento = resultados.rows[0];

    return {
        ...evento, id: Number(evento.id), creador_id: Number(evento.creador_id), categoria_id: Number(evento.categoria_id)
    };
}

export async function getAllEventos(): Promise<EventoListado[]> {
    const resultados = await pool.query(
        `SELECT
        e.id
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
        ORDER BY e.fecha ASC, e.hora ASC
        `);


    return resultados.rows.map(evento => ({
        ...evento,
        id: Number(evento.id)
    }));
}

export async function getEventoById(eventoId: Number) {
    const resultado = await pool.query(
        `SELECT 
        e.id, 
        e.nombre,
        e.descripcion,
        e.fecha::text AS fecha,
        e.hora::text AS hora,
        e.ubicacion,
        c.nombre AS categoria,
        d.nombre AS creador
        FROM eventos e
        JOIN categorias_evento c
        ON c.id = e.categoria_id
        JOIN usuarios d
        ON d.id = e.creador_id
        WHERE e.id = $1`,
        [eventoId]
    );
    const evento = resultado.rows[0];

    if (!evento) {
        return undefined;
    }

    return {
        ...evento,
        id:Number(eventoId)
    };
}