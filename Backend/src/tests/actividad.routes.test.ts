
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app";
import { ROLES } from "../utils/roles";


describe("Rutas de actividades", () => {

    const jwtSecretAnterior = process.env.JWT_SECRET;
    const jwtSecretTest = "clave-exclusiva-de-testing";

    beforeAll(() => {
        process.env.JWT_SECRET = jwtSecretTest;
    });

    afterAll(() => {
        if (jwtSecretAnterior === undefined) {
            delete process.env.JWT_SECRET;
        } else {
            process.env.JWT_SECRET = jwtSecretAnterior;
        }
    });

    function generarToken(
        usuarioId: number,
        rolId: number
    ): string {
        return jwt.sign(
            { id: usuarioId, rol_id: rolId },
            jwtSecretTest,
            { expiresIn: "1h" }
        );
    }

    const datosActividad = {
        evento_id: 1,
        nombre: "Taller de TypeScript",
        descripcion: "Introducción a TypeScript",
        fecha: "2099-12-31",
        hora: "20:00",
        capacidad: 30
    };


    describe("GET /api/actividades", () => {

        it("debe rechazar un ID de evento inválido", async () => {
            const respuesta = await request(app)
                .get("/api/actividades/evento/abc");

            expect(respuesta.status).toBe(400);
            expect(respuesta.body.message).toBe(
                "ID de evento inválido"
            );
        });

        it("debe rechazar un ID de actividad inválido", async () => {
            const respuesta = await request(app)
                .get("/api/actividades/abc");

            expect(respuesta.status).toBe(400);
            expect(respuesta.body.message).toBe(
                "ID de actividad inválido"
            );
        });

        it("debe permitir acceder sin autenticación a las consultas públicas", async () => {
            const respuesta = await request(app)
                .get("/api/actividades/evento/abc");

            // La solicitud llega al controlador, que valida el ID.
            // No es rechazada por falta de autenticación.
            expect(respuesta.status).toBe(400);
            expect(respuesta.body.message).not.toBe(
                "Token no proporcionado"
            );
        });
    });


    describe("POST /api/actividades", () => {

        it("debe rechazar solicitudes sin autenticación", async () => {
            const respuesta = await request(app)
                .post("/api/actividades")
                .send(datosActividad);

            expect(respuesta.status).toBe(401);
            expect(respuesta.body.message).toBe(
                "Token no proporcionado"
            );
        });

        it("debe rechazar un token inválido", async () => {
            const respuesta = await request(app)
                .post("/api/actividades")
                .set("Authorization", "Bearer token-invalido")
                .send(datosActividad);

            expect(respuesta.status).toBe(401);
            expect(respuesta.body.message).toBe(
                "Token invalido o expirado"
            );
        });

        it("debe rechazar usuarios sin rol permitido", async () => {
            const token = generarToken(10, ROLES.usuario);

            const respuesta = await request(app)
                .post("/api/actividades")
                .set("Authorization", `Bearer ${token}`)
                .send(datosActividad);

            expect(respuesta.status).toBe(403);
        });

        it("debe rechazar una actividad con datos inválidos", async () => {
            const token = generarToken(10, ROLES.creador);

            const respuesta = await request(app)
                .post("/api/actividades")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    ...datosActividad,
                    nombre: "AB"
                });

            expect(respuesta.status).toBe(400);
        });

        it("debe rechazar una capacidad negativa", async () => {
            const token = generarToken(10, ROLES.creador);

            const respuesta = await request(app)
                .post("/api/actividades")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    ...datosActividad,
                    capacidad: -10
                });

            expect(respuesta.status).toBe(400);
        });

        it("no debe permitir enviar campos no autorizados", async () => {
            const token = generarToken(10, ROLES.creador);

            const respuesta = await request(app)
                .post("/api/actividades")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    ...datosActividad,
                    estado: "finalizado"
                });

            expect(respuesta.status).toBe(400);
        });
    });


    describe("PATCH /api/actividades/:id", () => {

        it("debe rechazar solicitudes sin autenticación", async () => {
            const respuesta = await request(app)
                .patch("/api/actividades/1")
                .send({ nombre: "Taller actualizado" });

            expect(respuesta.status).toBe(401);
        });

        it("debe rechazar IDs inválidos", async () => {
            const token = generarToken(10, ROLES.creador);

            const respuesta = await request(app)
                .patch("/api/actividades/abc")
                .set("Authorization", `Bearer ${token}`)
                .send({ nombre: "Taller actualizado" });

            expect(respuesta.status).toBe(400);
            expect(respuesta.body.message).toBe(
                "ID de actividad inválido"
            );
        });

        it("debe rechazar actualizaciones vacías", async () => {
            const token = generarToken(10, ROLES.creador);

            const respuesta = await request(app)
                .patch("/api/actividades/1")
                .set("Authorization", `Bearer ${token}`)
                .send({});

            expect(respuesta.status).toBe(400);
        });

        it("no debe permitir modificar el estado directamente", async () => {
            const token = generarToken(10, ROLES.creador);

            const respuesta = await request(app)
                .patch("/api/actividades/1")
                .set("Authorization", `Bearer ${token}`)
                .send({ estado: "cancelado" });

            expect(respuesta.status).toBe(400);
        });
    });


    describe("PATCH /api/actividades/:id/cancelar", () => {

        it("debe rechazar solicitudes sin autenticación", async () => {
            const respuesta = await request(app)
                .patch("/api/actividades/1/cancelar");

            expect(respuesta.status).toBe(401);
        });

        it("debe rechazar usuarios sin rol permitido", async () => {
            const token = generarToken(10, ROLES.usuario);

            const respuesta = await request(app)
                .patch("/api/actividades/1/cancelar")
                .set("Authorization", `Bearer ${token}`);

            expect(respuesta.status).toBe(403);
        });

        it("debe rechazar un ID inválido", async () => {
            const token = generarToken(10, ROLES.creador);

            const respuesta = await request(app)
                .patch("/api/actividades/abc/cancelar")
                .set("Authorization", `Bearer ${token}`);

            expect(respuesta.status).toBe(400);
        });
    });
});
