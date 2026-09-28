import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

export function validarRol(...rolesPermitidos: number[]) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.usuario) {
            return res.status(401).json({
                message: "Debe iniciar sesion para realizar esta accion"
            });
        }
        if (!rolesPermitidos.includes(req.usuario.rol_id)) {
            return res.status(403).json({
                message: "No tiene permisos para realizar esta accion"
            });
        }
        next();
    }
}