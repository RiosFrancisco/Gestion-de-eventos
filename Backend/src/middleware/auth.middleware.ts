import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface AuthRequest extends Request {
    usuario?: {
        id: number;
        rol_id: number;
    };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        //obtengo el token del header
        const authHeader = req.headers.authorization;

        if (!authHeader || typeof authHeader !== "string") {
            return res.status(401).json({
                message: "Token no proporcionado"
            });
        }
        // comparo formato
        const [tipo, token] = authHeader.split(" ");

        if (tipo !== "Bearer" || !token) {
            return res.status(401).json({
                message: "Token invalido"
            })
        }

        // consigo la clave
        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
            throw new Error("JWT no esta configurado");
        }

        // verifico el token
        const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

        // verifico que el token tenga los datos correctos
        if (typeof decoded.id !== "number" || typeof decoded.rol_id !== "number") {
            return res.status(401).json({
                message: "Token invalido"
            });
        }

        //guardo el usuario en el req
        req.usuario = {
            id: decoded.id,
            rol_id: decoded.rol_id
        }

        next();
    }
    catch(error) {
        return res.status(401).json({
            message: "Token invalido o expirado"
        });
    }
}