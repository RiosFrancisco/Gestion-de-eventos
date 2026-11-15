import { mapUsuario } from "../utils/usuarioMapper";
import { pool } from "../config/database";
import type {
    Usuario,
    UsuarioConContraseña
} from "../models/usuario.model";


export async function getUsuarioByEmail(
    email: string
): Promise<UsuarioConContraseña | undefined> {

    const resultado = await pool.query(
        `SELECT
            id, nombre, email, password, rol_id, created_at
         FROM usuarios
         WHERE email = $1`,
        [email]
    );

    const usuario = resultado.rows[0];

    return usuario ? mapUsuario(usuario) as UsuarioConContraseña : undefined;
}


export async function getUsuarioById(
    id: number
): Promise<Usuario | undefined> {

    const resultado = await pool.query(
        `SELECT
            id, nombre, email, rol_id, created_at
         FROM usuarios
         WHERE id = $1`,
        [id]
    );

    const usuario = resultado.rows[0];

    return usuario ? mapUsuario(usuario) : undefined;
}


export async function createUsuario(
    nombre: string,
    email: string,
    password: string
): Promise<Usuario> {

    const resultado = await pool.query(
        `INSERT INTO usuarios
            (nombre, email, password, rol_id)
         VALUES (
            $1,
            $2,
            $3,
            (SELECT id FROM roles WHERE nombre = 'usuario')
         )
         RETURNING id, nombre, email, rol_id, created_at`,
        [nombre, email, password]
    );

    return mapUsuario(resultado.rows[0]);
}


export async function getAllUsuarios(): Promise<Usuario[]> {

    const resultado = await pool.query(
        `SELECT
            id, nombre, email, rol_id, created_at
         FROM usuarios
         ORDER BY id ASC`
    );

    return resultado.rows.map(mapUsuario);
}


export async function updateRolUsuario(
    usuarioId: number,
    rol: "usuario" | "creador"
): Promise<Usuario | undefined> {

    const resultado = await pool.query(
        `UPDATE usuarios
         SET rol_id = (
             SELECT id
             FROM roles
             WHERE nombre = $1
         )
         WHERE id = $2
         RETURNING id, nombre, email, rol_id, created_at`,
        [rol, usuarioId]
    );

    const usuario = resultado.rows[0];

    return usuario ? mapUsuario(usuario) : undefined;
}