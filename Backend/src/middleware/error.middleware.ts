import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/appError";

export const errorMiddleware: ErrorRequestHandler = (
    error: unknown,
    req,
    res,
    next
) => {
    if (res.headersSent) {
        return next(error);
    }

    if (error instanceof AppError) {
        res.status(error.statusCode).json({
            message: error.message
        });
        return;
    }

    if (error instanceof ZodError) {
        res.status(400).json({
            message: "Datos invalidos",
            errores: error.issues.map((issue) => ({
                campo: issue.path.join("."),
                mensaje: issue.message
            }))
        });
        return;
    }

    console.error("Error no controlado:", error);

    res.status(500).json({
        message: "Error interno del servidor"
    });
};
