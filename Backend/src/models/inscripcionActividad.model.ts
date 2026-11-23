export interface InscripcionActividad {
    id: number;
    usuario_id: number;
    actividad_id: number;
    estado: "activa" | "cancelada";
    fecha_inscripcion: Date;
    fecha_cancelacion: Date | null;
}
