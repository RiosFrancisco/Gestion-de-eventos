import { createEvento } from "../repositories/evento.repository";
import { CrearEvento, Evento } from "../models/evento.model";
import { getCategoriasById } from "../repositories/categorias.repository";

export async function crearEvento(creadorId: number, datos: CrearEvento): Promise<Evento> {
    const fechaEvento = new Date(`${datos.fecha}T${datos.hora}:00`);

    const ahora = new Date();

    if (fechaEvento <= ahora) {
        throw new Error("La fecha no puede ser pasada"
        );
    }

    const categoria = await getCategoriasById(datos.categoria_id);

    if(!categoria) {
        throw new Error("La categoria seleccionada no existe");
    }

    return await createEvento(
        creadorId,
        datos
    );
}

