export type EstadoActividad =
    | "publicado"
    | "cancelado"
    | "finalizado";

export interface Actividad {
    id: number;
    evento_id: number;
    nombre: string;
    descripcion: string;
    fecha: string;
    hora: string;
    capacidad: number | null;
    estado: EstadoActividad;
    created_at: Date;
}

export type CrearActividad = Pick<
    Actividad,
    | "evento_id"
    | "nombre"
    | "descripcion"
    | "fecha"
    | "hora"
    | "capacidad"
>;

export type ActualizarActividad = Partial<
    Pick<
        Actividad,
        | "nombre"
        | "descripcion"
        | "fecha"
        | "hora"
        | "capacidad"
    >
>;