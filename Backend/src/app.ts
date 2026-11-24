import express from "express";
import authRoutes from "./routes/auth.routes";
import eventoRoutes from "./routes/evento.routes";
import actividadRoutes from "./routes/actividad.routes";
import usuarioRoutes from "./routes/usuario.routes";
import inscripcionEventoRoutes from "./routes/inscripcionEvento.routes";
import inscripcionActividadRoutes from "./routes/inscripcionActividad.routes";
import cors from "cors";
import { errorMiddleware } from "./middleware/error.middleware";

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://festival-manager-r5le.onrender.com",
    ],
  }),
);

app.use(express.json());

// rutas
app.use("/api/auth", authRoutes);
app.use("/api/eventos", eventoRoutes);
app.use("/api/actividades", actividadRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/inscripciones/eventos", inscripcionEventoRoutes);
app.use("/api/inscripciones/actividades", inscripcionActividadRoutes);

// ruta de comprobacion de backend funcionando
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
  });
});

app.use(errorMiddleware);

export default app;
