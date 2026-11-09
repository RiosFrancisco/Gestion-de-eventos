import { describe, it, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import app from "../app";
import { pool } from "../config/database";
import { ROLES } from "../utils/roles";
import type { CrearEvento } from "../models/evento.model";

describe("API de eventos - test integracion", () => {

    it("Debe crear un evento y guardarlo en postgre", async () => {

        let usuarioId: number | undefined;
        let eventoId: number | undefined;

        try {
            // Obtenemos categoria existente
            const categorias = await pool.query<{ id: number }>(
                `SELECT id FROM categorias_evento LIMIT 1`
            );

            const categoria = categorias.rows[0];

            if (!categoria) {
                throw new Error("No existen categorias de prueba");
            }

            // Creamos un usuario con rol de creador
            const usuario = await pool.query<{ id: string }>(
                `INSERT INTO usuarios
                (nombre, email, password, rol_id)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
                [
                    "Creador Test",
                    `test-${randomUUID()}@example.test`,
                    "hash-de-test",
                    ROLES.creador
                ]
            );

            usuarioId = Number(usuario.rows[0].id);

            // Obtenemos la clave configurada para testing
            const jwtSecret = process.env.JWT_SECRET;

            if (!jwtSecret) {
                throw new Error("JWT_SECRET no configurado")
            }

            // Generamos token para el usuario de prueba
            const token = jwt.sign({
                id: usuarioId,
                rol_id: ROLES.creador
            },
                jwtSecret,
                { expiresIn: "1h" }
            );

            const datosEvento: CrearEvento = {
                categoria_id: categoria.id,
                nombre: "Evento test api",
                descripcion: "Evento creado para testear con supertest",
                fecha: "2040-12-20",
                hora: "20:00",
                ubicacion: "Bahia Blanca"
            };

            // Enviamos solicitud HTTP real a express7
            const respuesta = await request(app)
                .post("/api/eventos")
                .set("Authorization", `Bearer ${token}`)
                .send(datosEvento);

            console.log("Status:", respuesta.status);
            console.log("Respuesta:", respuesta.body);

            expect(respuesta.status).toBe(201);
            expect(respuesta.body.message).toBe("Evento creado con exito.");

            expect(respuesta.body.evento).toMatchObject({
                nombre: datosEvento.nombre,
                descripcion: datosEvento.descripcion,
                estado: "publicado",
                creador_id: usuarioId
            });

            eventoId = Number(respuesta.body.evento.id);

            // Verificamos que el evento existe en la base de datos
            const resultado = await pool.query<{
                nombre: string;
                creador_id: string;
                estado: string;
            }>(
                `SELECT nombre, creador_id, estado
        FROM eventos
        WHERE id = $1`,
                [eventoId]
            );

            expect(resultado.rows).toHaveLength(1);

            expect(resultado.rows[0]).toMatchObject({
                nombre: datosEvento.nombre,
                creador_id: String(usuarioId),
                estado: "publicado"
            });

        } finally {
            // Limpiar los registros creados por esta prueba
            if (eventoId !== undefined) {
                await pool.query(
                    "DELETE FROM eventos WHERE id = $1",
                    [eventoId]
                );
            }

            if (usuarioId !== undefined) {
                await pool.query(
                    "DELETE FROM usuarios WHERE id = $1",
                    [usuarioId]
                );
            }
        }
    });
});
