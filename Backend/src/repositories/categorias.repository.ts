import { pool } from "../config/database"

export async function getCategoriasById(id: number) {
    const resultado = await pool.query(
       `
        SELECT id, nombre
        FROM categorias_evento
        WHERE id = $1
        `,
        [id]
    );

    return resultado.rows[0];
}