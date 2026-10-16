import { pool } from '../config/database';
import { Actividad } from '../models/actividad.model';

// obtener actividades de un evento
export async function getActividadesByEventoId(eventoId: number): Promise<Actividad[]> {
    const query = 'SELECT * FROM actividades WHERE evento_id = $1 ORDER BY fecha ASC';
    const result = await pool.query(query, [eventoId]);
    return result.rows;
}

// obtener una actividad puntual
export async function getActividadById(id: number): Promise<Actividad | null> {
    const query = 'SELECT * FROM actividades WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
}