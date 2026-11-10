
import {
    describe,
    it,
    expect,
    afterEach
} from "vitest";

import request from "supertest";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";

import app from "../app";
import { pool } from "../config/database";
import { createEvento } from "../repositories/evento.repository";
import { ROLES } from "../utils/roles";

import type { CrearEvento } from "../models/evento.model";

describe("API de eventos - Integración", () => {

    const usuariosCreados: number[] = [];



    //Hice funciones reutilizables como obtener categorias y crear usuario para evitar repetir en todos los test
    async function obtenerCategoriaId(): Promise<number> {
        const resultado = await pool.query<{ id: number }>(
            "SELECT id FROM categorias_evento ORDER BY id LIMIT 1"
        );

        const categoria = resultado.rows[0];

        if (!categoria) {
            throw new Error("No existen categorías de prueba");
        }

        return Number(categoria.id);
    }

    async function crearUsuarioPrueba(
        rolId: number = ROLES.creador
    ): Promise<number> {

        const resultado = await pool.query<{ id: string }>(
            `INSERT INTO usuarios
                (nombre, email, password, rol_id)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [
                "Usuario Test",
                `test-${randomUUID()}@example.test`,
                "hash-solo-para-test",
                rolId
            ]
        );

        const usuarioId = Number(resultado.rows[0].id);

        usuariosCreados.push(usuarioId);

        return usuarioId;
    }

    function obtenerJwtSecret(): string {
        const secret = process.env.JWT_SECRET;

        if (!secret) {
            throw new Error("JWT_SECRET no está configurado para testing");
        }

        return secret;
    }

    function generarToken(
        usuarioId: number,
        rolId: number = ROLES.creador
    ): string {
        return jwt.sign(
            { id: usuarioId, rol_id: rolId },
            obtenerJwtSecret(),
            { expiresIn: "1h" }
        );
    }

    function datosEvento(categoriaId: number): CrearEvento {
        return {
            categoria_id: categoriaId,
            nombre: "Evento API Test",
            descripcion: "Prueba de integración",
            fecha: "2099-12-31",
            hora: "20:00",
            ubicacion: "Bahía Blanca"
        };
    }

    async function crearEventoPrueba(creadorId: number) {
        const categoriaId = await obtenerCategoriaId();

        return createEvento(
            creadorId,
            datosEvento(categoriaId)
        );
    }

    async function obtenerEstadoEvento(
        eventoId: number
    ): Promise<string | undefined> {

        const resultado = await pool.query<{ estado: string }>(
            "SELECT estado FROM eventos WHERE id = $1",
            [eventoId]
        );

        return resultado.rows[0]?.estado;
    }

    // --------------------------------------------------
    // LIMPIEZA DE DATOS
    // --------------------------------------------------

    afterEach(async () => {

        if (usuariosCreados.length === 0) {
            return;
        }

        try {
            // Eliminar eventos de los usuarios de prueba.
            await pool.query(
                `DELETE FROM eventos
                 WHERE creador_id = ANY($1::bigint[])`,
                [usuariosCreados]
            );

            // Eliminar usuarios de prueba.
            await pool.query(
                `DELETE FROM usuarios
                 WHERE id = ANY($1::bigint[])`,
                [usuariosCreados]
            );

        } finally {
            usuariosCreados.length = 0;
        }
    });

    // --------------------------------------------------
    // CREACIÓN
    // --------------------------------------------------

    describe("POST /api/eventos", () => {

        it("debe crear un evento en PostgreSQL", async () => {

            const usuarioId = await crearUsuarioPrueba();
            const token = generarToken(usuarioId);

            const categoriaId = await obtenerCategoriaId();
            const datos = datosEvento(categoriaId);

            const respuesta = await request(app)
                .post("/api/eventos")
                .set("Authorization", `Bearer ${token}`)
                .send(datos);

            expect(respuesta.status).toBe(201);

            expect(respuesta.body.evento).toMatchObject({
                nombre: datos.nombre,
                creador_id: usuarioId,
                estado: "publicado"
            });

            const eventoId = Number(respuesta.body.evento.id);

            const resultado = await pool.query<{
                nombre: string;
                creador_id: string;
            }>(
                `SELECT nombre, creador_id
                 FROM eventos
                 WHERE id = $1`,
                [eventoId]
            );

            expect(resultado.rows).toHaveLength(1);
            expect(resultado.rows[0].nombre).toBe(datos.nombre);
            expect(Number(resultado.rows[0].creador_id)).toBe(
                usuarioId
            );
        });
    });

    // --------------------------------------------------
    // CONSULTA
    // --------------------------------------------------

    describe("GET /api/eventos/:id", () => {

        it("debe devolver un evento existente", async () => {

            const usuarioId = await crearUsuarioPrueba();
            const evento = await crearEventoPrueba(usuarioId);

            const respuesta = await request(app)
                .get(`/api/eventos/${evento.id}`);

            expect(respuesta.status).toBe(200);

            expect(respuesta.body.evento).toMatchObject({
                id: evento.id,
                nombre: evento.nombre,
                estado: "publicado"
            });
        });
    });

    // --------------------------------------------------
    // ACTUALIZACIÓN
    // --------------------------------------------------

    describe("PATCH /api/eventos/:id", () => {

        it("debe permitir actualizar su propio evento", async () => {

            const usuarioId = await crearUsuarioPrueba();
            const token = generarToken(usuarioId);
            const evento = await crearEventoPrueba(usuarioId);

            const nuevoNombre = "Evento actualizado";

            const respuesta = await request(app)
                .patch(`/api/eventos/${evento.id}`)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    nombre: nuevoNombre
                });

            expect(respuesta.status).toBe(200);
            expect(respuesta.body.evento.nombre).toBe(nuevoNombre);

            const resultado = await pool.query<{
                nombre: string;
                ubicacion: string;
            }>(
                `SELECT nombre, ubicacion
                 FROM eventos
                 WHERE id = $1`,
                [evento.id]
            );

            expect(resultado.rows[0]).toMatchObject({
                nombre: nuevoNombre,
                ubicacion: evento.ubicacion
            });
        });

        it("no debe permitir modificar un evento ajeno", async () => {

            const propietarioId = await crearUsuarioPrueba();
            const otroUsuarioId = await crearUsuarioPrueba();

            const evento = await crearEventoPrueba(propietarioId);
            const token = generarToken(otroUsuarioId);

            const respuesta = await request(app)
                .patch(`/api/eventos/${evento.id}`)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    nombre: "Modificación ajena"
                });

            // Código que actualmente devuelve tu controlador.
            expect(respuesta.status).toBe(400);

            expect(respuesta.body.message).toBe(
                "No tiene permisos para realizar esta accion."
            );

            const resultado = await pool.query<{ nombre: string }>(
                "SELECT nombre FROM eventos WHERE id = $1",
                [evento.id]
            );

            expect(resultado.rows[0].nombre).toBe(evento.nombre);
        });
    });

    // --------------------------------------------------
    // CANCELACIÓN
    // --------------------------------------------------

    describe("PATCH /api/eventos/:id/cancelar", () => {

        it("debe cancelar un evento existente", async () => {

            const usuarioId = await crearUsuarioPrueba();
            const token = generarToken(usuarioId);
            const evento = await crearEventoPrueba(usuarioId);

            const respuesta = await request(app)
                .patch(`/api/eventos/${evento.id}/cancelar`)
                .set("Authorization", `Bearer ${token}`);

            expect(respuesta.status).toBe(200);
            expect(respuesta.body.evento.estado).toBe("cancelado");

            const estado = await obtenerEstadoEvento(evento.id);

            expect(estado).toBe("cancelado");
        });

        it("no debe permitir cancelar nuevamente un evento", async () => {

            const usuarioId = await crearUsuarioPrueba();
            const token = generarToken(usuarioId);
            const evento = await crearEventoPrueba(usuarioId);

            // Primera cancelación.
            const primeraRespuesta = await request(app)
                .patch(`/api/eventos/${evento.id}/cancelar`)
                .set("Authorization", `Bearer ${token}`);

            expect(primeraRespuesta.status).toBe(200);

            // Segunda cancelación.
            const segundaRespuesta = await request(app)
                .patch(`/api/eventos/${evento.id}/cancelar`)
                .set("Authorization", `Bearer ${token}`);

            expect(segundaRespuesta.status).toBe(400);

            expect(segundaRespuesta.body.message).toBe(
                "No se puede cancelar un evento ya cancelado o finalizado."
            );

            const estado = await obtenerEstadoEvento(evento.id);

            expect(estado).toBe("cancelado");
        });
    });
});
