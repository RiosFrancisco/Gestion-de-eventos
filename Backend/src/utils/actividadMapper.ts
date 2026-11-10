import type { Actividad } from "../models/actividad.model";

export function mapActividad(actividad: Actividad): Actividad {
    return {
        ...actividad,
        id: Number(actividad.id),
        evento_id: Number(actividad.evento_id)
    };
}