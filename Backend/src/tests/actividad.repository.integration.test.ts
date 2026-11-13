
import {
    describe,
    it,
    expect,
    afterEach
} from "vitest";
import { randomUUID } from "node:crypto";
import { pool } from "../config/database";
import {
    createActividad,
    getActividadById,
    getActividadesByEventoId,
    updateActividad,
    cancelarActividad
} from "../repositories/actividad.repository";
import type { CrearActividad } from "../models/actividad.model";

describe("Repositorio de actividades - Integración", () => {

    const usuariosCreados: number[] = [];

    async function crearEventoPrueba(): Promise<number> {

        const [roles, categorias] = await Promise.all([
            pool.query<{ id: number }>(
                "SELECT id FROM roles WHERE nombre = $1",
                ["creador"]
            ),
            pool.query<{ id: number }>(
                "SELECT id FROM categorias_evento ORDER BY id LIMIT 1"
            )
        ]);

        const rol = roles.rows[0];
        const categoria = categorias.rows[0];

        if (!rol || !categoria) {
            throw new Error(
                "Faltan roles o categorías en la base de testing"
            );
        }

        const usuario = await pool.query<{ id: string }>(
            `INSERT INTO usuarios
                (nombre, email, password, rol_id)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [
                "Usuario Test",
                `test-${randomUUID()}@example.test`,
                "hash-solo-para-test",
                rol.id
            ]
        );

        const usuarioId = Number(usuario.rows[0].id);

        usuariosCreados.push(usuarioId);

        const evento = await pool.query<{ id: string }>(
            `INSERT INTO eventos
                (creador_id, categoria_id, nombre,
                 descripcion, fecha, hora, ubicacion)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id`,
            [
                usuarioId,
                categoria.id,
                "Evento de prueba",
                "Evento para probar actividades",
                "2099-12-31",
                "18:00",
                "Bahía Blanca"
            ]
        );

        return Number(evento.rows[0].id);
    }

    function datosActividad(eventoId: number): CrearActividad {
        return {
            evento_id: eventoId,
            nombre: "Taller de TypeScript",
            descripcion: "Introducción a TypeScript",
            fecha: "2099-12-31",
            hora: "20:00",
            capacidad: 30
        };
    }

    async function crearActividadPrueba() {
        const eventoId = await crearEventoPrueba();

        return createActividad(datosActividad(eventoId));
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

    // ---------------------------------------------
    // CREACIÓN
    // ---------------------------------------------

    describe("createActividad", () => {

        it("debe insertar una actividad en PostgreSQL", async () => {

            const eventoId = await crearEventoPrueba();
            const datos = datosActividad(eventoId);

            const actividad = await createActividad(datos);

            expect(actividad.id).toBeGreaterThan(0);

            expect(actividad).toMatchObject({
                evento_id: eventoId,
                nombre: datos.nombre,
                capacidad: 30,
                estado: "publicado"
            });

            const resultado = await pool.query<{
                nombre: string;
                estado: string;
            }>(
                `SELECT nombre, estado
                 FROM actividades
                 WHERE id = $1`,
                [actividad.id]
            );

            expect(resultado.rows).toHaveLength(1);
            expect(resultado.rows[0].nombre).toBe(datos.nombre);
            expect(resultado.rows[0].estado).toBe("publicado");
        });
    });


    describe("getActividadesByEventoId", () => {

        it("debe listar las actividades de un evento", async () => {

            const eventoId = await crearEventoPrueba();

            const primera = await createActividad(
                datosActividad(eventoId)
            );

            const segunda = await createActividad({
                ...datosActividad(eventoId),
                nombre: "Taller de PostgreSQL",
                hora: "21:00"
            });

            const resultado = await getActividadesByEventoId(
                eventoId
            );

            expect(resultado).toHaveLength(2);

            expect(resultado.map(actividad => actividad.id))
                .toEqual([primera.id, segunda.id]);
        });

        it("debe devolver un arreglo vacío si no hay actividades", async () => {

            const eventoId = await crearEventoPrueba();

            const resultado = await getActividadesByEventoId(
                eventoId
            );

            expect(resultado).toEqual([]);
        });
    });


    describe("getActividadById", () => {

        it("debe recuperar una actividad existente", async () => {

            const actividad = await crearActividadPrueba();

            const resultado = await getActividadById(
                actividad.id
            );

            expect(resultado).toBeDefined();

            expect(resultado).toMatchObject({
                id: actividad.id,
                evento_id: actividad.evento_id,
                nombre: actividad.nombre
            });

            expect(typeof resultado?.id).toBe("number");
            expect(typeof resultado?.evento_id).toBe("number");
        });

        it("debe devolver undefined si la actividad no existe", async () => {

            const resultado = await getActividadById(-1);

            expect(resultado).toBeUndefined();
        });
    });


    describe("updateActividad", () => {

        it("debe actualizar únicamente los campos indicados", async () => {

            const actividad = await crearActividadPrueba();

            const actualizada = await updateActividad(
                actividad.id,
                {
                    nombre: "Taller actualizado",
                    capacidad: 50
                }
            );

            expect(actualizada?.nombre).toBe("Taller actualizado");
            expect(actualizada?.capacidad).toBe(50);

            const resultado = await getActividadById(
                actividad.id
            );

            expect(resultado).toMatchObject({
                nombre: "Taller actualizado",
                capacidad: 50,
                descripcion: actividad.descripcion,
                estado: "publicado"
            });

            expect(resultado?.fecha).toBe(actividad.fecha);
            expect(resultado?.hora).toBe(actividad.hora);
        });

        it("debe devolver undefined si la actividad no existe", async () => {

            const resultado = await updateActividad(-1, {
                nombre: "Actualización"
            });

            expect(resultado).toBeUndefined();
        });
    });


    describe("cancelarActividad", () => {

        it("debe cambiar el estado a cancelado", async () => {

            const actividad = await crearActividadPrueba();

            const cancelada = await cancelarActividad(
                actividad.id
            );

            expect(cancelada?.estado).toBe("cancelado");

            const resultado = await getActividadById(
                actividad.id
            );

            expect(resultado?.estado).toBe("cancelado");
        });

        it("no debe cancelar nuevamente una actividad cancelada", async () => {

            const actividad = await crearActividadPrueba();

            await cancelarActividad(actividad.id);

            const resultado = await cancelarActividad(
                actividad.id
            );

            expect(resultado).toBeUndefined();

            const actividadPersistida = await getActividadById(
                actividad.id
            );

            expect(actividadPersistida?.estado).toBe("cancelado");
        });

        it("debe devolver undefined si la actividad no existe", async () => {

            const resultado = await cancelarActividad(-1);

            expect(resultado).toBeUndefined();
        });
    });
});
