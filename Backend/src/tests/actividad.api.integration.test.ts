
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
import { createActividad } from "../repositories/actividad.repository";
import { ROLES } from "../utils/roles";
import type { CrearActividad } from "../models/actividad.model";


describe("API de actividades - Integración", () => {

    const usuariosCreados: number[] = [];


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

    async function crearUsuarioPrueba(): Promise<number> {
        const resultado = await pool.query<{ id: string }>(
            `INSERT INTO usuarios
                (nombre, email, password, rol_id)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [
                "Creador Test",
                `test-${randomUUID()}@example.test`,
                "hash-solo-para-test",
                ROLES.creador
            ]
        );

        const usuarioId = Number(resultado.rows[0].id);

        usuariosCreados.push(usuarioId);

        return usuarioId;
    }

    function generarToken(usuarioId: number): string {
        const secret = process.env.JWT_SECRET;

        if (!secret) {
            throw new Error("JWT_SECRET no está configurado");
        }

        return jwt.sign(
            {
                id: usuarioId,
                rol_id: ROLES.creador
            },
            secret,
            { expiresIn: "1h" }
        );
    }

    async function crearEventoPrueba(creadorId: number) {
        const categoriaId = await obtenerCategoriaId();

        return createEvento(creadorId, {
            categoria_id: categoriaId,
            nombre: "Evento de prueba",
            descripcion: "Evento para probar actividades",
            fecha: "2099-12-31",
            hora: "18:00",
            ubicacion: "Bahía Blanca"
        });
    }

    function datosActividad(eventoId: number): CrearActividad {
        return {
            evento_id: eventoId,
            nombre: "Taller TypeScript",
            descripcion: "Introducción a TypeScript",
            fecha: "2099-12-31",
            hora: "20:00",
            capacidad: 30
        };
    }

    async function crearEscenario() {
        const usuarioId = await crearUsuarioPrueba();
        const evento = await crearEventoPrueba(usuarioId);
        const token = generarToken(usuarioId);

        return { usuarioId, evento, token };
    }

    async function crearActividadPrueba(eventoId: number) {
        return createActividad(datosActividad(eventoId));
    }

    async function consultarActividad(id: number) {
        const resultado = await pool.query<{
            nombre: string;
            estado: string;
            capacidad: number | null;
        }>(
            `SELECT nombre, estado, capacidad
             FROM actividades
             WHERE id = $1`,
            [id]
        );

        return resultado.rows[0];
    }


    afterEach(async () => {
        if (usuariosCreados.length === 0) {
            return;
        }

        try {
            await pool.query(
                `DELETE FROM actividades
                 WHERE evento_id IN (
                     SELECT id FROM eventos
                     WHERE creador_id = ANY($1::bigint[])
                 )`,
                [usuariosCreados]
            );

            await pool.query(
                `DELETE FROM eventos
                 WHERE creador_id = ANY($1::bigint[])`,
                [usuariosCreados]
            );

            await pool.query(
                `DELETE FROM usuarios
                 WHERE id = ANY($1::bigint[])`,
                [usuariosCreados]
            );
        } finally {
            usuariosCreados.length = 0;
        }
    });


    describe("POST /api/actividades", () => {

        it("debe crear y guardar una actividad", async () => {
            const { evento, token } = await crearEscenario();
            const datos = datosActividad(evento.id);

            const respuesta = await request(app)
                .post("/api/actividades")
                .set("Authorization", `Bearer ${token}`)
                .send(datos);

            expect(respuesta.status).toBe(201);

            expect(respuesta.body.actividad).toMatchObject({
                evento_id: evento.id,
                nombre: datos.nombre,
                estado: "publicado"
            });

            const actividadId = respuesta.body.actividad.id;

            const persistida = await consultarActividad(actividadId);

            expect(persistida).toBeDefined();
            expect(persistida.nombre).toBe(datos.nombre);
            expect(persistida.estado).toBe("publicado");
        });

        it("no debe crear actividades en eventos finalizados", async () => {
            const { evento, token } = await crearEscenario();

            await pool.query(
                `UPDATE eventos
                 SET estado = 'finalizado'
                 WHERE id = $1`,
                [evento.id]
            );

            const respuesta = await request(app)
                .post("/api/actividades")
                .set("Authorization", `Bearer ${token}`)
                .send(datosActividad(evento.id));

            expect(respuesta.status).toBe(400);

            expect(respuesta.body.message).toBe(
                "No se pueden modificar actividades de un evento no publicado"
            );

            const resultado = await pool.query(
                "SELECT id FROM actividades WHERE evento_id = $1",
                [evento.id]
            );

            expect(resultado.rows).toHaveLength(0);
        });
    });


    describe("GET /api/actividades/evento/:eventoId", () => {

        it("debe listar las actividades del evento", async () => {
            const { evento } = await crearEscenario();

            const actividad = await crearActividadPrueba(evento.id);

            const respuesta = await request(app)
                .get(`/api/actividades/evento/${evento.id}`);

            expect(respuesta.status).toBe(200);

            expect(respuesta.body.actividades).toHaveLength(1);

            expect(respuesta.body.actividades[0]).toMatchObject({
                id: actividad.id,
                evento_id: evento.id,
                nombre: actividad.nombre
            });
        });
    });


    describe("PATCH /api/actividades/:id", () => {

        it("debe actualizar y guardar los cambios", async () => {
            const { evento, token } = await crearEscenario();
            const actividad = await crearActividadPrueba(evento.id);

            const respuesta = await request(app)
                .patch(`/api/actividades/${actividad.id}`)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    nombre: "Taller actualizado",
                    capacidad: 50
                });

            expect(respuesta.status).toBe(200);

            expect(respuesta.body.actividad).toMatchObject({
                nombre: "Taller actualizado",
                capacidad: 50
            });

            const persistida = await consultarActividad(actividad.id);

            expect(persistida).toMatchObject({
                nombre: "Taller actualizado",
                capacidad: 50,
                estado: "publicado"
            });
        });

        it("no debe modificar actividades de eventos ajenos", async () => {
            const { evento } = await crearEscenario();

            const actividad = await crearActividadPrueba(evento.id);

            const otroUsuarioId = await crearUsuarioPrueba();
            const tokenAjeno = generarToken(otroUsuarioId);

            const respuesta = await request(app)
                .patch(`/api/actividades/${actividad.id}`)
                .set("Authorization", `Bearer ${tokenAjeno}`)
                .send({
                    nombre: "Cambio no permitido"
                });

            expect(respuesta.status).toBe(400);

            expect(respuesta.body.message).toBe(
                "No tiene permisos para modificar este evento"
            );

            const persistida = await consultarActividad(actividad.id);

            expect(persistida.nombre).toBe(actividad.nombre);
        });

        it("no debe actualizar una actividad cancelada", async () => {
            const { evento, token } = await crearEscenario();

            const actividad = await crearActividadPrueba(evento.id);

            await pool.query(
                `UPDATE actividades
                 SET estado = 'cancelado'
                 WHERE id = $1`,
                [actividad.id]
            );

            const respuesta = await request(app)
                .patch(`/api/actividades/${actividad.id}`)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    nombre: "Nuevo nombre"
                });

            expect(respuesta.status).toBe(400);

            expect(respuesta.body.message).toBe(
                "No se puede modificar una actividad cancelada o finalizada"
            );

            const persistida = await consultarActividad(actividad.id);

            expect(persistida.nombre).toBe(actividad.nombre);
            expect(persistida.estado).toBe("cancelado");
        });
    });


    describe("PATCH /api/actividades/:id/cancelar", () => {

        it("debe cancelar una actividad", async () => {
            const { evento, token } = await crearEscenario();

            const actividad = await crearActividadPrueba(evento.id);

            const respuesta = await request(app)
                .patch(`/api/actividades/${actividad.id}/cancelar`)
                .set("Authorization", `Bearer ${token}`);

            expect(respuesta.status).toBe(200);
            expect(respuesta.body.actividad.estado).toBe("cancelado");

            const persistida = await consultarActividad(actividad.id);

            expect(persistida.estado).toBe("cancelado");
        });
    });
});
