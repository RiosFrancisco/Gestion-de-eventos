import {
    createEvento,
    getAllEventos,
    getEventoById,
    getEventoModificable,
    updateEvento,
    cancelarEvento,
    activarEvento
} from "../repositories/evento.repository";
import {
    CrearEvento,
    Evento,
    ActualizarEvento
} from "../models/evento.model";
import { getCategoriasById, } from "../repositories/categorias.repository";
import { ROLES } from "../utils/roles"

export async function crearEvento(creadorId: number, datos: CrearEvento): Promise<Evento> {
    const fechaEvento = new Date(`${datos.fecha}T${datos.hora}:00`);

    const ahora = new Date();

    if (fechaEvento <= ahora) {
        throw new Error("La fecha no puede ser pasada"
        );
    }

    const categoria = await getCategoriasById(datos.categoria_id);

    if (!categoria) {
        throw new Error("La categoria seleccionada no existe");
    }

    return await createEvento(
        creadorId,
        datos
    );
}

export async function listarEventos() {
    return await getAllEventos();
}

export async function obtenerEventoPorId(id: number) {
    const evento = await getEventoById(id);

    if (!evento) {
        throw new Error("Evento no encontrado");
    }

    return evento;
}

export async function updatearEvento(eventoId: number, usuarioId: number, rolId: number, datos: ActualizarEvento) {
    const evento = await getEventoModificable(eventoId);

    if (!evento) {
        throw new Error("Evento no encontrado");
    }

    const esAdmin = rolId === ROLES.admin;
    const esCreador = evento.creador_id === usuarioId;

    if (!esAdmin && !esCreador) {
        throw new Error("No tiene permisos para realizar esta accion.");
    }

    if (datos.fecha || datos.hora) {
        const fecha = datos.fecha ?? evento.fecha;
        const hora = datos.hora ?? evento.hora;

        const fechaEvento = new Date(`${fecha}T${hora}`);

        if (fechaEvento <= new Date()) {
            throw new Error("La fecha y hora no pueden ser pasadas.")
        }
    }

    return await updateEvento(eventoId, datos);
}

export async function cancelacionEvento(eventoId: number, usuarioId: number, rolId: number) {
    const evento = await getEventoModificable(eventoId);

    if (!evento) {
        throw new Error("Evento no encontrado");
    }

    const esAdmin = rolId === ROLES.admin;
    const esCreador = evento.creador_id === usuarioId;

    if (!esAdmin && !esCreador) {
        throw new Error("No tiene permisos para realizar esta accion.");
    }

    if (evento.estado === "finalizado" || evento.estado === "cancelado") {
        throw new Error("No se puede cancelar un evento ya cancelado o finalizado.");
    }

    return await cancelarEvento(eventoId);
}

export async function activacionEvento(eventoId: number, usuarioId: number, rolId: number) {
    const evento = await getEventoModificable(eventoId);

    if (!evento) {
        throw new Error("Evento no encontrado");
    }

    const esAdmin = rolId === ROLES.admin;
    const esCreador = evento.creador_id === usuarioId;

    if (!esAdmin && !esCreador) {
        throw new Error("No tiene permisos para realizar esta accion.");
    }

    if (evento.estado === "finalizado" || evento.estado === "publicado") {
        throw new Error("El evento ya esta en estado activado o ha finalizado.");
    }

    return await activarEvento(eventoId);
}