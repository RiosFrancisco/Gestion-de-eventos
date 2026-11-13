
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
    cancelacionEvento,
    crearEvento
} from "../services/evento.service";

import {
    createEvento,
    getEventoModificable,
    cancelarEvento
} from "../repositories/evento.repository";

import { getCategoriasById } from "../repositories/categorias.repository";
import { ROLES } from "../utils/roles";

import type {
    Evento,
    CrearEvento
} from "../models/evento.model";

// Simulamos las dependencias del servicio.
vi.mock("../repositories/evento.repository", () => ({
    createEvento: vi.fn(),
    getAllEventos: vi.fn(),
    getEventoById: vi.fn(),
    getEventoModificable: vi.fn(),
    updateEvento: vi.fn(),
    cancelarEvento: vi.fn(),
    activarEvento: vi.fn()
}));

vi.mock("../repositories/categorias.repository", () => ({
    getCategoriasById: vi.fn()
}));

// Referencias tipadas a los mocks.
const mockCreateEvento = vi.mocked(createEvento);
const mockGetEvento = vi.mocked(getEventoModificable);
const mockCancelarEvento = vi.mocked(cancelarEvento);
const mockGetCategoria = vi.mocked(getCategoriasById);

// Datos de prueba compartidos.
const eventoPublicado: Evento = {
    id: 1,
    creador_id: 10,
    categoria_id: 1,
    nombre: "Evento de prueba",
    descripcion: "Descripción del evento",
    fecha: "2030-12-20",
    hora: "20:00:00",
    ubicacion: "Bahia Blanca",
    estado: "publicado",
    created_at: new Date()
};

const eventoCancelado: Evento = {
    ...eventoPublicado,
    estado: "cancelado"
};

const datosEvento: CrearEvento = {
    categoria_id: 1,
    nombre: "Evento de prueba",
    descripcion: "Descripcion de evento",
    fecha: "2030-12-15",
    hora: "15:00",
    ubicacion: "Bahia Blanca"
};

// Reiniciamos los mocks antes de cada test.
beforeEach(() => {
    vi.resetAllMocks();
});


describe("cancelacionEvento", () => {

    beforeEach(() => {
        mockGetEvento.mockResolvedValue(eventoPublicado);
        mockCancelarEvento.mockResolvedValue(eventoCancelado);
    });

    it("debe permitir que el creador cancele su evento", async () => {

        const resultado = await cancelacionEvento(
            1,
            10,
            ROLES.creador
        );

        expect(mockCancelarEvento).toHaveBeenCalledWith(1);
        expect(resultado).toEqual(eventoCancelado);
    });

    it("debe permitir que un administrador cancele cualquier evento", async () => {

        const resultado = await cancelacionEvento(
            1,
            99,
            ROLES.admin
        );

        expect(mockCancelarEvento).toHaveBeenCalledWith(1);
        expect(resultado).toEqual(eventoCancelado);
    });

    it("no debe permitir cancelar eventos ajenos", async () => {

        await expect(
            cancelacionEvento(1, 99, ROLES.usuario)
        ).rejects.toThrow(
            "No tiene permisos para realizar esta accion."
        );

        expect(mockCancelarEvento).not.toHaveBeenCalled();
    });

    it("debe rechazar la cancelación de un evento inexistente", async () => {

        mockGetEvento.mockResolvedValueOnce(undefined);

        await expect(
            cancelacionEvento(1, 10, ROLES.creador)
        ).rejects.toThrow("Evento no encontrado");

        expect(mockCancelarEvento).not.toHaveBeenCalled();
    });

    it("no debe permitir cancelar un evento ya cancelado", async () => {

        mockGetEvento.mockResolvedValueOnce(eventoCancelado);

        await expect(
            cancelacionEvento(1, 10, ROLES.creador)
        ).rejects.toThrow(
            "No se puede cancelar un evento ya cancelado o finalizado."
        );

        expect(mockCancelarEvento).not.toHaveBeenCalled();
    });

    it("no debe permitir cancelar un evento finalizado", async () => {

        const eventoFinalizado: Evento = {
            ...eventoPublicado,
            estado: "finalizado"
        };

        mockGetEvento.mockResolvedValueOnce(eventoFinalizado);

        await expect(
            cancelacionEvento(1, 10, ROLES.creador)
        ).rejects.toThrow(
            "No se puede cancelar un evento ya cancelado o finalizado."
        );

        expect(mockCancelarEvento).not.toHaveBeenCalled();
    });
});


describe("crearEvento", () => {

    beforeEach(() => {
        mockGetCategoria.mockResolvedValue({
            id: 1,
            nombre: "Tecnología"
        });

        mockCreateEvento.mockResolvedValue(eventoPublicado);
    });

    it("debe crear un evento cuando los datos son válidos", async () => {

        const resultado = await crearEvento(10, datosEvento);

        expect(mockGetCategoria).toHaveBeenCalledWith(1);
        expect(mockCreateEvento).toHaveBeenCalledWith(
            10,
            datosEvento
        );

        expect(resultado).toEqual(eventoPublicado);
    });

    it("no debe crear un evento con fecha pasada", async () => {

        await expect(
            crearEvento(10, {
                ...datosEvento,
                fecha: "2020-01-01"
            })
        ).rejects.toThrow("La fecha no puede ser pasada");

        expect(mockGetCategoria).not.toHaveBeenCalled();
        expect(mockCreateEvento).not.toHaveBeenCalled();
    });

    it("no debe crear un evento si la categoría no existe", async () => {

        mockGetCategoria.mockResolvedValueOnce(undefined);

        await expect(
            crearEvento(10, datosEvento)
        ).rejects.toThrow(
            "La categoria seleccionada no existe"
        );

        expect(mockGetCategoria).toHaveBeenCalledWith(1);
        expect(mockCreateEvento).not.toHaveBeenCalled();
    });
});
