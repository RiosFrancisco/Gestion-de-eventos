import type {
    Request,
    Response,
    NextFunction
} from "express";

import jwt from "jsonwebtoken";

import { getUsuarioById } from "../repositories/usuario.repository";

export interface AuthRequest extends Request {
    usuario?: {
        id: number;
        rol_id: number;
    };
}

export async function authMiddleware(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            message: "Token no proporcionado"
        });
    }

    const [tipo, token] = authHeader.split(" ");

    if (tipo !== "Bearer" || !token) {
        return res.status(401).json({
            message: "Token invalido"
        });
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        return res.status(500).json({
            message: "Error interno del servidor"
        });
    }

    let usuarioId: number;

    try {
        const decoded = jwt.verify(token, jwtSecret);

        if (
            typeof decoded === "string" ||
            typeof decoded.id !== "number" ||
            !Number.isSafeInteger(decoded.id) ||
            decoded.id <= 0
        ) {
            return res.status(401).json({
                message: "Token invalido"
            });
        }

        usuarioId = decoded.id;

    } catch {
        return res.status(401).json({
            message: "Token invalido o expirado"
        });
    }

    try {
        const usuario = await getUsuarioById(usuarioId);

        if (!usuario) {
            return res.status(401).json({
                message: "Usuario no autorizado"
            });
        }

        req.usuario = {
            id: usuario.id,
            rol_id: usuario.rol_id
        };

        next();

    } catch (error) {
        next(error);
    }
}
