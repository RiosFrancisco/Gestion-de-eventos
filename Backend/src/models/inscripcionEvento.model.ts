export interface InscripcionEvento {
    id: number;
    usuario_id: number;
    evento_id: number;
    estado: "activa" | "cancelada";
    fecha_inscripcion: Date;
    fecha_cancelacion: Date | null;
}
