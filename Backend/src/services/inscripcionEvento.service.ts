import {
    getInscripcionEvento,
    crearInscripcionEvento,
    cancelarInscripcionEvento,
    getInscripcionesByUsuario
} from "../repositories/inscripcionEvento.repository";
import { getEventoById } from "../repositories/evento.repository";
import { AppError } from "../errors/appError";

// Verifica que el evento permita inscripciones.
async function validarEventoDisponible(eventoId: number) {
    const evento = await getEventoById(eventoId);

    if (!evento) {
        throw new AppError(
            404,
            "Evento no encontrado"
        );
    }

    if (evento.estado !== "publicado") {
        throw new AppError(
            409,
            "El evento no admite inscripciones"
        );
    }

    // PostgreSQL puede devolver la fecha como Date o string.
    const fecha = evento.fecha instanceof Date
        ? [
            evento.fecha.getFullYear(),
            String(evento.fecha.getMonth() + 1).padStart(2, "0"),
            String(evento.fecha.getDate()).padStart(2, "0")
        ].join("-")
        : String(evento.fecha).slice(0, 10);

    const hora = String(evento.hora).slice(0, 8);

    const fechaEvento = new Date(`${fecha}T${hora}`);

    if (
        Number.isNaN(fechaEvento.getTime()) ||
        fechaEvento <= new Date()
    ) {
        throw new AppError(
            409,
            "El evento ya comenzo o finalizo"
        );
    }

    return evento;
}

// Inscribirse o reinscribirse a un evento.
export async function inscribirseEvento(
    usuarioId: number,
    eventoId: number
) {
    await validarEventoDisponible(eventoId);

    const inscripcion = await crearInscripcionEvento(
        usuarioId,
        eventoId
    );

    if (!inscripcion) {
        throw new AppError(
            409,
            "Ya estas inscrito en este evento"
        );
    }

    return inscripcion;
}

// Cancelar la inscripción propia a un evento.
export async function cancelarInscripcion(
    usuarioId: number,
    eventoId: number
) {
    const inscripcionActual = await getInscripcionEvento(
        usuarioId,
        eventoId
    );

    if (!inscripcionActual) {
        throw new AppError(
            404,
            "Inscripcion no encontrada"
        );
    }

    if (inscripcionActual.estado === "cancelada") {
        throw new AppError(
            409,
            "La inscripcion ya esta cancelada"
        );
    }

    const inscripcionCancelada =
        await cancelarInscripcionEvento(usuarioId, eventoId);

    if (!inscripcionCancelada) {
        throw new AppError(
            409,
            "No se pudo cancelar la inscripcion"
        );
    }

    return inscripcionCancelada;
}

// Listar las inscripciones del usuario autenticado.
export async function listarMisInscripciones(
    usuarioId: number
) {
    return getInscripcionesByUsuario(usuarioId);
}
