import {
    describe,
    it,
    expect,
    vi,
    beforeAll,
    beforeEach,
    afterAll
} from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app";
import { ROLES } from "../utils/roles";
import { AppError } from "../errors/appError";
import { getUsuarioById } from "../repositories/usuario.repository";
import {
    inscribirseActividad,
    cancelarInscripcionActividadService,
    listarMisInscripcionesActividad
} from "../services/inscripcionActividad.service";


// Simular los Services.
vi.mock("../services/inscripcionActividad.service", () => ({
    inscribirseActividad: vi.fn(),
    cancelarInscripcionActividadService: vi.fn(),
    listarMisInscripcionesActividad: vi.fn()
}));


// Simular únicamente la consulta del usuario autenticado.
vi.mock("../repositories/usuario.repository", async (importOriginal) => {
    const original = await importOriginal<
        typeof import("../repositories/usuario.repository")
    >();

    return {
        ...original,
        getUsuarioById: vi.fn()
    };
});


const rutaBase = "/api/inscripciones/actividades";
const jwtSecretTest = "clave-de-prueba-actividades";
const jwtSecretOriginal = process.env.JWT_SECRET;


// Generar JWT de prueba.
function generarToken(
    usuarioId = 5,
    rolId = ROLES.usuario
): string {
    return jwt.sign(
        {
            id: usuarioId,
            rol_id: rolId
        },
        jwtSecretTest,
        {
            expiresIn: "1h"
        }
    );
}


// Simular al usuario consultado en PostgreSQL.
function simularUsuario(
    rolId: number = ROLES.usuario
) {
    vi.mocked(getUsuarioById)
        .mockImplementation(async (id) => ({
            id,
            nombre: "Usuario de prueba",
            email: "test@example.com",
            rol_id: rolId,
            created_at: new Date()
        } as Awaited<ReturnType<typeof getUsuarioById>>));
}


// Inscripciones simuladas.
const inscripcionActiva = {
    id: 1,
    usuario_id: 5,
    actividad_id: 10,
    estado: "activa" as const,
    fecha_inscripcion: new Date(),
    fecha_cancelacion: null
};

const inscripcionCancelada = {
    ...inscripcionActiva,
    estado: "cancelada" as const,
    fecha_cancelacion: new Date()
};


