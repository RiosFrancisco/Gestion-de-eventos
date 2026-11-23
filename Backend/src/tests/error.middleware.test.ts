import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { z } from "zod";
import { AppError } from "../errors/appError";
import { errorMiddleware } from "../middleware/error.middleware";


function crearAppPrueba(error: Error) {
    const app = express();

    app.get("/prueba", () => {
        throw error;
    });

    app.use(errorMiddleware);

    return app;
}

describe("Middleware global de errores", () => {

    it("devuelve 404 para recursos inexistentes", async () => {
        const app = crearAppPrueba(
            new AppError(404, "Evento no encontrado")
        );

        const respuesta = await request(app).get("/prueba");

        expect(respuesta.status).toBe(404);
        expect(respuesta.body).toEqual({
            message: "Evento no encontrado"
        });
    });

    it("devuelve 403 cuando faltan permisos", async () => {
        const app = crearAppPrueba(
            new AppError(403, "Acceso denegado")
        );

        const respuesta = await request(app).get("/prueba");

        expect(respuesta.status).toBe(403);
        expect(respuesta.body.message).toBe("Acceso denegado");
    });

    it("devuelve 400 para errores de Zod", async () => {
        const schema = z.object({
            nombre: z.string().min(3)
        });

        let error: Error;

        try {
            schema.parse({ nombre: "A" });
            throw new Error("Se esperaba un error de validación");
        } catch (e) {
            error = e as Error;
        }

        const app = crearAppPrueba(error);

        const respuesta = await request(app).get("/prueba");

        expect(respuesta.status).toBe(400);
        expect(respuesta.body.message).toBe("Datos invalidos");
        expect(respuesta.body.errores[0].campo).toBe("nombre");
    });

    it("oculta detalles de errores inesperados", async () => {
        const app = crearAppPrueba(
            new Error("Error interno de PostgreSQL")
        );

        const respuesta = await request(app).get("/prueba");

        expect(respuesta.status).toBe(500);
        expect(respuesta.body).toEqual({
            message: "Error interno del servidor"
        });

        expect(JSON.stringify(respuesta.body)).not.toContain(
            "PostgreSQL"
        );
    });

});
