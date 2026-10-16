import { Router } from "express";
import { getActividadesController } from "../controllers/actividad.controller";

const router = Router()

router.get('/evento/:eventoId', getActividadesController);

export default router;