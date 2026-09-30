import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { crearEventoSchema, actualizarEventoSchema } from "../schemas/evento.schema";
import { crearEvento, updatearEvento } from "../services/evento.service";
import { listarEventos, obtenerEventoPorId } from "../services/evento.service";

export async function createEventoController(req: AuthRequest, res: Response) {
    try {
        const usuario = req.usuario;
        if (!usuario) {
            res.status(400).json({
                message: "Debe loguearse para realizar esta accion"
            });
        }


        const datos = crearEventoSchema.parse(req.body);

        const evento = await crearEvento(
            usuario!.id,
            datos
        );

        return res.status(201).json({
            message: "Evento creado con exito.",
            evento
        })
    }
    catch (error) {
        return res.status(400).json({
            message: error instanceof Error
                ? error.message
                : "Error al crear el evento"
        });
    }
}

export async function listarEventosController(req: Request, res: Response) {
    try {
        const eventos = await listarEventos();

        return res.status(200).json({
            eventos
        });
    }
    catch (error) {
        console.error("ERROR AL REALIZAR LA ACCION", error)
        res.status(500).json({
            message: "Error al obtener los eventos"
        });
    }
}

export async function getEventoByIdController(
    req: Request,
    res: Response
) {
    try {
        const id = Number(req.params.id);

        if (isNaN(id) || id <= 0) {
            return res.status(400).json({
                message: "ID de evento inválido"
            });
        }

        const evento = await obtenerEventoPorId(id);

        return res.status(200).json({
            evento
        });

    } catch (error) {
        return res.status(404).json({
            message: error instanceof Error
                ? error.message
                : "Evento no encontrado"
        });
    }
}

export async function updateEventoController(req: AuthRequest, res: Response) {
    try {
        const eventoId = Number(req.params.id);

        if (isNaN(eventoId) || eventoId <= 0) {
            return res.status(400).json({
                message: "ID de evento invalido"
            });
        }

        const datos = actualizarEventoSchema.parse(req.body);

        const evento = await updatearEvento(eventoId, req.usuario!.id, req.usuario!.rol_id, datos);

        return res.status(200).json({
            message: "Evento actualizado correctamente",
            evento
        });
    }
    catch (error) {
        console.error("ERROR AL ACTUALIZAR EVENTO:", error);

        return res.status(400).json({
            message: error instanceof Error
                ? error.message
                : "Error al actualizar el evento"
        });
    }
}