describe("Rutas de inscripciones a actividades", () => {

    beforeAll(() => {
        process.env.JWT_SECRET = jwtSecretTest;
    });

    afterAll(() => {
        if (jwtSecretOriginal === undefined) {
            delete process.env.JWT_SECRET;
        } else {
            process.env.JWT_SECRET = jwtSecretOriginal;
        }
    });

    beforeEach(() => {
        vi.resetAllMocks();
        simularUsuario(ROLES.usuario);
    });


    describe("POST /:actividadId", () => {

        it("permite inscribirse correctamente", async () => {
            vi.mocked(inscribirseActividad)
                .mockResolvedValue(inscripcionActiva);

            const respuesta = await request(app)
                .post(`${rutaBase}/10`)
                .set(
                    "Authorization",
                    `Bearer ${generarToken()}`
                );

            expect(respuesta.status).toBe(201);

            expect(respuesta.body.message).toBe(
                "Inscripción a la actividad realizada correctamente"
            );

            expect(respuesta.body.inscripcion.estado)
                .toBe("activa");

            expect(inscribirseActividad)
                .toHaveBeenCalledWith(5, 10);
        });


        it("rechaza solicitudes sin JWT", async () => {
            const respuesta = await request(app)
                .post(`${rutaBase}/10`);

            expect(respuesta.status).toBe(401);

            expect(inscribirseActividad)
                .not.toHaveBeenCalled();
        });


        it("rechaza IDs inválidos", async () => {
            const respuesta = await request(app)
                .post(`${rutaBase}/abc`)
                .set(
                    "Authorization",
                    `Bearer ${generarToken()}`
                );

            expect(respuesta.status).toBe(400);

            expect(inscribirseActividad)
                .not.toHaveBeenCalled();
        });


        it("rechaza una actividad inexistente", async () => {
            vi.mocked(inscribirseActividad)
                .mockRejectedValue(
                    new AppError(404, "Actividad no encontrada")
                );

            const respuesta = await request(app)
                .post(`${rutaBase}/999`)
                .set(
                    "Authorization",
                    `Bearer ${generarToken()}`
                );

            expect(respuesta.status).toBe(404);
            expect(respuesta.body.message)
                .toBe("Actividad no encontrada");
        });


        it("rechaza usuarios no inscritos al evento", async () => {
            vi.mocked(inscribirseActividad)
                .mockRejectedValue(
                    new AppError(
                        409,
                        "Debe estar inscrito al evento para participar"
                    )
                );

            const respuesta = await request(app)
                .post(`${rutaBase}/10`)
                .set(
                    "Authorization",
                    `Bearer ${generarToken()}`
                );

            expect(respuesta.status).toBe(409);
        });


        it("rechaza actividades sin cupos", async () => {
            vi.mocked(inscribirseActividad)
                .mockRejectedValue(
                    new AppError(
                        409,
                        "No quedan cupos disponibles"
                    )
                );

            const respuesta = await request(app)
                .post(`${rutaBase}/10`)
                .set(
                    "Authorization",
                    `Bearer ${generarToken()}`
                );

            expect(respuesta.status).toBe(409);

            expect(respuesta.body.message)
                .toBe("No quedan cupos disponibles");
        });


        it("rechaza inscripciones duplicadas", async () => {
            vi.mocked(inscribirseActividad)
                .mockRejectedValue(
                    new AppError(
                        409,
                        "Ya estas inscrito en esta actividad"
                    )
                );

            const respuesta = await request(app)
                .post(`${rutaBase}/10`)
                .set(
                    "Authorization",
                    `Bearer ${generarToken()}`
                );

            expect(respuesta.status).toBe(409);
        });
    });


    describe("PATCH /:actividadId/cancelar", () => {

        it("cancela una inscripción correctamente", async () => {
            vi.mocked(cancelarInscripcionActividadService)
                .mockResolvedValue(inscripcionCancelada);

            const respuesta = await request(app)
                .patch(`${rutaBase}/10/cancelar`)
                .set(
                    "Authorization",
                    `Bearer ${generarToken()}`
                );

            expect(respuesta.status).toBe(200);

            expect(respuesta.body.inscripcion.estado)
                .toBe("cancelada");

            expect(cancelarInscripcionActividadService)
                .toHaveBeenCalledWith(5, 10);
        });


        it("rechaza solicitudes sin JWT", async () => {
            const respuesta = await request(app)
                .patch(`${rutaBase}/10/cancelar`);

            expect(respuesta.status).toBe(401);
        });


        it("rechaza IDs inválidos", async () => {
            const respuesta = await request(app)
                .patch(`${rutaBase}/0/cancelar`)
                .set(
                    "Authorization",
                    `Bearer ${generarToken()}`
                );

            expect(respuesta.status).toBe(400);

            expect(cancelarInscripcionActividadService)
                .not.toHaveBeenCalled();
        });


        it("rechaza inscripciones inexistentes", async () => {
            vi.mocked(cancelarInscripcionActividadService)
                .mockRejectedValue(
                    new AppError(
                        404,
                        "Inscripcion no encontrada"
                    )
                );

            const respuesta = await request(app)
                .patch(`${rutaBase}/10/cancelar`)
                .set(
                    "Authorization",
                    `Bearer ${generarToken()}`
                );

            expect(respuesta.status).toBe(404);
        });


        it("rechaza cancelar dos veces", async () => {
            vi.mocked(cancelarInscripcionActividadService)
                .mockRejectedValue(
                    new AppError(
                        409,
                        "La inscripcion ya esta cancelada"
                    )
                );

            const respuesta = await request(app)
                .patch(`${rutaBase}/10/cancelar`)
                .set(
                    "Authorization",
                    `Bearer ${generarToken()}`
                );

            expect(respuesta.status).toBe(409);
        });
    });


    describe("GET /misActividades", () => {

        it("devuelve las inscripciones propias", async () => {
            vi.mocked(listarMisInscripcionesActividad)
                .mockResolvedValue([inscripcionActiva]);

            const respuesta = await request(app)
                .get(`${rutaBase}/misActividades`)
                .set(
                    "Authorization",
                    `Bearer ${generarToken()}`
                );

            expect(respuesta.status).toBe(200);

            expect(respuesta.body.inscripciones)
                .toHaveLength(1);

            expect(listarMisInscripcionesActividad)
                .toHaveBeenCalledWith(5);
        });


        it("devuelve un arreglo vacío si no hay inscripciones", async () => {
            vi.mocked(listarMisInscripcionesActividad)
                .mockResolvedValue([]);

            const respuesta = await request(app)
                .get(`${rutaBase}/misActividades`)
                .set(
                    "Authorization",
                    `Bearer ${generarToken()}`
                );

            expect(respuesta.status).toBe(200);

            expect(respuesta.body.inscripciones)
                .toEqual([]);
        });


        it("rechaza solicitudes sin JWT", async () => {
            const respuesta = await request(app)
                .get(`${rutaBase}/misActividades`);

            expect(respuesta.status).toBe(401);
        });
    });


    describe("Seguridad y manejo de errores", () => {

        it("rechaza un JWT inválido", async () => {
            const respuesta = await request(app)
                .get(`${rutaBase}/misActividades`)
                .set(
                    "Authorization",
                    "Bearer token-invalido"
                );

            expect(respuesta.status).toBe(401);

            expect(listarMisInscripcionesActividad)
                .not.toHaveBeenCalled();
        });


        it("rechaza usuarios inexistentes", async () => {
            vi.mocked(getUsuarioById)
                .mockResolvedValue(undefined);

            const respuesta = await request(app)
                .get(`${rutaBase}/misActividades`)
                .set(
                    "Authorization",
                    `Bearer ${generarToken()}`
                );

            expect(respuesta.status).toBe(401);

            expect(listarMisInscripcionesActividad)
                .not.toHaveBeenCalled();
        });


        it("responde 500 ante errores inesperados", async () => {
            vi.mocked(listarMisInscripcionesActividad)
                .mockRejectedValue(
                    new Error("Error interno simulado")
                );

            const respuesta = await request(app)
                .get(`${rutaBase}/misActividades`)
                .set(
                    "Authorization",
                    `Bearer ${generarToken()}`
                );

            expect(respuesta.status).toBe(500);

            expect(respuesta.body.message)
                .toBe("Error interno del servidor");
        });
    });
});
