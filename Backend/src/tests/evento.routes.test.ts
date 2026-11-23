import { 
    vi, 
    describe, 
    it, 
    expect, 
    beforeAll, 
    beforeEach, 
    afterAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app";
import { ROLES } from "../utils/roles";
import { getUsuarioById } from "../repositories/usuario.repository";


vi.mock("../repositories/usuario.repository", async (importOriginal) => {
    const original = await importOriginal<
        typeof import("../repositories/usuario.repository")
    >();

    return {
        ...original,
        getUsuarioById: vi.fn()
    };
});

function simularUsuario(rolId: number) {
    vi.mocked(getUsuarioById).mockImplementation(
        async (id) => ({
            id,
            nombre: "Usuario de prueba",
            email: "test@example.com",
            rol_id: rolId,
            created_at: new Date()
        })
    );
}

describe("Rutas de eventos", () => {

    const secretAnterior = process.env.JWT_SECRET;
    const secretTest = "clave-exclusiva-para-testing";

    beforeAll(() => {
        process.env.JWT_SECRET = secretTest;
    });

    beforeEach(() => {
        vi.mocked(getUsuarioById).mockReset();

        simularUsuario(ROLES.creador);
    });

    afterAll(() => {
        if (secretAnterior === undefined) {
            delete process.env.JWT_SECRET;
        } else {
            process.env.JWT_SECRET = secretAnterior;
        }
    });

    // Generamos tokens para simular usuarios autenticados
    function generarToken(id: number, rol_id: number) {
        return jwt.sign(
            { id, rol_id },
            secretTest,
            { expiresIn: "1h" }
        );
    }

    it("No debe permitir crear eventos sin autenticación", async () => {
        const respuesta = await request(app)
            .post("/api/eventos")
            .send({
                nombre: "Evento de prueba"
            });

        expect(respuesta.status).toBe(401);
        expect(respuesta.body.message).toBe("Token no proporcionado");
    });

    it("Debe rechazar un token inválido", async () => {
        const respuesta = await request(app)
            .post("/api/eventos")
            .set("Authorization", "Bearer token-invalido")
            .send({});

        expect(respuesta.status).toBe(401);
    });

    it("No debe permitir crear eventos a un usuario común", async () => {
        simularUsuario(ROLES.usuario);
        const token = generarToken(10, ROLES.usuario);

        const respuesta = await request(app)
            .post("/api/eventos")
            .set("Authorization", `Bearer ${token}`)
            .send({});

        expect(respuesta.status).toBe(403);
        expect(respuesta.body.message).toBe(
            "No tiene permisos para realizar esta accion"
        );
    });

    it("Debe validar los datos enviados por un creador", async () => {
        const token = generarToken(10, ROLES.creador);

        const respuesta = await request(app)
            .post("/api/eventos")
            .set("Authorization", `Bearer ${token}`)
            .send({
                nombre: "AB"
            });

        expect(respuesta.status).toBe(400);
    });

    it("Debe rechazar un ID de evento inválido", async () => {
        const respuesta = await request(app)
            .get("/api/eventos/abc");

        expect(respuesta.status).toBe(400);
        expect(respuesta.body.message).toBe(
            "ID de evento inválido"
        );
    });
});
