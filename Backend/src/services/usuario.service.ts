import {
    getAllUsuarios,
    getUsuarioById,
    updateRolUsuario
} from "../repositories/usuario.repository";

import { ROLES } from "../utils/roles";
import { AppError } from "../errors/appError";

type RolAsignable = "usuario" | "creador";

export async function listarUsuarios() {
    return getAllUsuarios();
}

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
