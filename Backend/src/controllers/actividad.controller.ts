import { Request, Response } from 'express';
import { listarActividadesPorEvento } from '../services/actividad.service';

export const getActividadesController = async (req: Request, res: Response) => {
    try {
        const eventoId = parseInt(String(req.params.eventoId), 10);
        const actividades = await listarActividadesPorEvento(eventoId);

        return res.status(200).json({
        success: true,
        data: actividades,
        });
    } catch (error: any) {
        return res.status(400).json({
        success: false,
        message: error.message || 'Error al obtener actividades',
        });
    }
};