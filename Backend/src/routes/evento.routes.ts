import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { validarRol } from "../middleware/roles.middleware";
import { ROLES } from "../utils/roles"
import {
        createEventoController,
        listarEventosController,
        getEventoByIdController,
        updateEventoController,
        cancelarEventoController,
        activarEventoController
} from "../controllers/evento.controller";

const router = Router();

router.post("/",
        authMiddleware,
        validarRol(ROLES.creador, ROLES.admin),
        createEventoController);

router.get("/", listarEventosController);

router.get("/:id", getEventoByIdController);

router.patch("/:id",
        authMiddleware,
        validarRol(ROLES.admin, ROLES.creador),
        updateEventoController);

router.patch("/:id/cancelar",
        authMiddleware,
        validarRol(ROLES.admin, ROLES.creador),
        cancelarEventoController);

router.patch("/:id/activar",
        authMiddleware,
        validarRol(ROLES.admin, ROLES.creador),
        activarEventoController);

export default router;