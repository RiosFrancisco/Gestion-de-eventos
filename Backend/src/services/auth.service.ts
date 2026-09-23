import bcrypt from "bcrypt";

import {
    getUsuarioByEmail,
    createUsuario
} from "../repositories/usuarios.repository";

export async function registerUsuario(nombre: string, email:string, password: string) {

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