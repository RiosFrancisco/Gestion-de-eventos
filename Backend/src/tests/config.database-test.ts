import { afterAll } from "vitest";
import { config } from "dotenv";

config({ path: ".env.test", override: true });

const testUrl = process.env.DATABASE_URL_TEST;

if (!testUrl) {
    throw new Error("Falta DATABASE_URL_TEST");
}

const nombreBD = decodeURIComponent(
    new URL(testUrl).pathname.slice(1)
);

if (nombreBD !== "gestion_de_eventos_test") {
    throw new Error("Base de datos de testing incorrecta");
}

process.env.DATABASE_URL = testUrl;

afterAll(async () => {
    const { pool } = await import("../config/database");
    await pool.end();
});