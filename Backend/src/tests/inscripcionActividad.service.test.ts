import {
    describe,
    it,
    expect,
    vi,
    beforeEach
} from "vitest";
import {
    crearInscripcionActividad,
    getInscripcionActividad,
    cancelarInscripcionActividad,
    getInscripcionesActividadByUsuario
} from "../repositories/inscripcionActividad.repository";
import {
    inscribirseActividad,
    cancelarInscripcionActividadService,
    listarMisInscripcionesActividad
} from "../services/inscripcionActividad.service";
import type {
    InscripcionActividad
} from "../models/inscripcionActividad.model";


// Simular las funciones del Repository.
vi.mock("../repositories/inscripcionActividad.repository", () => ({
    crearInscripcionActividad: vi.fn(),
    getInscripcionActividad: vi.fn(),
    cancelarInscripcionActividad: vi.fn(),
    getInscripcionesActividadByUsuario: vi.fn()
}));


// Datos de prueba.
const inscripcionActiva: InscripcionActividad = {
    id: 1,
    usuario_id: 5,
    actividad_id: 10,
    estado: "activa",
    fecha_inscripcion: new Date(),
    fecha_cancelacion: null
};

const inscripcionCancelada: InscripcionActividad = {
    ...inscripcionActiva,
    estado: "cancelada",
    fecha_cancelacion: new Date()
};


describe("Inscripciones a actividades - Service", () => {

    beforeEach(() => {
        vi.resetAllMocks();
    });


    describe("inscribirseActividad", () => {

        it("permite inscribirse correctamente", async () => {
            vi.mocked(crearInscripcionActividad)
                .mockResolvedValue({
                    tipo: "ok",
                    inscripcion: inscripcionActiva
                });

            const resultado = await inscribirseActividad(5, 10);

            expect(resultado).toEqual(inscripcionActiva);

            expect(crearInscripcionActividad)
                .toHaveBeenCalledWith(5, 10);
        });


        it("rechaza una actividad inexistente", async () => {
            vi.mocked(crearInscripcionActividad)
                .mockResolvedValue({
                    tipo: "actividad no existe"
                });

            await expect(
                inscribirseActividad(5, 999)
            ).rejects.toMatchObject({
                statusCode: 404,
                message: "Actividad no encontrada"
            });
        });


        it("exige inscripción previa al evento", async () => {
            vi.mocked(crearInscripcionActividad)
                .mockResolvedValue({
                    tipo: "evento no inscrito"
                });

            await expect(
                inscribirseActividad(5, 10)
            ).rejects.toMatchObject({
                statusCode: 409,
                message: "Debe estar inscrito al evento para participar"
            });
        });


        it("rechaza eventos no disponibles", async () => {
            vi.mocked(crearInscripcionActividad)
                .mockResolvedValue({
                    tipo: "evento no disponible"
                });

            await expect(
                inscribirseActividad(5, 10)
            ).rejects.toMatchObject({
                statusCode: 409,
                message: "El evento no admite inscripciones"
            });
        });


        it("rechaza actividades no disponibles", async () => {
            vi.mocked(crearInscripcionActividad)
                .mockResolvedValue({
                    tipo: "actividad no disponible"
                });

            await expect(
                inscribirseActividad(5, 10)
            ).rejects.toMatchObject({
                statusCode: 409,
                message: "La actividad no admite inscripciones"
            });
        });


        it("rechaza actividades sin cupos disponibles", async () => {
            vi.mocked(crearInscripcionActividad)
                .mockResolvedValue({
                    tipo: "sin cupo"
                });

            await expect(
                inscribirseActividad(5, 10)
            ).rejects.toMatchObject({
                statusCode: 409,
                message: "No quedan cupos disponibles"
            });
        });


        it("rechaza inscripciones duplicadas", async () => {
            vi.mocked(crearInscripcionActividad)
                .mockResolvedValue({
                    tipo: "ya inscrito"
                });

            await expect(
                inscribirseActividad(5, 10)
            ).rejects.toMatchObject({
                statusCode: 409,
                message: "Ya estas inscrito en esta actividad"
            });
        });


        it("propaga errores inesperados del Repository", async () => {
            vi.mocked(crearInscripcionActividad)
                .mockRejectedValue(
                    new Error("Error de PostgreSQL")
                );

            await expect(
                inscribirseActividad(5, 10)
            ).rejects.toThrow("Error de PostgreSQL");
        });
    });


    describe("cancelarInscripcionActividadService", () => {

        it("permite cancelar una inscripción activa", async () => {
            vi.mocked(getInscripcionActividad)
                .mockResolvedValue(inscripcionActiva);

            vi.mocked(cancelarInscripcionActividad)
                .mockResolvedValue(inscripcionCancelada);

            const resultado =
                await cancelarInscripcionActividadService(5, 10);

            expect(resultado.estado).toBe("cancelada");

            expect(cancelarInscripcionActividad)
                .toHaveBeenCalledWith(5, 10);
        });


        it("rechaza una inscripción inexistente", async () => {
            vi.mocked(getInscripcionActividad)
                .mockResolvedValue(undefined);

            await expect(
                cancelarInscripcionActividadService(5, 10)
            ).rejects.toMatchObject({
                statusCode: 404,
                message: "Inscripcion no encontrada"
            });

            expect(cancelarInscripcionActividad)
                .not.toHaveBeenCalled();
        });


        it("rechaza cancelar una inscripción ya cancelada", async () => {
            vi.mocked(getInscripcionActividad)
                .mockResolvedValue(inscripcionCancelada);

            await expect(
                cancelarInscripcionActividadService(5, 10)
            ).rejects.toMatchObject({
                statusCode: 409,
                message: "La inscripcion ya esta cancelada"
            });

            expect(cancelarInscripcionActividad)
                .not.toHaveBeenCalled();
        });


        it("maneja una cancelación que no pudo completarse", async () => {
            vi.mocked(getInscripcionActividad)
                .mockResolvedValue(inscripcionActiva);

            vi.mocked(cancelarInscripcionActividad)
                .mockResolvedValue(undefined);

            await expect(
                cancelarInscripcionActividadService(5, 10)
            ).rejects.toMatchObject({
                statusCode: 409,
                message: "No se pudo cancelar la inscripcion"
            });
        });
    });


    describe("listarMisInscripcionesActividad", () => {

        it("devuelve las inscripciones del usuario", async () => {
            vi.mocked(getInscripcionesActividadByUsuario)
                .mockResolvedValue([inscripcionActiva]);

            const resultado =
                await listarMisInscripcionesActividad(5);

            expect(resultado).toEqual([inscripcionActiva]);

            expect(getInscripcionesActividadByUsuario)
                .toHaveBeenCalledWith(5);
        });


        it("devuelve un arreglo vacío si no tiene inscripciones", async () => {
            vi.mocked(getInscripcionesActividadByUsuario)
                .mockResolvedValue([]);

            const resultado =
                await listarMisInscripcionesActividad(5);

            expect(resultado).toEqual([]);
        });
    });
});
