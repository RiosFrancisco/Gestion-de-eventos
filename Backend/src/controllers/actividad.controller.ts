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
import { AppError } from "../errors/appError";


// Validar identificadores recibidos por URL
function obtenerId(
    valor: unknown,
    tipo: "evento" | "actividad"
): number {
    if (
        typeof valor !== "string" ||
        !/^[1-9]\d*$/.test(valor)
    ) {
        throw new AppError(
            400,
            `ID de ${tipo} inválido`
        );
    }

    const id = Number(valor);

    if (!Number.isSafeInteger(id)) {
        throw new AppError(
            400,
            `ID de ${tipo} inválido`
        );
    }

    return id;
}


// Obtener usuario autenticado
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


// Listar actividades de un evento
export async function listarActividadesController(
    req: Request,
    res: Response
) {
    const eventoId = obtenerId(
        req.params.eventoId,
        "evento"
    );

    const actividades = await listarActividadesPorEvento(
        eventoId
    );

    return res.status(200).json({
        actividades
    });
}


// Obtener actividad por ID
export async function obtenerActividadController(
    req: Request,
    res: Response
) {
    const actividadId = obtenerId(
        req.params.id,
        "actividad"
    );

    const actividad = await obtenerActividadPorId(
        actividadId
    );

    return res.status(200).json({
        actividad
    });
}


// Crear actividad
export async function crearActividadController(
    req: AuthRequest,
    res: Response
) {
    const usuario = obtenerUsuario(req);

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
}


// Actualizar actividad
export async function actualizarActividadController(
    req: AuthRequest,
    res: Response
) {
    const actividadId = obtenerId(
        req.params.id,
        "actividad"
    );

    const usuario = obtenerUsuario(req);

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
}


// Cancelar actividad
export async function cancelarActividadController(
    req: AuthRequest,
    res: Response
) {
    const actividadId = obtenerId(
        req.params.id,
        "actividad"
    );

    const usuario = obtenerUsuario(req);

    const actividad = await cancelacionActividad(
        actividadId,
        usuario.id,
        usuario.rol_id
    );

    return res.status(200).json({
        message: "Actividad cancelada correctamente",
        actividad
    });
}
