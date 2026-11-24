import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";

import {
    inscribirseActividadController,
    cancelarInscripcionActividadController,
    listarMisInscripcionesActividadController
} from "../controllers/inscripcionActividad.controller";

const router = Router();

router.use(authMiddleware);
router.get("/misActividades", listarMisInscripcionesActividadController);
router.post("/:actividadId", inscribirseActividadController);
router.patch("/:actividadId/cancelar", cancelarInscripcionActividadController);

export default router;
