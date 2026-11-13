
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    listarActividadesPorEvento,
    obtenerActividadPorId,
    crearActividad,
    actualizarActividad,
    cancelacionActividad
} from "../services/actividad.service"
import {
    getActividadesByEventoId,
    getActividadById,
    createActividad,
    updateActividad,
    cancelarActividad
} from "../repositories/actividad.repository";
import {
    getEventoById,
    getEventoModificable
} from "../repositories/evento.repository";
import { ROLES } from "../utils/roles";
import type {
    Actividad,
    CrearActividad
} from "../models/actividad.model";
import type { Evento } from "../models/evento.model";

vi.mock("../repositories/actividad.repository", () => ({
    getActividadesByEventoId: vi.fn(),
    getActividadById: vi.fn(),
    createActividad: vi.fn(),
    updateActividad: vi.fn(),
    cancelarActividad: vi.fn()
}));

vi.mock("../repositories/evento.repository", () => ({
    getEventoById: vi.fn(),
    getEventoModificable: vi.fn()
}));

const mockListarActividades = vi.mocked(getActividadesByEventoId);
const mockGetActividad = vi.mocked(getActividadById);
const mockCrearActividad = vi.mocked(createActividad);
const mockActualizarActividad = vi.mocked(updateActividad);
const mockCancelarActividad = vi.mocked(cancelarActividad);

const mockGetEvento = vi.mocked(getEventoById);
const mockGetEventoModificable = vi.mocked(getEventoModificable);


const eventoPublicado: Evento = {
    id: 1,
    creador_id: 10,
    categoria_id: 1,
    nombre: "Evento tecnológico",
    descripcion: "Evento de programación",
    fecha: "2099-12-31",
    hora: "18:00:00",
    ubicacion: "Bahía Blanca",
    estado: "publicado",
    created_at: new Date()
};

const actividadPublicada: Actividad = {
    id: 5,
    evento_id: 1,
    nombre: "Taller de programación",
    descripcion: "Introducción a TypeScript",
    fecha: "2099-12-31",
    hora: "20:00:00",
    capacidad: 30,
    estado: "publicado",
    created_at: new Date()
};

const datosActividad: CrearActividad = {
    evento_id: 1,
    nombre: "Taller de programación",
    descripcion: "Introducción a TypeScript",
    fecha: "2099-12-31",
    hora: "20:00",
    capacidad: 30
};


beforeEach(() => {
    vi.resetAllMocks();
});


describe("listarActividadesPorEvento", () => {

    it("debe devolver las actividades de un evento existente", async () => {
        mockGetEvento.mockResolvedValue(eventoPublicado);
        mockListarActividades.mockResolvedValue([actividadPublicada]);

        const resultado = await listarActividadesPorEvento(1);

        expect(mockGetEvento).toHaveBeenCalledWith(1);
        expect(mockListarActividades).toHaveBeenCalledWith(1);
        expect(resultado).toEqual([actividadPublicada]);
    });

    it("debe rechazar la consulta si el evento no existe", async () => {
        mockGetEvento.mockResolvedValue(undefined);

        await expect(
            listarActividadesPorEvento(1)
        ).rejects.toThrow("Evento no encontrado");

        expect(mockListarActividades).not.toHaveBeenCalled();
    });
});

describe("obtenerActividadPorId", () => {

    it("debe devolver una actividad existente", async () => {
        mockGetActividad.mockResolvedValue(actividadPublicada);

        const resultado = await obtenerActividadPorId(5);

        expect(mockGetActividad).toHaveBeenCalledWith(5);
        expect(resultado).toEqual(actividadPublicada);
    });

    it("debe rechazar una actividad inexistente", async () => {
        mockGetActividad.mockResolvedValue(undefined);

        await expect(
            obtenerActividadPorId(5)
        ).rejects.toThrow("Actividad no encontrada");
    });
});


describe("crearActividad", () => {

    beforeEach(() => {
        mockGetEventoModificable.mockResolvedValue(eventoPublicado);
        mockCrearActividad.mockResolvedValue(actividadPublicada);
    });

    it("debe permitir al propietario crear una actividad", async () => {
        const resultado = await crearActividad(
            10,
            ROLES.creador,
            datosActividad
        );

        expect(mockCrearActividad).toHaveBeenCalledWith(datosActividad);
        expect(resultado).toEqual(actividadPublicada);
    });

    it("debe permitir a un administrador crear una actividad", async () => {
        await crearActividad(
            99,
            ROLES.admin,
            datosActividad
        );

        expect(mockCrearActividad).toHaveBeenCalledOnce();
    });

    it("no debe permitir crear actividades en eventos ajenos", async () => {
        await expect(
            crearActividad(99, ROLES.creador, datosActividad)
        ).rejects.toThrow(
            "No tiene permisos para modificar este evento"
        );

        expect(mockCrearActividad).not.toHaveBeenCalled();
    });

    it("no debe permitir crear actividades en eventos cancelados", async () => {
        mockGetEventoModificable.mockResolvedValue({
            ...eventoPublicado,
            estado: "cancelado"
        });

        await expect(
            crearActividad(10, ROLES.creador, datosActividad)
        ).rejects.toThrow(
            "No se pueden modificar actividades de un evento no publicado"
        );

        expect(mockCrearActividad).not.toHaveBeenCalled();
    });

    it("no debe permitir crear actividades con fecha pasada", async () => {
        await expect(
            crearActividad(10, ROLES.creador, {
                ...datosActividad,
                fecha: "2020-01-01"
            })
        ).rejects.toThrow(
            "La fecha y hora de la actividad deben ser futuras"
        );

        expect(mockCrearActividad).not.toHaveBeenCalled();
    });

    it("no debe permitir crear actividades si el evento no existe", async () => {
        mockGetEventoModificable.mockResolvedValueOnce(undefined);

        await expect(
            crearActividad(10, ROLES.creador, datosActividad)
        ).rejects.toThrow("Evento no encontrado");

        expect(mockCrearActividad).not.toHaveBeenCalled();
    });

    it("no debe permitir crear actividades en eventos finalizados", async () => {
        mockGetEventoModificable.mockResolvedValueOnce({
            ...eventoPublicado,
            estado: "finalizado"
        });

        await expect(
            crearActividad(10, ROLES.creador, datosActividad)
        ).rejects.toThrow(
            "No se pueden modificar actividades de un evento no publicado"
        );

        expect(mockCrearActividad).not.toHaveBeenCalled();
    });
});


