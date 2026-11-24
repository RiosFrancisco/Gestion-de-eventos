import {
    getActividadesByEventoId,
    getActividadById,
    createActividad,
    updateActividad,
    cancelarActividad
} from "../repositories/actividad.repository";
import type {
    Actividad,
    CrearActividad,
    ActualizarActividad
} from "../models/actividad.model";
import {
    getEventoModificable,
    getEventoById
} from "../repositories/evento.repository";
import { ROLES } from "../utils/roles";
import { AppError } from "../errors/appError";


// Listar actividades de un evento
export async function listarActividadesPorEvento(
    eventoId: number
) {
    const evento = await getEventoById(eventoId);

    if (!evento) {
        throw new AppError(404, "Evento no encontrado");
    }

    return getActividadesByEventoId(eventoId);
}


// Obtener una actividad por ID
export async function obtenerActividadPorId(
    actividadId: number
) {
    const actividad = await getActividadById(actividadId);

    if (!actividad) {
        throw new AppError(404, "Actividad no encontrada");
    }

    return actividad;
}


// Comprobar permisos y estado del evento
async function validarEventoEditable(
    eventoId: number,
    usuarioId: number,
    rolId: number
) {
    const evento = await getEventoModificable(eventoId);

    if (!evento) {
        throw new AppError(404, "Evento no encontrado");
    }

    const esAdmin = rolId === ROLES.admin;
    const esPropietario = evento.creador_id === usuarioId;

    if (!esAdmin && !esPropietario) {
        throw new AppError(
            403,
            "No tiene permisos para modificar este evento"
        );
    }

    if (evento.estado !== "publicado") {
        throw new AppError(
            409,
            "No se pueden modificar actividades de un evento no publicado"
        );
    }

    return evento;
}


// Validar fecha y hora futuras
function validarFechaFutura(
    fecha: string,
    hora: string
): void {
    const fechaActividad = new Date(`${fecha}T${hora}`);

    if (
        !Number.isFinite(fechaActividad.getTime()) ||
        fechaActividad <= new Date()
    ) {
        throw new AppError(
            400,
            "La fecha y hora de la actividad deben ser futuras"
        );
    }
}


// Obtener una actividad que pueda modificarse
async function obtenerActividadEditable(
    actividadId: number,
    usuarioId: number,
    rolId: number
): Promise<Actividad> {
    const actividad = await getActividadById(actividadId);

    if (!actividad) {
        throw new AppError(404, "Actividad no encontrada");
    }

    await validarEventoEditable(
        actividad.evento_id,
        usuarioId,
        rolId
    );

    if (actividad.estado !== "publicado") {
        throw new AppError(
            409,
            "No se puede modificar una actividad cancelada o finalizada"
        );
    }

    return actividad;
}


// Crear actividad
export async function crearActividad(
    usuarioId: number,
    rolId: number,
    datos: CrearActividad
): Promise<Actividad> {
    await validarEventoEditable(
        datos.evento_id,
        usuarioId,
        rolId
    );

    validarFechaFutura(datos.fecha, datos.hora);

    return createActividad(datos);
}


// Actualizar actividad
export async function actualizarActividad(
    actividadId: number,
    usuarioId: number,
    rolId: number,
    datos: ActualizarActividad
): Promise<Actividad> {
    if (Object.keys(datos).length === 0) {
        throw new AppError(
            400,
            "No se proporcionaron campos para actualizar"
        );
    }

    const actividad = await obtenerActividadEditable(
        actividadId,
        usuarioId,
        rolId
    );

    if (
        datos.fecha !== undefined ||
        datos.hora !== undefined
    ) {
        const fecha = datos.fecha ?? actividad.fecha;
        const hora = datos.hora ?? actividad.hora;

        validarFechaFutura(fecha, hora);
    }

    const actividadActualizada = await updateActividad(
        actividadId,
        datos
    );

    if (!actividadActualizada) {
        throw new AppError(
            409,
            "No se pudo actualizar la actividad"
        );
    }

    return actividadActualizada;
}


// Cancelar actividad
export async function cancelacionActividad(
    actividadId: number,
    usuarioId: number,
    rolId: number
): Promise<Actividad> {
    await obtenerActividadEditable(
        actividadId,
        usuarioId,
        rolId
    );

    const actividadCancelada = await cancelarActividad(
        actividadId
    );

    if (!actividadCancelada) {
        throw new AppError(
            409,
            "No se pudo cancelar la actividad"
        );
    }

    return actividadCancelada;
}
