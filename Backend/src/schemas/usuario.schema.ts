import { z } from "zod";

export const cambiarRolSchema = z.strictObject({
    rol: z.enum(["usuario", "creador"])
});