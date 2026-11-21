import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    getAllUsuarios,
    getUsuarioById,
    updateRolUsuario
} from "../repositories/usuario.repository";
import {
    listarUsuarios,
    cambiarRolUsuario
} from "../services/usuario.service";
import { ROLES } from "../utils/roles";

vi.mock("../repositories/usuario.repository", () => ({
    getAllUsuarios: vi.fn(),
    getUsuarioById: vi.fn(),
    updateRolUsuario: vi.fn()
}));

const usuario = {
    id: 2,
    nombre: "Usuario Prueba",
    email: "usuario@test.com",
    rol_id: ROLES.usuario,
    created_at: new Date()
};

describe("Usuario Service", () => {

    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("debe listar los usuarios", async () => {
        vi.mocked(getAllUsuarios).mockResolvedValue([usuario]);

        const resultado = await listarUsuarios();

        expect(resultado).toEqual([usuario]);
        expect(getAllUsuarios).toHaveBeenCalledOnce();
    });

    it("debe permitir asignar el rol creador", async () => {
        const actualizado = {
            ...usuario,
            rol_id: ROLES.creador
        };

        vi.mocked(getUsuarioById).mockResolvedValue(usuario);
        vi.mocked(updateRolUsuario).mockResolvedValue(actualizado);

        const resultado = await cambiarRolUsuario(
            1,
            2,
            "creador"
        );

        expect(resultado.rol_id).toBe(ROLES.creador);

        expect(updateRolUsuario).toHaveBeenCalledWith(
            2,
            "creador"
        );
    });

    it("debe permitir revocar el rol creador", async () => {
        const creador = {
            ...usuario,
            rol_id: ROLES.creador
        };

        vi.mocked(getUsuarioById).mockResolvedValue(creador);
        vi.mocked(updateRolUsuario).mockResolvedValue(usuario);

        const resultado = await cambiarRolUsuario(
            1,
            2,
            "usuario"
        );

        expect(resultado.rol_id).toBe(ROLES.usuario);
    });

    it("debe impedir modificar el propio rol", async () => {
        await expect(
            cambiarRolUsuario(2, 2, "creador")
        ).rejects.toMatchObject({
            statusCode: 403,
            message: "No puede modificar su propio rol"
        });

        expect(updateRolUsuario).not.toHaveBeenCalled();
    });

    it("debe rechazar un usuario inexistente", async () => {
        vi.mocked(getUsuarioById).mockResolvedValue(undefined);

        await expect(
            cambiarRolUsuario(1, 999, "creador")
        ).rejects.toMatchObject({
            statusCode: 404,
            message: "Usuario no encontrado"
        });

        expect(updateRolUsuario).not.toHaveBeenCalled();
    });

    it("debe impedir modificar a otro administrador", async () => {
        vi.mocked(getUsuarioById).mockResolvedValue({
            ...usuario,
            rol_id: ROLES.admin
        });

        await expect(
            cambiarRolUsuario(1, 2, "creador")
        ).rejects.toMatchObject({
            statusCode: 403,
            message: "No se puede modificar el rol de un administrador"
        });

        expect(updateRolUsuario).not.toHaveBeenCalled();
    });

    it("no debe actualizar si el usuario ya tiene ese rol", async () => {
        vi.mocked(getUsuarioById).mockResolvedValue(usuario);

        const resultado = await cambiarRolUsuario(
            1,
            2,
            "usuario"
        );

        expect(resultado).toEqual(usuario);
        expect(updateRolUsuario).not.toHaveBeenCalled();
    });

    it("debe informar cuando la actualización no se completa", async () => {
        vi.mocked(getUsuarioById).mockResolvedValue(usuario);
        vi.mocked(updateRolUsuario).mockResolvedValue(undefined);

        await expect(
            cambiarRolUsuario(1, 2, "creador")
        ).rejects.toMatchObject({
            statusCode: 409,
            message: "No se pudo actualizar el rol del usuario"
        });
    });
});
