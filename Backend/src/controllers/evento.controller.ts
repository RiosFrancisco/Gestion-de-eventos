import type { Request, Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware";

import {
    crearEventoSchema,
    actualizarEventoSchema
} from "../schemas/evento.schema";

import {
    activacionEvento,
    crearEvento,
    listarEventos,
    listarEventosDelCreador,
    obtenerEventoPorId,
    updatearEvento,
    cancelacionEvento
} from "../services/evento.service";

import { AppError } from "../errors/appError";


// Obtiene y valida un ID enviado por parámetro.
function obtenerId(valor: unknown): number {
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


// Obtiene el usuario autenticado.
function obtenerUsuario(req: AuthRequest) {
    const usuario = req.usuario;

    if (!usuario) {
        throw new AppError(
            401,
            "Debe iniciar sesión"
        );
    }

    return usuario;
}


// Crear evento
export async function createEventoController(
    req: AuthRequest,
    res: Response
) {
    const usuario = obtenerUsuario(req);

    const datos = crearEventoSchema.parse(req.body);

    const evento = await crearEvento(
        usuario.id,
        datos
    );

    return res.status(201).json({
        message: "Evento creado con exito.",
        evento
    });
}


// Listar eventos
export async function listarEventosController(
    req: Request,
    res: Response
) {
    const eventos = await listarEventos();

    return res.status(200).json({
        eventos
    });
}


// Obtener evento por ID
export async function getEventoByIdController(
    req: Request,
    res: Response
) {
    const eventoId = obtenerId(req.params.id);

    const evento = await obtenerEventoPorId(eventoId);

    return res.status(200).json({
        evento
    });
}


// Actualizar evento
export async function updateEventoController(
    req: AuthRequest,
    res: Response
) {
    const usuario = obtenerUsuario(req);
    const eventoId = obtenerId(req.params.id);

    const datos = actualizarEventoSchema.parse(req.body);

    const evento = await updatearEvento(
        eventoId,
        usuario.id,
        usuario.rol_id,
        datos
    );

    return res.status(200).json({
        message: "Evento actualizado correctamente",
        evento
    });
}


// Cancelar evento
export async function cancelarEventoController(
    req: AuthRequest,
    res: Response
) {
    const usuario = obtenerUsuario(req);
    const eventoId = obtenerId(req.params.id);

    const evento = await cancelacionEvento(
        eventoId,
        usuario.id,
        usuario.rol_id
    );

    return res.status(200).json({
        message: "Evento cancelado correctamente.",
        evento
    });
}


// Reactivar evento
export async function activarEventoController(
    req: AuthRequest,
    res: Response
) {
    const usuario = obtenerUsuario(req);
    const eventoId = obtenerId(req.params.id);

    const evento = await activacionEvento(
        eventoId,
        usuario.id,
        usuario.rol_id,
        req.body ?? {}
    );

    return res.status(200).json({
        message: "Evento ha cambiado a estado publicado correctamente.",
        evento
    });
}


// Listado de eventos propios. Nunca se recibe creadorId desde el cliente.
export async function listarMisEventosCreadosController(req: AuthRequest, res: Response) {
    const usuario = obtenerUsuario(req);
    const eventos = await listarEventosDelCreador(usuario.id);
    return res.status(200).json({ eventos });
}
