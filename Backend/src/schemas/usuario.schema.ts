import { z } from "zod";

export const cambiarRolSchema = z.strictObject({
    rol: z.enum(["usuario", "creador"])
});

export const modificarDatosUsuarioSchema = z.object({
    nombre: z.string().trim().min(2).max(100).optional(),
    email: z.string().trim().optional()
}).strict().refine(
    datos =>
        datos.nombre !== undefined ||
        datos.email !== undefined,
    {
        message: "Debe proporcionar al menos un campo para actualizar"
    }
);