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

export const actualizarMiPerfilSchema = z.object({
    nombre: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres").max(25, "El nombre no puede superar los 25 caracteres").optional(),
    email: z.string().trim().email("Formato de correo electrónico inválido").max(30).optional()
}).strict().refine(
    datos => 
        datos.nombre !== undefined ||
        datos.email !== undefined,
    {
        message: "Debe proporcionar al menos un campo para actualizar"
    }
);