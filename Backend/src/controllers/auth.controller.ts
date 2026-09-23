import { Request, Response } from "express";
import { registerSchema } from "../schemas/auth.schema";
import { registerUsuario } from "../services/auth.service";

export async function register(req: Request, res: Response) {
    try {
        //valido los datos
        const datos = registerSchema.parse(req.body);

        // envio datos al service
        const usuario = await registerUsuario(
            datos.nombre,
            datos.email,
            datos.password
        );

        //mensaje de cuenta creada
        return res.status(201).json({
            message: "Usuario registrado correctamente", 
            usuario
        });
    }
    catch (error) {
        console.error("ERROR AL REGISTRAR", error);
        
        return res.status(400).json({
            message: "Error al registrar usuario"
        });
    }
}