import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
    inscribirseEventoController,
    cancelarInscripcionEventoController,
    listarMisInscripcionesController
} from "../controllers/inscripcionEvento.controller";
const router = Router();


router.use(authMiddleware);

router.get("/misEventos", listarMisInscripcionesController);
router.post("/:eventoId", inscribirseEventoController);
router.patch("/:eventoId/cancelar", cancelarInscripcionEventoController);

export default router;
