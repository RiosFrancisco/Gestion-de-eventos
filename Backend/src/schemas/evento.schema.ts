import { z } from "zod";

export const crearEventoSchema = z.object({
    categoria_id: z.coerce
    .number()
    .int()
    .positive({error: "La categoria no es valida."}),

    nombre: z
    .string()
    .min(3, {error: "El campo requiere como minimo 3 caracteres."})
    .max(20, {error: "El campo no admite mas de 20 caracteres."}),

    descripcion: z
    .string()
    .min(5, {error: "El campo requiere como minimo 5 caracteres."})
    .max(100, {error: "El campo no admite mas de 100 caracteres."}),

    fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {error: "El formato de fecha debe ser AAAA-MM-DD."}),

    hora: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, {error: "El formato de hora debe ser HH:MM."}),

    ubicacion: z
    .string()
    .min(5, {error: "El campo debe requiere como minimo 5 caracteres."})
    .max(30, {error: "El campo no admite mas de 30 caracteres."})
    

})