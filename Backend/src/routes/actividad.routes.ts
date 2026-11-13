
import { Router } from "express";

import { authMiddleware } from "../middleware/auth.middleware";
import { validarRol } from "../middleware/roles.middleware";
import { ROLES } from "../utils/roles";

import {
    listarActividadesController,
    obtenerActividadController,
    crearActividadController,
    actualizarActividadController,
    cancelarActividadController
} from "../controllers/actividad.controller";

const router = Router();

router.get(
    "/evento/:eventoId",
    listarActividadesController
);

router.get(
    "/:id",
    obtenerActividadController
);

router.post(
    "/",
    authMiddleware,
    validarRol(ROLES.creador, ROLES.admin),
    crearActividadController
);

router.patch(
    "/:id",
    authMiddleware,
    validarRol(ROLES.creador, ROLES.admin),
    actualizarActividadController
);

router.patch(
    "/:id/cancelar",
    authMiddleware,
    validarRol(ROLES.creador, ROLES.admin),
    cancelarActividadController
);

export default router;
