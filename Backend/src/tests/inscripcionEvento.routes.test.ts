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
    inscribirseEvento,
    cancelarInscripcion,
    listarMisInscripciones
} from "../services/inscripcionEvento.service";


// Simulamos los Services de inscripciones
vi.mock("../services/inscripcionEvento.service", () => ({
    inscribirseEvento: vi.fn(),
    cancelarInscripcion: vi.fn(),
    listarMisInscripciones: vi.fn()
}));


// Conservamos las funciones reales del Repository,
// excepto la búsqueda de usuario, que simularemos.
vi.mock("../repositories/usuario.repository", async (importOriginal) => {
    const original = await importOriginal<
        typeof import("../repositories/usuario.repository")
    >();

    return {
        ...original,
        getUsuarioById: vi.fn()
    };
});


const jwtSecretTest = "clave-de-prueba-inscripciones";
const jwtSecretOriginal = process.env.JWT_SECRET;

const rutaBase = "/api/inscripciones/eventos";


// Generar un JWT válido para las pruebas
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


// Simular el usuario que devuelve PostgreSQL
function simularUsuario(
    rolId: number = ROLES.usuario
) {
    vi.mocked(getUsuarioById).mockImplementation(async (id) => {
        return {
            id,
            nombre: "Usuario de prueba",
            email: "test@example.com",
            rol_id: rolId,
            created_at: new Date()
        } as Awaited<ReturnType<typeof getUsuarioById>>;
    });
}


// Datos simulados
const inscripcionActiva = {
    id: 1,
    usuario_id: 5,
    evento_id: 10,
    estado: "activa" as const,
    fecha_inscripcion: new Date(),
    fecha_cancelacion: null
};

const inscripcionCancelada = {
    ...inscripcionActiva,
    estado: "cancelada" as const,
    fecha_cancelacion: new Date()
};


