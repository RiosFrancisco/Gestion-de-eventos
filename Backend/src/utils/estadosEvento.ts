export const EstadoEvento = {
    publicado: "publicado",
    finalizado: "finalizado",
    cancelado: "cancelado"
} as const;

export type EstadoEvento =
    typeof EstadoEvento[keyof typeof EstadoEvento];