import { solicitar } from "./shared/api.js";
import { obtenerSesion, encabezadosSesion } from "./shared/sesion.js";
import { fechaLegible, disponible } from "./shared/formato.js";

const eventoId = new URLSearchParams(location.search).get("id");
const $ = selector => document.querySelector(selector);
const titulo = $("#detalle-titulo");
const descripcion = $("#detalle-descripcion");
const metadatos = $("#detalle-metadata");
const listado = $("#activity-list");
const botonEvento = $("#inscribir-evento");
const mensaje = $("#detalle-mensaje");
const acceso = $("#detalle-acceso");

let eventoActual;
let actividadesActuales = [];
let inscripcionEventoActiva = false;
let inscripcionesActividades = new Set();
let inscripcionesVerificadas = false;

function elemento(etiqueta, clase = "", texto) {
  const nodo = document.createElement(etiqueta);
  if (clase) nodo.className = clase;
  if (texto !== undefined) nodo.textContent = String(texto);
  return nodo;
}

function notificar(texto, esError = false) {
  mensaje.textContent = texto;
  mensaje.dataset.error = String(esError);
}

async function cargarInscripciones() {
  inscripcionEventoActiva = false;
  inscripcionesActividades = new Set();
  inscripcionesVerificadas = false;
  if (!obtenerSesion()?.token) return;

  const headers = encabezadosSesion();
  const [eventos, actividades] = await Promise.all([
    solicitar("/inscripciones/eventos/misEventos", { headers }),
    solicitar("/inscripciones/actividades/misActividades", { headers })
  ]);

  inscripcionEventoActiva = (eventos.inscripciones || []).some(
    registro => Number(registro.evento_id) === Number(eventoId) && registro.estado === "activa"
  );
  inscripcionesActividades = new Set(
    (actividades.inscripciones || [])
      .filter(registro => registro.estado === "activa")
      .map(registro => Number(registro.actividad_id))
  );
  inscripcionesVerificadas = true;
}

function mostrarEvento() {
  titulo.textContent = eventoActual.nombre || "Evento";
  descripcion.textContent = eventoActual.descripcion || "Sin descripción disponible.";
  metadatos.replaceChildren(
    elemento("span", "", `Fecha: ${fechaLegible(eventoActual.fecha, eventoActual.hora)}`),
    elemento("span", "", `Lugar: ${eventoActual.ubicacion || "A confirmar"}`),
    elemento("span", "", `Estado: ${eventoActual.estado || "No informado"}`)
  );

  const autenticado = Boolean(obtenerSesion()?.token);
  if (acceso) acceso.hidden = autenticado;

  if (inscripcionEventoActiva) {
    botonEvento.textContent = "Ya estás inscrito al evento";
  } else if (eventoActual.estado === "cancelado") {
    botonEvento.textContent = "Evento cancelado";
  } else if (eventoActual.estado === "finalizado") {
    botonEvento.textContent = "Evento finalizado";
  } else {
    botonEvento.textContent = "Inscribirme al evento";
  }
  botonEvento.disabled = !autenticado || !inscripcionesVerificadas ||
    inscripcionEventoActiva || !disponible(eventoActual);
}

function tarjetaActividad(actividad) {
  const tarjeta = elemento("article", "activity-card");
  tarjeta.append(
    elemento("h3", "", actividad.nombre || "Actividad"),
    elemento("p", "", actividad.descripcion || "Sin descripción disponible.")
  );

  const pie = elemento("div", "activity-card__bottom");
  pie.appendChild(elemento(
    "span", "", `Fecha: ${fechaLegible(actividad.fecha, actividad.hora)} · Cupos: ${actividad.capacidad ?? "Sin límite"}`
  ));

  const inscrita = inscripcionesActividades.has(Number(actividad.id));
  const boton = elemento("button", "event-action", inscrita
    ? "Ya estás inscrito a esta actividad" : "Inscribirme a esta actividad");
  boton.type = "button";
  boton.disabled = !inscripcionesVerificadas || inscrita ||
    !inscripcionEventoActiva || !disponible(eventoActual) || !disponible(actividad);
  if (!inscripcionEventoActiva) boton.title = "Primero tenés que inscribirte al evento";

  boton.addEventListener("click", async () => {
    boton.disabled = true;
    try {
      await solicitar(`/inscripciones/actividades/${encodeURIComponent(actividad.id)}`, {
        method: "POST", headers: encabezadosSesion()
      });
      inscripcionesActividades.add(Number(actividad.id));
      notificar("Te inscribiste correctamente a la actividad.");
      mostrarActividades();
    } catch (error) {
      notificar(error.message, true);
      boton.disabled = false;
    }
  });

  pie.appendChild(boton);
  tarjeta.appendChild(pie);
  return tarjeta;
}

function mostrarActividades() {
  listado.replaceChildren();
  if (!actividadesActuales.length) {
    listado.appendChild(elemento("p", "events-message", "Este evento todavía no tiene actividades."));
    return;
  }
  actividadesActuales.forEach(actividad => listado.appendChild(tarjetaActividad(actividad)));
}

async function iniciar() {
  if (!/^[1-9]\d*$/.test(eventoId || "")) {
    notificar("ID de evento inválido.", true);
    botonEvento.disabled = true;
    listado.replaceChildren();
    return;
  }

  botonEvento.disabled = true;
  try {
    const [respuestaEvento, respuestaActividades] = await Promise.all([
      solicitar(`/eventos/${encodeURIComponent(eventoId)}`),
      solicitar(`/actividades/evento/${encodeURIComponent(eventoId)}`)
    ]);
    eventoActual = respuestaEvento.evento ?? respuestaEvento;
    actividadesActuales = respuestaActividades.actividades ?? [];
    if (!Array.isArray(actividadesActuales)) throw new Error("Respuesta de actividades inválida");
    mostrarEvento();
    mostrarActividades();
  } catch (error) {
    notificar(error.message, true);
    listado.replaceChildren(elemento("p", "events-message error", "No se pudo cargar el detalle del evento."));
    return;
  }

  try {
    await cargarInscripciones();
    mostrarEvento();
    mostrarActividades();
  } catch (error) {
    // El evento público sigue visible aunque el servicio de inscripciones falle.
    notificar(`No se pudo comprobar el estado de las inscripciones: ${error.message}`, true);
    mostrarEvento();
    mostrarActividades();
  }
}

botonEvento.addEventListener("click", async () => {
  botonEvento.disabled = true;
  try {
    await solicitar(`/inscripciones/eventos/${encodeURIComponent(eventoId)}`, {
      method: "POST", headers: encabezadosSesion()
    });
    inscripcionEventoActiva = true;
    notificar("Te inscribiste al evento. Ahora podés elegir sus actividades.");
  } catch (error) {
    notificar(error.message, true);
  }
  mostrarEvento();
  mostrarActividades();
});

iniciar();
