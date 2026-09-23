import dotenv from "dotenv";
import app from "./app";
import { pool } from "./config/database";

dotenv.config();

const PORT = process.env.PORT || 3001;


// Inicia el servidor solo si la conexión a la base de datos es exitosa
async function iniciarServidor() {
    try {
        await pool.query("SELECT 1");

        console.log("Conexion a la base de datos exitosa");

        app.listen(PORT, () => {
            console.log(`Servidor escuchando en el puerto ${PORT}`);
        });
    }
    catch (error) {
        console.error("No se pudo conectar a la base de datos");
        console.error(error);
        // Salgo del proceso con un código de error
        process.exit(1); 
    }
}

iniciarServidor();