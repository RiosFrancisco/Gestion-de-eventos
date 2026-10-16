import { getActividadesByEventoId, getActividadById } from '../repositories/actividad.repository';

export async function listarActividadesPorEvento(eventoId: number) {
    if (!eventoId || isNaN(eventoId)) {
        throw new Error('El ID del evento proporcionado es inválido.');
    }
    return await getActividadesByEventoId(eventoId);
}

export async function obtenerActividadPorId(id: number) {
    const actividad = await getActividadById(id);
    if (!actividad) {
        throw new Error('La actividad no existe.');
    }
    return actividad;
}