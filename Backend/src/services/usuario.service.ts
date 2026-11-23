
import {
    getAllUsuarios,
    getUsuarioById,
    updateRolUsuario,
    updateDatosUsuario
} from "../repositories/usuario.repository";

import { ROLES } from "../utils/roles";
import { AppError } from "../errors/appError";

type RolAsignable = "usuario" | "creador";

type DatosUsuario = {
    nombre?: string;
    email?: string;
};


// Listar usuarios
export async function listarUsuarios() {
    return getAllUsuarios();
}


// Cambiar rol de un usuario
export async function cambiarRolUsuario(
    administradorId: number,
    usuarioId: number,
    nuevoRol: RolAsignable
) {
    if (administradorId === usuarioId) {
        throw new AppError(
            403,
            "No puede modificar su propio rol"
        );
    }

    const usuario = await getUsuarioById(usuarioId);

    if (!usuario) {
        throw new AppError(
            404,
            "Usuario no encontrado"
        );
    }

    if (usuario.rol_id === ROLES.admin) {
        throw new AppError(
            403,
            "No se puede modificar el rol de un administrador"
        );
    }

    const rolId = ROLES[nuevoRol];

    if (usuario.rol_id === rolId) {
        return usuario;
    }

    const usuarioActualizado = await updateRolUsuario(
        usuarioId,
        nuevoRol
    );

    if (!usuarioActualizado) {
        throw new AppError(
            409,
            "No se pudo actualizar el rol del usuario"
        );
    }

    return usuarioActualizado;
}


// Modificar nombre y/o email de un usuario
export async function modificarDatosUsuario(
    administradorId: number,
    usuarioId: number,
    datos: DatosUsuario
) {
    // Comprobar que se enviaron campos para actualizar
    if (
        datos.nombre === undefined &&
        datos.email === undefined
    ) {
        throw new AppError(
            400,
            "Debe proporcionar al menos un campo para actualizar"
        );
    }

    // Impedir modificaciones sobre la propia cuenta
    if (administradorId === usuarioId) {
        throw new AppError(
            403,
            "No puede modificar sus propios datos desde este panel"
        );
    }

    // Comprobar que el usuario exista
    const usuario = await getUsuarioById(usuarioId);

    if (!usuario) {
        throw new AppError(
            404,
            "Usuario no encontrado"
        );
    }

    // Impedir modificaciones sobre administradores
    if (usuario.rol_id === ROLES.admin) {
        throw new AppError(
            403,
            "No se pueden modificar los datos de un administrador"
        );
    }

    try {
        const usuarioActualizado = await updateDatosUsuario(
            usuarioId,
            datos
        );

        if (!usuarioActualizado) {
            throw new AppError(
                404,
                "Usuario no encontrado"
            );
        }

        return usuarioActualizado;

    } catch (error: unknown) {
        // PostgreSQL: violación de restricción UNIQUE
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "23505"
        ) {
            throw new AppError(
                409,
                "El email ya está registrado"
            );
        }

        throw error;
    }
}

// Obtener datos del perfil del usuario autenticado
export async function obtenerMiPerfil(usuarioId: number) {
    const usuario = await getUsuarioById(usuarioId);

    if (!usuario) {
        throw new AppError(404, "Usuario no encontrado");
    }

    return usuario;
}

// Actualizar datos del perfil del usuario autenticado
export async function actualizarMiPerfil(usuarioId: number, datos: DatosUsuario) {
    if (datos.nombre === undefined && datos.email === undefined) {
        throw new AppError(
            400,
            "Debe proporcionar al menos un campo para actualizar"
        );
    }

    const usuario = await getUsuarioById(usuarioId);

    if (!usuario) {
        throw new AppError(404, "Usuario no encontrado");
    }

    try {
        const usuarioActualizado = await updateDatosUsuario(usuarioId, datos);

        if (!usuarioActualizado) {
            throw new AppError(404, "Usuario no encontrado");
        }

        return usuarioActualizado;
    } catch (error: unknown) {
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "23505"
        ) {
            throw new AppError(409, "El email ya está registrado");
        }

        throw error;
    }
}