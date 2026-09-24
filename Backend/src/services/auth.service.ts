import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
    getUsuarioByEmail,
    createUsuario
} from "../repositories/usuarios.repository";



export async function registerUsuario(nombre: string, email: string, password: string) {

    //validacion de cuenta existente
    const usuarioExistente = await getUsuarioByEmail(email);
    if (usuarioExistente) {
        throw new Error("El mail ya esta registrado");
    }

    // hash de contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = await createUsuario(nombre, email, hashedPassword);
    return nuevoUsuario;
}

export async function loginUsuario(email: string, password: string) {
    const usuario = await getUsuarioByEmail(email);
    if (!usuario) {
        throw new Error("Datos invalidos");
    }

   
    const passwordCorrecto = await bcrypt.compare(password, usuario.password);

    if (!passwordCorrecto) {
        throw new Error("Datos invalidos");
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error("JWT no esta configurado");
    }

    const token = jwt.sign({
        id: Number(usuario.id),
        rol_id: usuario.rol_id
    },
        jwtSecret, {
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