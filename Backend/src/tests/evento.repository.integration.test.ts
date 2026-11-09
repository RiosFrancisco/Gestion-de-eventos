
import {
    describe,
    it,
    expect,
    afterEach
} from "vitest";

import { randomUUID } from "node:crypto";
import { pool } from "../config/database";

import {
    createEvento,
    getEventoById,
    updateEvento,
    cancelarEvento
} from "../repositories/evento.repository";

import type { CrearEvento } from "../models/evento.model";

describe("Repositorio de eventos - Integración", () => {

    const usuariosCreados: number[] = [];
    const eventosCreados: number[] = [];

    // Datos base reutilizables para las pruebas.
    function datosEvento(categoriaId: number): CrearEvento {
        return {
            categoria_id: categoriaId,
            nombre: "Evento de integración",
            descripcion: "Prueba con PostgreSQL",
            fecha: "2099-12-31",
            hora: "20:00",
            ubicacion: "Bahía Blanca"
        };
    }

    // Prepara los registros necesarios para cada test.
    async function crearEventoPrueba() {

        const categoria = await pool.query(
            "SELECT id FROM categorias_evento LIMIT 1"
        );

        const rol = await pool.query(
            "SELECT id FROM roles WHERE nombre = $1",
            ["creador"]
        );

        if (!categoria.rows[0] || !rol.rows[0]) {
            throw new Error(
                "Faltan categorías o el rol creador en la base de testing"
            );
        }

        const usuario = await pool.query(
            `INSERT INTO usuarios
                (nombre, email, password, rol_id)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [
                "Usuario Test",
                `test-${randomUUID()}@example.test`,
                "hash-solo-para-test",
                rol.rows[0].id
            ]
        );

        const usuarioId = Number(usuario.rows[0].id);
        usuariosCreados.push(usuarioId);

        const evento = await createEvento(
            usuarioId,
            datosEvento(Number(categoria.rows[0].id))
        );

        eventosCreados.push(evento.id);

        return evento;
    }

    // Limpieza después de cada prueba.
    afterEach(async () => {

        try {
            for (const eventoId of eventosCreados) {
                await pool.query(
                    "DELETE FROM eventos WHERE id = $1",
                    [eventoId]
                );
            }
        } finally {
            try {
                for (const usuarioId of usuariosCreados) {
                    await pool.query(
                        "DELETE FROM usuarios WHERE id = $1",
                        [usuarioId]
                    );
                }
            } finally {
                eventosCreados.length = 0;
                usuariosCreados.length = 0;
            }
        }
    });

    describe("createEvento", () => {

        it("debe guardar un evento en PostgreSQL", async () => {

            const evento = await crearEventoPrueba();

            expect(evento.id).toBeGreaterThan(0);
            expect(evento.nombre).toBe("Evento de integración");
            expect(evento.estado).toBe("publicado");

            const resultado = await pool.query(
                "SELECT id FROM eventos WHERE id = $1",
                [evento.id]
            );

            expect(resultado.rows).toHaveLength(1);
        });
    });

    describe("getEventoById", () => {

        it("debe recuperar un evento existente", async () => {

            const evento = await crearEventoPrueba();

            const resultado = await getEventoById(evento.id);

            expect(resultado).toBeDefined();
            expect(resultado?.id).toBe(evento.id);
            expect(resultado?.nombre).toBe(evento.nombre);
        });

        it("debe devolver undefined si el evento no existe", async () => {

            const resultado = await getEventoById(-1);

            expect(resultado).toBeUndefined();
        });
    });

    describe("updateEvento", () => {

        it("debe actualizar un evento sin modificar otros campos", async () => {

            const evento = await crearEventoPrueba();

            await updateEvento(evento.id, {
                nombre: "Evento actualizado"
            });

            const resultado = await getEventoById(evento.id);

            expect(resultado?.nombre).toBe("Evento actualizado");
            expect(resultado?.ubicacion).toBe(evento.ubicacion);
            expect(resultado?.descripcion).toBe(evento.descripcion);
        });

        it("debe devolver undefined si el evento no existe", async () => {
            const resultado = await updateEvento(-1, {
                nombre: "Evento actualizado"
            });

            expect(resultado).toBeUndefined();
        });
    });

    describe("cancelarEvento", () => {

        it("debe cambiar el estado del evento a cancelado", async () => {

            const evento = await crearEventoPrueba();

            await cancelarEvento(evento.id);

            const resultado = await getEventoById(evento.id);

            expect(resultado?.estado).toBe("cancelado");
        });
        
        it("debe devolver undefined si el evento no existe", async () => {
            const resultado = await cancelarEvento(-1);

            expect(resultado).toBeUndefined();
        });
    });
});
