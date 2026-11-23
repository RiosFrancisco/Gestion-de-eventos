
import type { Request, Response } from "express";

import {
    registerSchema,
    loginSchema
} from "../schemas/auth.schema";

import {
    registerUsuario,
    loginUsuario
} from "../services/auth.service";


// Registro de usuarios
export async function register(
    req: Request,
    res: Response
) {
    const datos = registerSchema.parse(req.body);

    const usuario = await registerUsuario(
        datos.nombre,
        datos.email,
        datos.password
    );

    return res.status(201).json({
        message: "Usuario registrado correctamente",
        usuario
    });
}


// Inicio de sesión
export async function login(
    req: Request,
    res: Response
) {
    const datos = loginSchema.parse(req.body);

    const resultado = await loginUsuario(
        datos.email,
        datos.password
    );

    return res.status(200).json({
        message: "Ingreso exitoso",
        ...resultado
    });
}
