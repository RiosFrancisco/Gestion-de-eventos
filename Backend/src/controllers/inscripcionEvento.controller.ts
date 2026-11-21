
import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware";

import {
    inscribirseEvento,
    cancelarInscripcion,
    listarMisInscripciones
} from "../services/inscripcionEvento.service";

import { AppError } from "../errors/appError";


// Validar el ID del evento recibido por URL
function obtenerEventoId(valor: unknown): number {
    if (
        typeof valor !== "string" ||
        !/^[1-9]\d*$/.test(valor)
    ) {
        throw new AppError(400, "ID de evento inválido");
    }

    const id = Number(valor);

    if (!Number.isSafeInteger(id)) {
        throw new AppError(400, "ID de evento inválido");
    }

    return id;
}


// Obtener el usuario autenticado
function obtenerUsuario(req: AuthRequest) {
    const usuario = req.usuario;

    if (!usuario) {
        throw new AppError(401, "Debe iniciar sesión");
    }

    return usuario;
}


// Inscribirse o reinscribirse a un evento
export async function inscribirseEventoController(
    req: AuthRequest,
    res: Response
) {
    const usuario = obtenerUsuario(req);
    const eventoId = obtenerEventoId(req.params.eventoId);

    const inscripcion = await inscribirseEvento(
        usuario.id,
        eventoId
    );

    return res.status(201).json({
        message: "Inscripción realizada correctamente",
        inscripcion
    });
}


// Cancelar la inscripción a un evento
export async function cancelarInscripcionEventoController(
    req: AuthRequest,
    res: Response
) {
    const usuario = obtenerUsuario(req);
    const eventoId = obtenerEventoId(req.params.eventoId);

    const inscripcion = await cancelarInscripcion(
        usuario.id,
        eventoId
    );

    return res.status(200).json({
        message: "Inscripción cancelada correctamente",
        inscripcion
    });
}


// Consultar mis inscripciones
export async function listarMisInscripcionesController(
    req: AuthRequest,
    res: Response
) {
    const usuario = obtenerUsuario(req);

    const inscripciones = await listarMisInscripciones(
        usuario.id
    );

    return res.status(200).json({
        inscripciones
    });
}
