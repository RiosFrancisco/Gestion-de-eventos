import {
    crearInscripcionActividad,
    getInscripcionActividad,
    cancelarInscripcionActividad,
    getInscripcionesActividadByUsuario
} from "../repositories/inscripcionActividad.repository";
import { AppError } from "../errors/appError";


// Inscribirse o reinscribirse a una actividad.
export async function inscribirseActividad(
    usuarioId: number,
    actividadId: number
) {
    const resultado = await crearInscripcionActividad(
        usuarioId,
        actividadId
    );

    switch (resultado.tipo) {
        case "ok":
            return resultado.inscripcion;

        case "actividad no existe":
            throw new AppError(
                404,
                "Actividad no encontrada"
            );

        case "evento no inscrito":
            throw new AppError(
                409,
                "Debe estar inscrito al evento para participar"
            );

        case "evento no disponible":
            throw new AppError(
                409,
                "El evento no admite inscripciones"
            );

        case "actividad no disponible":
            throw new AppError(
                409,
                "La actividad no admite inscripciones"
            );

        case "sin cupo":
            throw new AppError(
                409,
                "No quedan cupos disponibles"
            );

        case "ya inscrito":
            throw new AppError(
                409,
                "Ya estas inscrito en esta actividad"
            );
        default: {
            const resultadoNoEsperado: never = resultado;
            return resultadoNoEsperado;
        }
    }
}


// Cancelar inscripción propia.
export async function cancelarInscripcionActividadService(
    usuarioId: number,
    actividadId: number
) {
    const inscripcion = await getInscripcionActividad(
        usuarioId,
        actividadId
    );

    if (!inscripcion) {
        throw new AppError(
            404,
            "Inscripcion no encontrada"
        );
    }

    if (inscripcion.estado === "cancelada") {
        throw new AppError(
            409,
            "La inscripcion ya esta cancelada"
        );
    }

    const cancelada = await cancelarInscripcionActividad(
        usuarioId,
        actividadId
    );

    if (!cancelada) {
        throw new AppError(
            409,
            "No se pudo cancelar la inscripcion"
        );
    }

    return cancelada;
}


// Consultar las inscripciones del usuario autenticado.
export async function listarMisInscripcionesActividad(
    usuarioId: number
) {
    return getInscripcionesActividadByUsuario(usuarioId);
}
