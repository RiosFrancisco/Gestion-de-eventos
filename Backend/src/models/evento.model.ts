import { EstadoEvento } from "../utils/estadosEvento"

export interface Evento {
    id: number,
    creador_id: number,
    categoria_id: number,
    nombre: string,
    descripcion: string,
    fecha: string,
    hora: string,
    ubicacion: string,
    estado: EstadoEvento,
    created_at: Date
}

export interface CrearEvento {
    categoria_id: number,
    nombre: string,
    descripcion: string,
    fecha: string,
    hora: string,
    ubicacion: string
}

export interface EventoListado {
    id: number;
    nombre: string;
    descripcion: string;
    fecha: string;
    hora: string;
    ubicacion: string;
    estado: EstadoEvento;
    categoria: string;
    creador: string;
}

export type ActualizarEvento = Partial<CrearEvento>;