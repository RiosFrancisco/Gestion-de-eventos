import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});


//funcion para probar la conexión a la base de datos
async function probarConexion() {
    try {
        const result = await pool.query(`
            SELECT
                current_database() AS database,
                current_user AS usuario,
                NOW() AS fecha
        `);

        console.log("Conexión exitosa");
        console.log(result.rows[0]);
    } catch (error) {
        console.error("Error conectando a PostgreSQL:");
        console.error(error);
    } finally {
        await pool.end();
    }
}

probarConexion();