describe("Rutas de inscripciones a eventos", () => {

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



    describe("POST /:eventoId", () => {

        it("debe permitir inscribirse correctamente", async () => {
            vi.mocked(inscribirseEvento).mockResolvedValue(
                inscripcionActiva
            );

            const respuesta = await request(app)
                .post(`${rutaBase}/10`)
                .set(
                    "Authorization",
                    `Bearer ${generarToken()}`
                );

            expect(respuesta.status).toBe(201);

            expect(respuesta.body.message).toBe(
                "Inscripción realizada correctamente"
            );

            expect(respuesta.body.inscripcion.estado).toBe(
                "activa"
            );

            expect(inscribirseEvento).toHaveBeenCalledWith(
                5,
                10
            );
        });


        it("debe rechazar solicitudes sin token", async () => {
            const respuesta = await request(app)
                .post(`${rutaBase}/10`);

            expect(respuesta.status).toBe(401);

            expect(inscribirseEvento).not.toHaveBeenCalled();
        });


        it("debe rechazar un ID inválido", async () => {
            const respuesta = await request(app)
                .post(`${rutaBase}/abc`)
                .set(
                    "Authorization",
                    `Bearer ${generarToken()}`
                );

            expect(respuesta.status).toBe(400);

            expect(inscribirseEvento).not.toHaveBeenCalled();
        });


        it("debe responder 404 si el evento no existe", async () => {
            vi.mocked(inscribirseEvento).mockRejectedValue(
                new AppError(404, "Evento no encontrado")
            );

            const respuesta = await request(app)
                .post(`${rutaBase}/999`)
                .set(
                    "Authorization",
                    `Bearer ${generarToken()}`
                );

            expect(respuesta.status).toBe(404);

            expect(respuesta.body.message).toBe(
                "Evento no encontrado"
            );
        });


        it("debe rechazar una inscripción duplicada", async () => {
            vi.mocked(inscribirseEvento).mockRejectedValue(
                new AppError(
                    409,
                    "Ya estas inscrito en este evento"
                )
            );

            const respuesta = await request(app)
                .post(`${rutaBase}/10`)
                .set(
                    "Authorization",
                    `Bearer ${generarToken()}`
                );

            expect(respuesta.status).toBe(409);

            expect(respuesta.body.message).toBe(
                "Ya estas inscrito en este evento"
            );
        });
    });


    describe("PATCH /:eventoId/cancelar", () => {

        it("debe cancelar correctamente", async () => {
            vi.mocked(cancelarInscripcion).mockResolvedValue(
                inscripcionCancelada
            );

            const respuesta = await request(app)
                .patch(`${rutaBase}/10/cancelar`)
                .set(
                    "Authorization",
                    `Bearer ${generarToken()}`
                );

            expect(respuesta.status).toBe(200);

            expect(respuesta.body.inscripcion.estado).toBe(
                "cancelada"
            );

            expect(cancelarInscripcion).toHaveBeenCalledWith(
                5,
                10
            );
        });


        it("debe rechazar solicitudes sin token", async () => {
            const respuesta = await request(app)
                .patch(`${rutaBase}/10/cancelar`);

            expect(respuesta.status).toBe(401);

            expect(cancelarInscripcion).not.toHaveBeenCalled();
        });


        it("debe rechazar un ID inválido", async () => {
            const respuesta = await request(app)
                .patch(`${rutaBase}/-1/cancelar`)
                .set(
                    "Authorization",
                    `Bearer ${generarToken()}`
                );

            expect(respuesta.status).toBe(400);

            expect(cancelarInscripcion).not.toHaveBeenCalled();
        });


        it("debe responder 404 si la inscripción no existe", async () => {
            vi.mocked(cancelarInscripcion).mockRejectedValue(
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


        it("debe rechazar cancelar dos veces", async () => {
            vi.mocked(cancelarInscripcion).mockRejectedValue(
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

            expect(respuesta.body.message).toBe(
                "La inscripcion ya esta cancelada"
            );
        });
    });

    describe("GET /misInsc", () => {

        it("debe devolver las inscripciones del usuario", async () => {
            vi.mocked(listarMisInscripciones).mockResolvedValue([
                inscripcionActiva
            ]);

            const respuesta = await request(app)
                .get(`${rutaBase}/misInsc`)
                .set(
                    "Authorization",
                    `Bearer ${generarToken()}`
                );

            expect(respuesta.status).toBe(200);

            expect(respuesta.body.inscripciones).toHaveLength(1);

            expect(
                respuesta.body.inscripciones[0].evento_id
            ).toBe(10);

            expect(listarMisInscripciones).toHaveBeenCalledWith(
                5
            );
        });


        it("debe devolver un arreglo vacío si no tiene inscripciones", async () => {
            vi.mocked(listarMisInscripciones).mockResolvedValue([]);

            const respuesta = await request(app)
                .get(`${rutaBase}/misInsc`)
                .set(
                    "Authorization",
                    `Bearer ${generarToken()}`
                );

            expect(respuesta.status).toBe(200);

            expect(respuesta.body.inscripciones).toEqual([]);
        });


        it("debe rechazar usuarios sin token", async () => {
            const respuesta = await request(app)
                .get(`${rutaBase}/misInsc`);

            expect(respuesta.status).toBe(401);

            expect(listarMisInscripciones).not.toHaveBeenCalled();
        });
    });


    describe("Seguridad y errores", () => {

        it("debe rechazar un JWT inválido", async () => {
            const respuesta = await request(app)
                .get(`${rutaBase}/misInsc`)
                .set(
                    "Authorization",
                    "Bearer token-invalido"
                );

            expect(respuesta.status).toBe(401);

            expect(listarMisInscripciones).not.toHaveBeenCalled();
        });


        it("debe rechazar usuarios que ya no existen", async () => {
            vi.mocked(getUsuarioById).mockResolvedValue(
                undefined
            );

            const respuesta = await request(app)
                .get(`${rutaBase}/misInsc`)
                .set(
                    "Authorization",
                    `Bearer ${generarToken()}`
                );

            expect(respuesta.status).toBe(401);

            expect(listarMisInscripciones).not.toHaveBeenCalled();
        });


        it("debe responder 500 ante un error inesperado", async () => {
            vi.mocked(listarMisInscripciones).mockRejectedValue(
                new Error("Fallo interno simulado")
            );

            const respuesta = await request(app)
                .get(`${rutaBase}/misInsc`)
                .set(
                    "Authorization",
                    `Bearer ${generarToken()}`
                );

            expect(respuesta.status).toBe(500);

            expect(respuesta.body.message).toBe(
                "Error interno del servidor"
            );
        });
    });
});
