import {
    createEvento,
    getAllEventos,
    getEventoById,
    getEventoModificable,
    updateEvento,
    cancelarEvento,
    activarEvento
} from "../repositories/evento.repository";

import type {
    CrearEvento,
    Evento,
    ActualizarEvento
} from "../models/evento.model";

import { getCategoriasById } from "../repositories/categorias.repository";
import { ROLES } from "../utils/roles";
import { AppError } from "../errors/appError";


// Comprueba que el usuario tenga permisos sobre el evento.
function validarPropietario(
    creadorId: number,
    usuarioId: number,
    rolId: number
): void {
    const esAdmin = rolId === ROLES.admin;
    const esCreador = creadorId === usuarioId;

    if (!esAdmin && !esCreador) {
        throw new AppError(
            403,
            "No tiene permisos para realizar esta accion."
        );
    }
}


// Verifica la fecha y hora antes de crear o modificar eventos.
function validarFechaFutura(
    fecha: string,
    hora: string
): void {
    const fechaEvento = new Date(`${fecha}T${hora}`);

    if (
        Number.isNaN(fechaEvento.getTime()) ||
        fechaEvento <= new Date()
    ) {
        throw new AppError(
            400,
            "La fecha y hora no pueden ser pasadas."
        );
    }
}


export async function crearEvento(
    creadorId: number,
    datos: CrearEvento
): Promise<Evento> {

    validarFechaFutura(datos.fecha, datos.hora);

    const categoria = await getCategoriasById(datos.categoria_id);

    if (!categoria) {
        throw new AppError(
            400,
            "La categoria seleccionada no existe"
        );
    }

    return createEvento(creadorId, datos);
}


export async function listarEventos() {
    return getAllEventos();
}


export async function obtenerEventoPorId(id: number) {
    const evento = await getEventoById(id);

    if (!evento) {
        throw new AppError(
            404,
            "Evento no encontrado"
        );
    }

    return evento;
}


export async function updatearEvento(
    eventoId: number,
    usuarioId: number,
    rolId: number,
    datos: ActualizarEvento
) {
    const evento = await getEventoModificable(eventoId);

    if (!evento) {
        throw new AppError(
            404,
            "Evento no encontrado"
        );
    }

    validarPropietario(
        evento.creador_id,
        usuarioId,
        rolId
    );

    if (datos.fecha || datos.hora) {
        const fecha = datos.fecha ?? evento.fecha;
        const hora = datos.hora ?? evento.hora;

        validarFechaFutura(
            String(fecha),
            String(hora)
        );
    }

    return updateEvento(eventoId, datos);
}


export async function cancelacionEvento(
    eventoId: number,
    usuarioId: number,
    rolId: number
) {
    const evento = await getEventoModificable(eventoId);

    if (!evento) {
        throw new AppError(
            404,
            "Evento no encontrado"
        );
    }

    validarPropietario(
        evento.creador_id,
        usuarioId,
        rolId
    );

    if (
        evento.estado === "finalizado" ||
        evento.estado === "cancelado"
    ) {
        throw new AppError(
            409,
            "No se puede cancelar un evento ya cancelado o finalizado."
        );
    }

    return cancelarEvento(eventoId);
}


export async function activacionEvento(
    eventoId: number,
    usuarioId: number,
    rolId: number,
    datos: ActualizarEvento
) {
    const evento = await getEventoModificable(eventoId);

    if (!evento) {
        throw new AppError(
            404,
            "Evento no encontrado"
        );
    }

    validarPropietario(
        evento.creador_id,
        usuarioId,
        rolId
    );

    if (
        evento.estado === "finalizado" ||
        evento.estado === "publicado"
    ) {
        throw new AppError(
            409,
            "El evento ya esta en estado activado o ha finalizado."
        );
    }

    const fecha = datos.fecha ?? evento.fecha;
    const hora = datos.hora ?? evento.hora;

    validarFechaFutura(
        String(fecha),
        String(hora)
    );

    return activarEvento(eventoId);
}
