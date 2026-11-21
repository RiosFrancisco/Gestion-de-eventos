import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { validarRol } from "../middleware/roles.middleware";
import { ROLES } from "../utils/roles";

import {
    listarUsuariosController,
    cambiarRolController
} from "../controllers/usuario.controller";

const router = Router();


router.get(
    "/",
    authMiddleware,
    validarRol(ROLES.admin),
    listarUsuariosController
);


router.patch(
    "/:id/rol",
    authMiddleware,
    validarRol(ROLES.admin),
    cambiarRolController
);

export default router;
