import express from "express";
import authRoutes from "./routes/auth.routes";
import eventoRoutes from "./routes/evento.routes"

const app = express();

app.use(express.json());


// rutas
app.use("/api/auth", authRoutes);
app.use("/api/eventos", eventoRoutes)


// ruta de comprobacion de backend funcionando
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok"
    });
});

export default app;