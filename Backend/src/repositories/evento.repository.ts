import { pool } from "../config/database"
import { CrearEvento, Evento } from "../models/evento.model"

export async function createEvento(creadorId: number, datos: CrearEvento): Promise<Evento> {
    const resultados = await pool.query(
        `INSERT into eventos (creador_id, categoria_id, nombre, descripcion, fecha, hora, ubicacion)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, creador_id, categoria_id, nombre, descripcion, fecha, hora, ubicacion, estado, created_at`,
        [
            creadorId, datos.categoria_id, datos.nombre, datos.descripcion, datos.fecha, datos.hora, datos.ubicacion
        ]
    );

    const evento = resultados.rows[0];

    return {
        ...evento, id: Number(evento.id), creador_id: Number(evento.creador_id), categoria_id: Number(evento.categoria_id)
    };
}