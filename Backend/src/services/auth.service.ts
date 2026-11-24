import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
    getUsuarioByEmail,
    createUsuario
} from "../repositories/usuario.repository";
import { AppError } from "../errors/appError";


// Registro de usuarios
export async function registerUsuario(
    nombre: string,
    email: string,
    password: string
) {
    const usuarioExistente = await getUsuarioByEmail(email);

    if (usuarioExistente) {
        throw new AppError(
            409,
            "El mail ya esta registrado"
        );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = await createUsuario(
        nombre,
        email,
        hashedPassword
    );

    return nuevoUsuario;
}


// Inicio de sesión
export async function loginUsuario(
    email: string,
    password: string
) {
    const usuario = await getUsuarioByEmail(email);

    if (!usuario) {
        throw new AppError(
            401,
            "Datos invalidos"
        );
    }

    const passwordCorrecto = await bcrypt.compare(
        password,
        usuario.password
    );

    if (!passwordCorrecto) {
        throw new AppError(
            401,
            "Datos invalidos"
        );
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        throw new AppError(
            500,
            "Error interno del servidor"
        );
    }

    const token = jwt.sign(
        {
            id: Number(usuario.id),
            rol_id: usuario.rol_id
        },
        jwtSecret,
        {
            expiresIn: "1h"
        }
    );

    return {
        token,
        usuario: {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol_id: usuario.rol_id
        }
    };
}
