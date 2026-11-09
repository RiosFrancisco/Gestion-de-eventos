import { afterAll } from "vitest";
import { config } from "dotenv";

// Cargar exclusivamente las variables de testing.
config({ path: ".env.test", override: true });

const testUrl = process.env.DATABASE_URL_TEST;

if (!testUrl) {
    throw new Error("Falta DATABASE_URL_TEST");
}

const databaseName = decodeURIComponent(
    new URL(testUrl).pathname.slice(1)
);

if (databaseName !== "gestion_de_eventos_test") {
    throw new Error("La conexión no apunta a la base de testing");
}

// Configurar la conexión antes de importar el pool.
process.env.DATABASE_URL = testUrl;

// Cerrar el pool una sola vez por archivo de pruebas.
afterAll(async () => {
    const { pool } = await import("../config/database");
    await pool.end();
});