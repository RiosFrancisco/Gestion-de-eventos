
import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware";

import { cambiarRolSchema } from "../schemas/usuario.schema";

import {
    listarUsuarios,
    cambiarRolUsuario
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
    try {
        const usuarios = await listarUsuarios();

        return res.status(200).json({ usuarios });

    } catch {
        return res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}

export async function cambiarRolController(
    req: AuthRequest,
    res: Response
) {
    const administrador = req.usuario;

    if (!administrador) {
        return res.status(401).json({
            message: "Debe iniciar sesión"
        });
    }

    const usuarioId = obtenerId(req.params.id);

    if (usuarioId === undefined) {
        return res.status(400).json({
            message: "ID de usuario inválido"
        });
    }

    const validacion = cambiarRolSchema.safeParse(req.body);

    if (!validacion.success) {
        return res.status(400).json({
            message: "Rol inválido. Debe ser usuario o creador"
        });
    }

    try {
        const usuario = await cambiarRolUsuario(
            administrador.id,
            usuarioId,
            validacion.data.rol
        );

        return res.status(200).json({
            message: "Rol actualizado correctamente",
            usuario
        });

    } catch (error) {
        if (error instanceof Error) {
            const mensajes = [
                "No puede modificar su propio rol",
                "No se puede modificar el rol de un administrador"
            ];

            if (mensajes.includes(error.message)) {
                return res.status(403).json({
                    message: error.message
                });
            }

            if (error.message === "Usuario no encontrado") {
                return res.status(404).json({
                    message: error.message
                });
            }
        }

        return res.status(500).json({
            message: "Error interno del servidor"
        });
    }
}
