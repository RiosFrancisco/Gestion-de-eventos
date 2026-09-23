import { z } from "zod";

export const registerSchema = z.object({
    nombre: z
    .string()
    .min(3, {error: "El campo debe tener al menos 2 caracteres"})
    .max(15, {error: "El campo no admite mas de 15 caracteres"}),
    
    email: z
    .email({error: "el mail no es valido"})
    .max(30, {error: "El campo no admite mas de 30 caracteres"}),

    password: z
    .string()
    .min(8, {error: "El campo debe tener al menos 8 caracteres"})
});