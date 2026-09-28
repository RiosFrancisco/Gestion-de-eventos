import { Router } from "express";
import { register, login } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { validarRol } from "../middleware/roles.middleware";
import { ROLES } from "../utils/roles";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/protegida", authMiddleware, (req, res) => {
    res.status(200).json({
        message: "Acceso autorizado"
    });
});

router.get("/admin", authMiddleware, validarRol(ROLES.admin), (req, res) => {
    res.status(200).json({
        message: "Acceso autorizado para admin"
    });
})

router.get("/creador", authMiddleware, validarRol(ROLES.creador, ROLES.admin), (req, res) => {
    res.status(200).json({
        message: "Acceso autorizado para creador o admin"
    })
})


export default router;