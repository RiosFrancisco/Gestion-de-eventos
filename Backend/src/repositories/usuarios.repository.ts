import { pool } from "../config/database";
import { UsuarioConContraseña } from "../models/usuarios.models";

export async function getUsuarioByEmail(email: string): Promise<UsuarioConContraseña | undefined> {
    const result = await pool.query(
        `SELECT id, nombre, email, password, rol_id, created_at
        FROM usuarios
        WHERE email = $1`,
        [email]
    );

    const usuario = result.rows[0];

    if (!usuario) {
        return undefined;
    }

    return {...usuario, id: Number(usuario.id), rol_id: Number(usuario.rol_id)}
}

export async function getUsuarioById(id: number) {
    const result = await pool.query(
        `SELECT id, nombre, email, rol_id, created_at
        FROM usuarios
        WHERE id = $1`,
        [id]
    );
    return result.rows[0];
}

export async function createUsuario(nombre: string, email: string, password: string) {
    const result = await pool.query(
        `INSERT INTO usuarios (nombre, email, password, rol_id)
        VALUES ( $1, $2, $3, (SELECT id FROM roles WHERE nombre = 'usuario'))
        RETURNING id, nombre, email, rol_id, created_at`,
        [nombre, email, password]
    );
    return result.rows[0];
}