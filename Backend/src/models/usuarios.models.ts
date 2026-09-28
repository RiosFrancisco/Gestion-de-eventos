export interface Usuario {
    id: number,
    nombre: string,
    email: string,
    rol_id: number,
    created_at: Date
}

export interface UsuarioConContraseña extends Usuario {
    password: string
}