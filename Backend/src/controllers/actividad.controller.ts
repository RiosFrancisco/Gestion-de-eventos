
import type { Request, Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware";

import {
    crearActividadSchema,
    actualizarActividadSchema
} from "../schemas/actividad.schema";

import {
    listarActividadesPorEvento,
    obtenerActividadPorId,
    crearActividad,
    actualizarActividad,
    cancelacionActividad
} from "../services/actividad.service";


function obtenerId(valor: unknown): number | undefined {
    if (typeof valor !== "string" || !/^[1-9]\d*$/.test(valor)) {
        return undefined;
    }

    const id = Number(valor);

    return Number.isSafeInteger(id) ? id : undefined;
}


export async function listarActividadesController(
    req: Request,
    res: Response
) {
    const eventoId = obtenerId(req.params.eventoId);

    if (eventoId === undefined) {
        return res.status(400).json({
            message: "ID de evento inválido"
        });
    }

    try {
        const actividades = await listarActividadesPorEvento(eventoId);

        return res.status(200).json({
            actividades
        });

    } catch (error) {
        if (error instanceof Error) {
            return res.status(400).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}


export async function obtenerActividadController(
    req: Request,
    res: Response
) {
    const actividadId = obtenerId(req.params.id);

    if (actividadId === undefined) {
        return res.status(400).json({
            message: "ID de actividad inválido"
        });
    }

    try {
        const actividad = await obtenerActividadPorId(actividadId);

        return res.status(200).json({
            actividad
        });

    } catch (error) {
        if (error instanceof Error) {
            return res.status(400).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}


export async function crearActividadController(
    req: AuthRequest,
    res: Response
) {
    const usuario = req.usuario;

    if (!usuario) {
        return res.status(401).json({
            message: "Debe iniciar sesión"
        });
    }

    try {
        const datos = crearActividadSchema.parse(req.body);

        const actividad = await crearActividad(
            usuario.id,
            usuario.rol_id,
            datos
        );

        return res.status(201).json({
            message: "Actividad creada correctamente",
            actividad
        });

    } catch (error) {
        if (error instanceof Error) {
            return res.status(400).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}


export async function actualizarActividadController(
    req: AuthRequest,
    res: Response
) {
    const actividadId = obtenerId(req.params.id);

    if (actividadId === undefined) {
        return res.status(400).json({
            message: "ID de actividad inválido"
        });
    }

    const usuario = req.usuario;

    if (!usuario) {
        return res.status(401).json({
            message: "Debe iniciar sesión"
        });
    }

    try {
        const datos = actualizarActividadSchema.parse(req.body);

        const actividad = await actualizarActividad(
            actividadId,
            usuario.id,
            usuario.rol_id,
            datos
        );

        return res.status(200).json({
            message: "Actividad actualizada correctamente",
            actividad
        });

    } catch (error) {
        if (error instanceof Error) {
            return res.status(400).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}


export async function cancelarActividadController(
    req: AuthRequest,
    res: Response
) {
    const actividadId = obtenerId(req.params.id);

    if (actividadId === undefined) {
        return res.status(400).json({
            message: "ID de actividad inválido"
        });
    }

    const usuario = req.usuario;

    if (!usuario) {
        return res.status(401).json({
            message: "Debe iniciar sesión"
        });
    }

    try {
        const actividad = await cancelacionActividad(
            actividadId,
            usuario.id,
            usuario.rol_id
        );

        return res.status(200).json({
            message: "Actividad cancelada correctamente",
            actividad
        });

    } catch (error) {
        if (error instanceof Error) {
            return res.status(400).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}
