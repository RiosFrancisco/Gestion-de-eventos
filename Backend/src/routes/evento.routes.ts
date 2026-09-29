import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { validarRol } from "../middleware/roles.middleware";
import { ROLES } from "../utils/roles"
import { createEventoController, listarEventosController, getEventoByIdController } from "../controllers/evento.controller";

const router = Router();

router.post("/",
            authMiddleware,
            validarRol(ROLES.creador, ROLES.admin),
            createEventoController);

router.get("/", listarEventosController);
router.get("/:id", getEventoByIdController);


export default router;