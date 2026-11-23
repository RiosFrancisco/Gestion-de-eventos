import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware";
import { cambiarRolSchema, modificarDatosUsuarioSchema, actualizarMiPerfilSchema } from "../schemas/usuario.schema";
import { AppError } from "../errors/appError";
import {
    listarUsuarios,
    cambiarRolUsuario,
    modificarDatosUsuario,
    obtenerMiPerfil,
    actualizarMiPerfil
} from "../services/usuario.service";


function obtenerId(valor: unknown): number | undefined {
    if (
        typeof valor !== "string" ||
        !/^[1-9]\d*$/.test(valor)
    ) {
        return undefined;
    }

    const id = Number(valor);

    return Number.isSafeInteger(id) ? id : undefined;
}


export async function listarUsuariosController(
    req: AuthRequest,
    res: Response
) {
    const usuarios = await listarUsuarios();

    return res.status(200).json({ usuarios });
}


export async function cambiarRolController(
    req: AuthRequest,
    res: Response
) {
    const administrador = req.usuario;

    if (!administrador) {
        throw new AppError(401, "Debe iniciar sesión");
    }

    const usuarioId = obtenerId(req.params.id);

    if (usuarioId === undefined) {
        throw new AppError(400, "ID de usuario inválido");
    }

    const validacion = cambiarRolSchema.safeParse(req.body);

    if (!validacion.success) {
        throw new AppError(
            400,
            "Rol inválido. Debe ser usuario o creador"
        );
    }

    const usuario = await cambiarRolUsuario(
        administrador.id,
        usuarioId,
        validacion.data.rol
    );

    return res.status(200).json({
        message: "Rol actualizado correctamente",
        usuario
    });
}


export async function modificarDatosUsuarioController(
    req: AuthRequest,
    res: Response
) {
    const administrador = req.usuario;

    if (!administrador) {
        throw new AppError(
            401,
            "Debe iniciar sesión"
        );
    }

    const usuarioId = obtenerId(req.params.id);

    if (usuarioId === undefined) {
        throw new AppError(
            400,
            "ID de usuario inválido"
        );
    }

    const validacion =
        modificarDatosUsuarioSchema.safeParse(req.body);

    if (!validacion.success) {
        throw new AppError(
            400,
            validacion.error.issues[0]?.message
                ?? "Datos de usuario inválidos"
        );
    }

    const usuario = await modificarDatosUsuario(
        administrador.id,
        usuarioId,
        validacion.data
    );

    return res.status(200).json({
        message: "Usuario actualizado correctamente",
        usuario
    });
}

export async function obtenerMiPerfilController(
    req: AuthRequest,
    res: Response
) {
    if (!req.usuario) {
        throw new AppError(401, "Debe iniciar sesión");
    }

    const usuario = await obtenerMiPerfil(req.usuario.id);

    return res.status(200).json({ usuario });
}

export async function actualizarMiPerfilController(
    req: AuthRequest,
    res: Response
) {
    if (!req.usuario) {
        throw new AppError(401, "Debe iniciar sesión");
    }

    const validacion = actualizarMiPerfilSchema.safeParse(req.body);

    if (!validacion.success) {
        throw new AppError(
            400,
            validacion.error.issues[0]?.message ?? "Datos de perfil inválidos"
        );
    }

    const usuario = await actualizarMiPerfil(req.usuario.id, validacion.data);

    return res.status(200).json({
        message: "Perfil actualizado correctamente",
        usuario
    });
}