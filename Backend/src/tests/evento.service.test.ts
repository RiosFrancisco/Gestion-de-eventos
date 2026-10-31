import { beforeEach, describe, expect, it, vi } from "vitest";
import { 
    cancelacionEvento,
    crearEvento
} from "../services/evento.service";
import {
    getEventoModificable,
    cancelarEvento
} from "../repositories/evento.repository";
import { ROLES } from "../utils/roles";
import type { Evento, CrearEvento } from "../models/evento.model";


//simulamos funciones de repositorio
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

//creamos evento de prueba
const eventoPublicado = {
    id: 1,
    creador_id: 10,
    categoria_id: 1,
    nombre: "Evento de prueba",
    fecha: "2030-12-20",
    hora: "20:00:00",
    ubicacion: "Bahia Blanca",
    estado: "publicado",
    created_at: new Date()
} as unknown as Evento;

const eventoCancelado = {
    ...eventoPublicado,
    estado: "cancelado"
} as Evento;

const mockGetEvento = vi.mocked(getEventoModificable);
const mockCancelarEvento = vi.mocked(cancelarEvento);

//tests relacionados a cancelacion de eventos
describe("cancelacionEvento", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockGetEvento.mockResolvedValue(eventoPublicado);
        mockCancelarEvento.mockResolvedValue(eventoCancelado);
    });

    it("Debe permitir que el creador cancele su evento", async () => {
        const resultado = await cancelacionEvento(
            1,
            10,
            ROLES.creador
        );

        expect(mockCancelarEvento).toHaveBeenCalledWith(1);
        expect(resultado).toEqual(eventoCancelado);
    });

    it("Debe permitir que un administrador cancele cualquier evento.", async () => {
        const resultado = await cancelacionEvento(
            1,
            99,
            ROLES.admin
        );

        expect(mockCancelarEvento).toHaveBeenCalledWith(1);
        expect(resultado).toEqual(eventoCancelado);
    });

    it("No debe permitir que otro usuario cancele el evento", async () => {
        
        await expect(
            cancelacionEvento(1, 99, ROLES.usuario)
        ).rejects.toThrow(
            "No tiene permisos para realizar esta accion."
        );

        expect(mockCancelarEvento).not.toHaveBeenCalled();
    });

    it("Debe rechazar la cancelacion si el evento no existe", async () => {
        mockGetEvento.mockResolvedValueOnce(undefined);

        await expect(
            cancelacionEvento(1, 10, ROLES.creador)
        ).rejects.toThrow("Evento no encontrado");

        expect(mockCancelarEvento).not.toHaveBeenCalled();
    });

    it("No debe permitir cancelar un evento ya cancelado.", async () => {
        mockGetEvento.mockResolvedValueOnce({
            ...eventoPublicado,
            estado: "cancelado"
        } as Evento);

        await expect(
            cancelacionEvento(1, 10, ROLES.creador)
        ).rejects.toThrow("No se puede cancelar un evento ya cancelado o finalizado.");

        expect(mockCancelarEvento).not.toHaveBeenCalled();
    });

    it("No debe permitir cancelar un evento finalizado", async () => {
        mockGetEvento.mockResolvedValueOnce({
            ...eventoPublicado,
            estado: "finalizado"
        } as Evento);

        await expect(
            cancelacionEvento(1, 10, ROLES.creador)
        ).rejects.toThrow("No se puede cancelar un evento ya cancelado o finalizado.");

        expect(mockCancelarEvento).not.toHaveBeenCalled();
    });
});

//tests relacionador a creacion de eventos
describe("crearEvento", () => {

    const datosEvento: CrearEvento = {
        categoria_id: 1,
        nombre: "Evento de prueba",
        descripcion: "Descripcion de evento",
        fecha: "2030-12-15",
        hora: "15:00",
        ubicacion: "Bahia Blanca"
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("Debe crear un evento cuando los datos son validos", async () => {
        
        const eventoCreado = {
            ...eventoPublicado,
            creador_id: 10
        };

        const mockCreateEvento = vi.mocked(
            await import("../repositories/evento.repository")
        ).createEvento;

        const mockGetCategoria = vi.mocked(
            await import("../repositories/categorias.repository")
        ).getCategoriasById;

        mockGetCategoria.mockResolvedValue({ id: 1 } as any);
        mockCreateEvento.mockResolvedValue(eventoCreado);

        const resultado = await crearEvento(10, datosEvento);

        expect(mockGetCategoria).toHaveBeenCalledWith(1);
        expect(mockCreateEvento).toHaveBeenCalledWith(10, datosEvento);
        expect(resultado).toEqual(eventoCreado);
    });

    it("No debe crear un evento con fecha pasada", async () => {

        await expect(
            crearEvento(10, {
                ...datosEvento,
                fecha: "2020-01-01"
            })
        ).rejects.toThrow("La fecha no puede ser pasada");

        expect(
            vi.mocked(
                (await import("../repositories/evento.repository")).createEvento
            )
        ).not.toHaveBeenCalled();
    });

    it("No debe crear un evento si la categoria no existe", async () => {

        const mockGetCategoria = vi.mocked(
            (await import("../repositories/categorias.repository")).getCategoriasById
        );

        mockGetCategoria.mockResolvedValue(undefined);

        await expect(
            crearEvento(10, datosEvento)
        ).rejects.toThrow("La categoria seleccionada no existe");

        expect(
            vi.mocked(
                (await import("../repositories/evento.repository")).createEvento
            )
        ).not.toHaveBeenCalled();
    });
});