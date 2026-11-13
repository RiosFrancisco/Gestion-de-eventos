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
import { getEventoModificable } from "../repositories/evento.repository";
import { getEventoById } from "../repositories/evento.repository";
import { ROLES } from "../utils/roles"


// listamos las actividades de un evento
export async function listarActividadesPorEvento(eventoId: number) {
    const evento = await getEventoById(eventoId);

    if (!evento) {
        throw new Error("Evento no encontrado");
    }

    return getActividadesByEventoId(eventoId);
}

// buscamos una actividad en particular
export async function obtenerActividadPorId(actividadId: number) {
    const actividad = await getActividadById(actividadId);

    if (!actividad) {
        throw new Error("Actividad no encontrada");
    }

    return actividad;
}


//funcion de validacion de permisos y estado de un evento para evitar repetirlo en todas las reglas de negocio
async function validarEventoEditable(
    eventoId: number,
    usuarioId: number,
    rolId: number
) {
    const evento = await getEventoModificable(eventoId);

    if (!evento) {
        throw new Error("Evento no encontrado");
    }

    const esAdmin = rolId === ROLES.admin;
    const esPropietario = evento.creador_id === usuarioId;

    if (!esAdmin && !esPropietario) {
        throw new Error(
            "No tiene permisos para modificar este evento"
        );
    }

    if (evento.estado !== "publicado") {
        throw new Error(
            "No se pueden modificar actividades de un evento no publicado"
        );
    }

    return evento;
}

// funcion de validacion de fecha
function validarFechaFutura(
    fecha: string,
    hora: string
): void {

    const fechaActividad = new Date(`${fecha}T${hora}`);

    if (
        !Number.isFinite(fechaActividad.getTime()) ||
        fechaActividad <= new Date()
    ) {
        throw new Error(
            "La fecha y hora de la actividad deben ser futuras"
        );
    }
}

// funcion para validaciones de actualizacion o cancelacion de actividades
async function obtenerActividadEditable(
    actividadId: number,
    usuarioId: number,
    rolId: number
): Promise<Actividad> {

    const actividad = await getActividadById(actividadId);

    if (!actividad) {
        throw new Error("Actividad no encontrada");
    }

    await validarEventoEditable(
        actividad.evento_id,
        usuarioId,
        rolId
    );

    if (actividad.estado !== "publicado") {
        throw new Error(
            "No se puede modificar una actividad cancelada o finalizada"
        );
    }

    return actividad;
}

// creamos una actividad verificando que el creador de la actividad sea dueño del evento y que la fecha sea valida
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

// actualizacion de actividad

export async function actualizarActividad(
    actividadId: number,
    usuarioId: number,
    rolId: number,
    datos: ActualizarActividad
): Promise<Actividad> {

    if (Object.keys(datos).length === 0) {
        throw new Error("No se proporcionaron campos para actualizar");
    }

    const actividad = await obtenerActividadEditable(
        actividadId,
        usuarioId,
        rolId
    );

    // Validar fecha solamente cuando se modifica
    if (datos.fecha !== undefined || datos.hora !== undefined) {

        const fecha = datos.fecha ?? actividad.fecha;
        const hora = datos.hora ?? actividad.hora;

        validarFechaFutura(fecha, hora);
    }

    const actividadActualizada = await updateActividad(
        actividadId,
        datos
    );

    if (!actividadActualizada) {
        throw new Error("No se pudo actualizar la actividad");
    }

    return actividadActualizada;
}

// cancelacion de actividad

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
        throw new Error(
            "No se pudo cancelar la actividad"
        );
    }

    return actividadCancelada;
}

