
import { z } from "zod";

const nombreSchema = z.string()
    .trim()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(50, "El nombre no puede superar 50 caracteres");

const descripcionSchema = z.string()
    .trim()
    .min(1, "La descripción es obligatoria");

const fechaSchema = z.iso.date();

const horaSchema = z.string()
    .regex(
        /^([01]\d|2[0-3]):[0-5]\d$/,
        "La hora debe tener formato HH:mm"
    );

const capacidadSchema = z.number()
    .int("La capacidad debe ser un número entero")
    .positive("La capacidad debe ser mayor a cero")
    .nullable();

const camposEditables = {
    nombre: nombreSchema,
    descripcion: descripcionSchema,
    fecha: fechaSchema,
    hora: horaSchema,
    capacidad: capacidadSchema
};


export const crearActividadSchema = z.strictObject({
    evento_id: z.number().int().positive(),
    ...camposEditables,
    capacidad: capacidadSchema
        .optional()
        .transform(valor => valor ?? null)
});


export const actualizarActividadSchema = z.strictObject(
    camposEditables
)
    .partial()
    .refine(
        datos => Object.keys(datos).length > 0,
        "Debe proporcionar al menos un campo para actualizar"
    );
