import { describe, it, expect} from "vitest";
import { pool } from "../config/database";

describe("Integración con PostgreSQL", () => {

    it("debe conectarse a la base de datos de testing", async () => {

        const resultado = await pool.query(
            "SELECT current_database() AS nombre"
        );

        expect(resultado.rows[0].nombre).toBe(
            "gestion_de_eventos_test"
        );
    });

    it("debe existir la tabla eventos", async () => {

        const resultado = await pool.query(
            "SELECT to_regclass('public.eventos') AS tabla"
        );

        expect(resultado.rows[0].tabla).toBe("eventos");
    });

});
