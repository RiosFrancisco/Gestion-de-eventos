import {
    beforeEach,
    afterAll,
    describe,
    expect,
    it,
    vi
} from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app";
import { getUsuarioById } from "../repositories/usuario.repository";
import {
    listarUsuarios,
    cambiarRolUsuario
} from "../services/usuario.service";

import { AppError } from "../errors/appError";
import { ROLES } from "../utils/roles";

vi.mock("../repositories/usuario.repository", async (importOriginal) => {
    const original = await importOriginal<
        typeof import("../repositories/usuario.repository")
    >();

    return {
        ...original,
        getUsuarioById: vi.fn()
    };
});

vi.mock("../services/usuario.service", () => ({
    listarUsuarios: vi.fn(),
    cambiarRolUsuario: vi.fn()
}));

const JWT_SECRET_TEST = "clave-exclusiva-usuarios-test";
const jwtSecretAnterior = process.env.JWT_SECRET;

const usuarioAdmin = {
    id: 1,
    nombre: "Administrador",
    email: "admin@test.com",
    rol_id: ROLES.admin,
    created_at: new Date()
};

function generarToken(
    id: number,
    rolId: number
): string {
    return jwt.sign(
        { id, rol_id: rolId },
        JWT_SECRET_TEST,
        { expiresIn: "1h" }
    );
}

describe("Rutas de usuarios", () => {

    beforeEach(() => {
        vi.resetAllMocks();
        process.env.JWT_SECRET = JWT_SECRET_TEST;

        vi.mocked(getUsuarioById).mockImplementation(
            async (id) => ({
                ...usuarioAdmin,
                id
            })
        );
    });

    afterAll(() => {
        if (jwtSecretAnterior === undefined) {
            delete process.env.JWT_SECRET;
        } else {
            process.env.JWT_SECRET = jwtSecretAnterior;
        }
    });

    describe("GET /api/usuarios", () => {

        it("debe rechazar solicitudes sin token", async () => {
            const respuesta = await request(app)
                .get("/api/usuarios");

            expect(respuesta.status).toBe(401);
        });

        it("debe impedir el acceso a usuarios comunes", async () => {
            vi.mocked(getUsuarioById).mockResolvedValue({
                ...usuarioAdmin,
                rol_id: ROLES.usuario
            });

            const respuesta = await request(app)
                .get("/api/usuarios")
                .set(
                    "Authorization",
                    `Bearer ${generarToken(2, ROLES.usuario)}`
                );

            expect(respuesta.status).toBe(403);
            expect(listarUsuarios).not.toHaveBeenCalled();
        });

        it("debe permitir listar usuarios al administrador", async () => {
            vi.mocked(listarUsuarios).mockResolvedValue([
                usuarioAdmin
            ]);

            const respuesta = await request(app)
                .get("/api/usuarios")
                .set(
                    "Authorization",
                    `Bearer ${generarToken(1, ROLES.admin)}`
                );

            expect(respuesta.status).toBe(200);
            expect(respuesta.body.usuarios).toHaveLength(1);
            expect(listarUsuarios).toHaveBeenCalledOnce();
        });

        it("debe rechazar un usuario eliminado", async () => {
            vi.mocked(getUsuarioById).mockResolvedValue(undefined);

            const respuesta = await request(app)
                .get("/api/usuarios")
                .set(
                    "Authorization",
                    `Bearer ${generarToken(999, ROLES.admin)}`
                );

            expect(respuesta.status).toBe(401);
            expect(listarUsuarios).not.toHaveBeenCalled();
        });
    });

    describe("PATCH /api/usuarios/:id/rol", () => {

        it("debe permitir asignar el rol creador", async () => {
            const actualizado = {
                ...usuarioAdmin,
                id: 2,
                rol_id: ROLES.creador
            };

            vi.mocked(cambiarRolUsuario).mockResolvedValue(
                actualizado
            );

            const respuesta = await request(app)
                .patch("/api/usuarios/2/rol")
                .set(
                    "Authorization",
                    `Bearer ${generarToken(1, ROLES.admin)}`
                )
                .send({ rol: "creador" });

            expect(respuesta.status).toBe(200);

            expect(cambiarRolUsuario).toHaveBeenCalledWith(
                1,
                2,
                "creador"
            );

            expect(respuesta.body.usuario.rol_id).toBe(
                ROLES.creador
            );
        });

        it("debe impedir cambiar roles sin autenticación", async () => {
            const respuesta = await request(app)
                .patch("/api/usuarios/2/rol")
                .send({ rol: "creador" });

            expect(respuesta.status).toBe(401);
            expect(cambiarRolUsuario).not.toHaveBeenCalled();
        });

        it("debe impedir asignar el rol administrador", async () => {
            const respuesta = await request(app)
                .patch("/api/usuarios/2/rol")
                .set(
                    "Authorization",
                    `Bearer ${generarToken(1, ROLES.admin)}`
                )
                .send({ rol: "admin" });

            expect(respuesta.status).toBe(400);
            expect(cambiarRolUsuario).not.toHaveBeenCalled();
        });

        it("debe rechazar un ID inválido", async () => {
            const respuesta = await request(app)
                .patch("/api/usuarios/abc/rol")
                .set(
                    "Authorization",
                    `Bearer ${generarToken(1, ROLES.admin)}`
                )
                .send({ rol: "creador" });

            expect(respuesta.status).toBe(400);
            expect(cambiarRolUsuario).not.toHaveBeenCalled();
        });

        it("debe devolver 404 si el usuario no existe", async () => {
            vi.mocked(cambiarRolUsuario).mockRejectedValue(
                new AppError(404, "Usuario no encontrado")
            );

            const respuesta = await request(app)
                .patch("/api/usuarios/999/rol")
                .set(
                    "Authorization",
                    `Bearer ${generarToken(1, ROLES.admin)}`
                )
                .send({ rol: "creador" });

            expect(respuesta.status).toBe(404);
            expect(respuesta.body.message).toBe(
                "Usuario no encontrado"
            );
        });

        it("debe devolver 403 si intenta modificar su propio rol", async () => {
            vi.mocked(cambiarRolUsuario).mockRejectedValue(
                new AppError(
                    403,
                    "No puede modificar su propio rol"
                )
            );

            const respuesta = await request(app)
                .patch("/api/usuarios/1/rol")
                .set(
                    "Authorization",
                    `Bearer ${generarToken(1, ROLES.admin)}`
                )
                .send({ rol: "creador" });

            expect(respuesta.status).toBe(403);
        });

        it("debe rechazar permisos revocados", async () => {
            vi.mocked(getUsuarioById).mockResolvedValue({
                ...usuarioAdmin,
                rol_id: ROLES.usuario
            });

            const respuesta = await request(app)
                .patch("/api/usuarios/2/rol")
                .set(
                    "Authorization",
                    `Bearer ${generarToken(1, ROLES.admin)}`
                )
                .send({ rol: "creador" });

            expect(respuesta.status).toBe(403);
            expect(cambiarRolUsuario).not.toHaveBeenCalled();
        });
    });
});
