import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware";
import {
    inscribirseActividad,
    cancelarInscripcionActividadService,
    listarMisInscripcionesActividad
} from "../services/inscripcionActividad.service";
import { AppError } from "../errors/appError";


// Validar ID de actividad.
function obtenerActividadId(valor: unknown): number {
    if (
        typeof valor !== "string" ||
        !/^[1-9]\d*$/.test(valor)
    ) {
        throw new AppError(
            400,
            "ID de actividad inválido"
        );
    }

    const id = Number(valor);

    if (!Number.isSafeInteger(id)) {
        throw new AppError(
            400,
            "ID de actividad inválido"
        );
    }

    return id;
}


// Obtener usuario autenticado.
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


// Inscribirse o reinscribirse.
export async function inscribirseActividadController(
    req: AuthRequest,
    res: Response
) {
    const usuario = obtenerUsuario(req);
    const actividadId = obtenerActividadId(
        req.params.actividadId
    );

    const inscripcion = await inscribirseActividad(
        usuario.id,
        actividadId
    );

    return res.status(201).json({
        message: "Inscripción a la actividad realizada correctamente",
        inscripcion
    });
}


// Cancelar inscripción.
export async function cancelarInscripcionActividadController(
    req: AuthRequest,
    res: Response
) {
    const usuario = obtenerUsuario(req);
    const actividadId = obtenerActividadId(
        req.params.actividadId
    );

    const inscripcion =
        await cancelarInscripcionActividadService(
            usuario.id,
            actividadId
        );

    return res.status(200).json({
        message: "Inscripción a la actividad cancelada correctamente",
        inscripcion
    });
}


// Consultar mis inscripciones.
export async function listarMisInscripcionesActividadController(
    req: AuthRequest,
    res: Response
) {
    const usuario = obtenerUsuario(req);

    const inscripciones = await listarMisInscripcionesActividad(
        usuario.id
    );

    return res.status(200).json({
        inscripciones
    });
}
