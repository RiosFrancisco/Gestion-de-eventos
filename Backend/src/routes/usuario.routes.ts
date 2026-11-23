import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { validarRol } from "../middleware/roles.middleware";
import { ROLES } from "../utils/roles";
import {
    listarUsuariosController,
    cambiarRolController,
    modificarDatosUsuarioController,
    obtenerMiPerfilController,
    actualizarMiPerfilController
} from "../controllers/usuario.controller";

const router = Router();

router.get("/perfil", authMiddleware, obtenerMiPerfilController);
router.patch("/perfil", authMiddleware, actualizarMiPerfilController);

router.get("/", authMiddleware, validarRol(ROLES.admin), listarUsuariosController);
router.patch("/:id/rol", authMiddleware, validarRol(ROLES.admin), cambiarRolController);
router.patch("/:id", modificarDatosUsuarioController);

export default router;
