export function mapEvento (evento: any) {
    return {
        ...evento,
        id: Number(evento.id),
        creador_id: Number(evento.creador_id),
        categoria_id: Number(evento.categoria_id)
    };
}