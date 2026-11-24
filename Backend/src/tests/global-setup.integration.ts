import { config } from "dotenv";

export function setup() {
    config({ path: ".env.test" });

    const testUrl = process.env.DATABASE_URL_TEST;

    if (!testUrl) {
        throw new Error("Falta DATABASE_URL_TEST");
    }

    const nombreBD = decodeURIComponent(
        new URL(testUrl).pathname.slice(1)
    );

    if (nombreBD !== "gestion_de_eventos_test") {
        throw new Error(
            "La conexión no apunta a gestion_de_eventos_test"
        );
    }

    process.env.DATABASE_URL = testUrl;
}