describe("actualizarActividad", () => {

    beforeEach(() => {
        mockGetActividad.mockResolvedValue(actividadPublicada);
        mockGetEventoModificable.mockResolvedValue(eventoPublicado);

        mockActualizarActividad.mockResolvedValue({
            ...actividadPublicada,
            nombre: "Taller actualizado"
        });
    });

    it("debe permitir actualizar una actividad propia", async () => {
        const cambios = { nombre: "Taller actualizado" };

        const resultado = await actualizarActividad(
            5,
            10,
            ROLES.creador,
            cambios
        );

        expect(mockActualizarActividad).toHaveBeenCalledWith(
            5,
            cambios
        );

        expect(resultado.nombre).toBe("Taller actualizado");
    });

    it("no debe permitir actualizar una actividad ajena", async () => {
        await expect(
            actualizarActividad(
                5,
                99,
                ROLES.creador,
                { nombre: "Cambio inválido" }
            )
        ).rejects.toThrow(
            "No tiene permisos para modificar este evento"
        );

        expect(mockActualizarActividad).not.toHaveBeenCalled();
    });

    it("no debe permitir actualizar una actividad cancelada", async () => {
        mockGetActividad.mockResolvedValue({
            ...actividadPublicada,
            estado: "cancelado"
        });

        await expect(
            actualizarActividad(
                5,
                10,
                ROLES.creador,
                { nombre: "Nuevo nombre" }
            )
        ).rejects.toThrow(
            "No se puede modificar una actividad cancelada o finalizada"
        );

        expect(mockActualizarActividad).not.toHaveBeenCalled();
    });

    it("no debe aceptar una actualización vacía", async () => {
        await expect(
            actualizarActividad(5, 10, ROLES.creador, {})
        ).rejects.toThrow(
            "No se proporcionaron campos para actualizar"
        );

        expect(mockActualizarActividad).not.toHaveBeenCalled();
    });

    it("no debe permitir actualizar a una fecha pasada", async () => {
        await expect(
            actualizarActividad(
                5,
                10,
                ROLES.creador,
                { fecha: "2020-01-01" }
            )
        ).rejects.toThrow(
            "La fecha y hora de la actividad deben ser futuras"
        );

        expect(mockActualizarActividad).not.toHaveBeenCalled();
    });

    it("no debe permitir actualizar una actividad inexistente", async () => {
        mockGetActividad.mockResolvedValueOnce(undefined);

        await expect(
            actualizarActividad(
                5,
                10,
                ROLES.creador,
                { nombre: "Taller actualizado" }
            )
        ).rejects.toThrow("Actividad no encontrada");

        expect(mockGetEventoModificable).not.toHaveBeenCalled();
        expect(mockActualizarActividad).not.toHaveBeenCalled();
    });
});


describe("cancelacionActividad", () => {

    beforeEach(() => {
        mockGetActividad.mockResolvedValue(actividadPublicada);
        mockGetEventoModificable.mockResolvedValue(eventoPublicado);

        mockCancelarActividad.mockResolvedValue({
            ...actividadPublicada,
            estado: "cancelado"
        });
    });

    it("debe permitir cancelar una actividad propia", async () => {
        const resultado = await cancelacionActividad(
            5,
            10,
            ROLES.creador
        );

        expect(mockCancelarActividad).toHaveBeenCalledWith(5);
        expect(resultado.estado).toBe("cancelado");
    });

    it("no debe permitir cancelar actividades ajenas", async () => {
        await expect(
            cancelacionActividad(5, 99, ROLES.creador)
        ).rejects.toThrow(
            "No tiene permisos para modificar este evento"
        );

        expect(mockCancelarActividad).not.toHaveBeenCalled();
    });

    it("no debe permitir cancelar una actividad ya cancelada", async () => {
        mockGetActividad.mockResolvedValue({
            ...actividadPublicada,
            estado: "cancelado"
        });

        await expect(
            cancelacionActividad(5, 10, ROLES.creador)
        ).rejects.toThrow(
            "No se puede modificar una actividad cancelada o finalizada"
        );

        expect(mockCancelarActividad).not.toHaveBeenCalled();
    });

    it("no debe permitir cancelar una actividad inexistente", async () => {
        mockGetActividad.mockResolvedValueOnce(undefined);

        await expect(
            cancelacionActividad(5, 10, ROLES.creador)
        ).rejects.toThrow("Actividad no encontrada");

        expect(mockGetEventoModificable).not.toHaveBeenCalled();
        expect(mockCancelarActividad).not.toHaveBeenCalled();
    });

    it("debe informar si no se pudo cancelar la actividad", async () => {
        mockCancelarActividad.mockResolvedValueOnce(undefined);

        await expect(
            cancelacionActividad(5, 10, ROLES.creador)
        ).rejects.toThrow("No se pudo cancelar la actividad");

        expect(mockGetActividad).toHaveBeenCalledWith(5);
        expect(mockCancelarActividad).toHaveBeenCalledWith(5);
    });
});
