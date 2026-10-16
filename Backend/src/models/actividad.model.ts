export interface Actividad {
    id?: number;
    evento_id: number;
    nombre: string;
    descripcion: string;
    fecha: Date;
    capacidad?: number | null;
}