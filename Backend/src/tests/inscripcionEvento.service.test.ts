import {
    describe,
    it,
    expect,
    beforeEach,
    vi
} from "vitest";
import {
    getInscripcionEvento,
    crearInscripcionEvento,
    cancelarInscripcionEvento,
    getInscripcionesByUsuario
} from "../repositories/inscripcionEvento.repository";
import { getEventoById } from "../repositories/evento.repository";
import {
    inscribirseEvento,
    cancelarInscripcion,
    listarMisInscripciones
} from "../services/inscripcionEvento.service";
import type { InscripcionEvento } from "../models/inscripcionEvento.model";


vi.mock("../repositories/inscripcionEvento.repository", () => ({
    getInscripcionEvento: vi.fn(),
    crearInscripcionEvento: vi.fn(),
    cancelarInscripcionEvento: vi.fn(),
    getInscripcionesByUsuario: vi.fn()
}));

vi.mock("../repositories/evento.repository", () => ({
    getEventoById: vi.fn()
}));

type EventoConsultado = NonNullable<
    Awaited<ReturnType<typeof getEventoById>>
>;

const eventoDisponible = {
    id: 10,
    creador_id: 2,
    categoria_id: 1,
    nombre: "Evento de prueba",
    descripcion: "Evento para probar inscripciones",
    fecha: "2099-12-15",
    hora: "18:00:00",
    ubicacion: "Bahia Blanca",
    estado: "publicado",
    created_at: new Date()
} as EventoConsultado;

const inscripcion: InscripcionEvento = {
    id: 1,
    usuario_id: 5,
    evento_id: 10,
    estado: "activa",
    fecha_inscripcion: new Date(),
    fecha_cancelacion: null
};

describe("Inscripciones a eventos - Service", () => {

    beforeEach(() => {
        vi.resetAllMocks();

        vi.mocked(getEventoById).mockResolvedValue(
            eventoDisponible
        );
    });

    it("permite inscribirse a un evento disponible", async () => {
        vi.mocked(crearInscripcionEvento).mockResolvedValue(
            inscripcion
        );

        const resultado = await inscribirseEvento(5, 10);

        expect(resultado.estado).toBe("activa");

        expect(crearInscripcionEvento)
            .toHaveBeenCalledWith(5, 10);
    });

    it("rechaza un evento inexistente", async () => {
        vi.mocked(getEventoById).mockResolvedValue(undefined);

        await expect(
            inscribirseEvento(5, 999)
        ).rejects.toMatchObject({
            statusCode: 404,
            message: "Evento no encontrado"
        });

        expect(crearInscripcionEvento).not.toHaveBeenCalled();
    });

    it("rechaza un evento cancelado", async () => {
        vi.mocked(getEventoById).mockResolvedValue({
            ...eventoDisponible,
            estado: "cancelado"
        });

        await expect(
            inscribirseEvento(5, 10)
        ).rejects.toMatchObject({
            statusCode: 409
        });

        expect(crearInscripcionEvento).not.toHaveBeenCalled();
    });

    it("rechaza un evento cuya fecha ya paso", async () => {
        vi.mocked(getEventoById).mockResolvedValue({
            ...eventoDisponible,
            fecha: "2020-01-01"
        });

        await expect(
            inscribirseEvento(5, 10)
        ).rejects.toMatchObject({
            statusCode: 409,
            message: "El evento ya comenzo o finalizo"
        });
    });

    it("rechaza inscripciones duplicadas", async () => {
        vi.mocked(crearInscripcionEvento).mockResolvedValue(
            undefined
        );

        await expect(
            inscribirseEvento(5, 10)
        ).rejects.toMatchObject({
            statusCode: 409,
            message: "Ya estas inscrito en este evento"
        });
    });

    it("permite cancelar una inscripción activa", async () => {
        vi.mocked(getInscripcionEvento).mockResolvedValue(
            inscripcion
        );

        vi.mocked(cancelarInscripcionEvento).mockResolvedValue({
            ...inscripcion,
            estado: "cancelada",
            fecha_cancelacion: new Date()
        });

        const resultado = await cancelarInscripcion(5, 10);

        expect(resultado.estado).toBe("cancelada");

        expect(cancelarInscripcionEvento)
            .toHaveBeenCalledWith(5, 10);
    });

    it("rechaza cancelar una inscripción inexistente", async () => {
        vi.mocked(getInscripcionEvento).mockResolvedValue(
            undefined
        );

        await expect(
            cancelarInscripcion(5, 10)
        ).rejects.toMatchObject({
            statusCode: 404,
            message: "Inscripcion no encontrada"
        });
    });

    it("rechaza cancelar una inscripción ya cancelada", async () => {
        vi.mocked(getInscripcionEvento).mockResolvedValue({
            ...inscripcion,
            estado: "cancelada"
        });

        await expect(
            cancelarInscripcion(5, 10)
        ).rejects.toMatchObject({
            statusCode: 409,
            message: "La inscripcion ya esta cancelada"
        });

        expect(cancelarInscripcionEvento).not.toHaveBeenCalled();
    });

    it("devuelve las inscripciones del usuario", async () => {
        vi.mocked(getInscripcionesByUsuario).mockResolvedValue([
            inscripcion
        ]);

        const resultado = await listarMisInscripciones(5);

        expect(resultado).toEqual([inscripcion]);

        expect(getInscripcionesByUsuario)
            .toHaveBeenCalledWith(5);
    });
});
