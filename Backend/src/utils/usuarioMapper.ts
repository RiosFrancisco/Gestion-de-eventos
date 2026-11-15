import {Usuario} from "../models/usuario.model";

export function mapUsuario(usuario: Usuario): Usuario {
    return {
        ...usuario,
        id: Number(usuario.id),
        rol_id: Number(usuario.rol_id)
    };
}