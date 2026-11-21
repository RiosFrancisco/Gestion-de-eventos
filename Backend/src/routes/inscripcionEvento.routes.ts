
import { Router } from "express";

import { authMiddleware } from "../middleware/auth.middleware";

import {
    inscribirseEventoController,
    cancelarInscripcionEventoController,
    listarMisInscripcionesController
} from "../controllers/inscripcionEvento.controller";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Consultar mis inscripciones
router.get(
    "/misInsc",
    listarMisInscripcionesController
);

// Inscribirse o reinscribirse a un evento
router.post(
    "/:eventoId",
    inscribirseEventoController
);

// Cancelar una inscripción
router.patch(
    "/:eventoId/cancelar",
    cancelarInscripcionEventoController
);

export default router;
