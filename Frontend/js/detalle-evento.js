// Festival Manager — detalle e inscripciones (sin registro de asistencia presencial).
const API_BASE = "https://gestion-de-eventos-8jyw.onrender.com/api";
const SESSION_KEY = "festival_sesion";
const eventoId = new URLSearchParams(window.location.search).get("id");
const $ = (selector) => document.querySelector(selector);

const titulo = $("#detalle-titulo");
const descripcion = $("#detalle-descripcion");
const metadatos = $("#detalle-metadata");
const listado = $("#activity-list");
const botonEvento = $("#inscribir-evento");
const mensaje = $("#detalle-mensaje");
const acceso = $("#detalle-acceso");

let eventoActual = null;
let actividadesActuales = [];
let inscripcionEventoActiva = false;
let inscripcionesActividades = new Set();

function sesionActual() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function notificar(texto, esError = false) {
  mensaje.textContent = texto;
  mensaje.dataset.error = String(esError);
}

function elemento(etiqueta, clase, texto) {
  const nodo = document.createElement(etiqueta);
  if (clase) nodo.className = clase;
  if (texto !== undefined) nodo.textContent = String(texto);
  return nodo;
}

function fechaLegible(fecha, hora = "") {
  if (!fecha) return "Fecha a confirmar";
  const parte = String(fecha).slice(0, 10).split("-");
  const fechaTexto =
    parte.length === 3 ? `${parte[2]}/${parte[1]}/${parte[0]}` : String(fecha);
  return `${fechaTexto}${hora ? ` · ${String(hora).slice(0, 5)} hs` : ""}`;
}

function esFuturo(item) {
  if (!item?.fecha || !item?.hora) return false;
  const fecha = new Date(
    `${String(item.fecha).slice(0, 10)}T${String(item.hora).slice(0, 8)}`,
  );
  return Number.isFinite(fecha.getTime()) && fecha > new Date();
}

function disponible(item) {
  return item?.estado === "publicado" && esFuturo(item);
}

async function solicitar(ruta, opciones = {}) {
  const respuesta = await fetch(`${API_BASE}${ruta}`, opciones);
  const resultado = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    const error = new Error(
      resultado.message || `Error HTTP ${respuesta.status}`,
    );
    error.status = respuesta.status;
    throw error;
  }
  return resultado;
}

function encabezadosSesion() {
  const token = sesionActual()?.token;
  if (!token)
    throw new Error(
      "Iniciá sesión desde la página principal para inscribirte.",
    );
  return { Authorization: `Bearer ${token}` };
}

async function cargarInscripciones() {
  inscripcionEventoActiva = false;
  inscripcionesActividades = new Set();
  if (!sesionActual()?.token) return;

  try {
    const headers = encabezadosSesion();
    const [eventos, actividades] = await Promise.all([
      solicitar("/inscripciones/eventos/misEventos", { headers }),
      solicitar("/inscripciones/actividades/misActividades", { headers }),
    ]);
    inscripcionEventoActiva = (eventos.inscripciones || []).some(
      (registro) =>
        Number(registro.evento_id) === Number(eventoId) &&
        registro.estado === "activa",
    );
    inscripcionesActividades = new Set(
      (actividades.inscripciones || [])
        .filter((registro) => registro.estado === "activa")
        .map((registro) => Number(registro.actividad_id)),
    );
  } catch (error) {
    notificar(
      `No se pudo comprobar el estado de las inscripciones: ${error.message}`,
      true,
    );
    // No permitir enviar nuevas inscripciones hasta conocer el estado actual.
    throw error;
  }
}

function mostrarEvento() {
  titulo.textContent = eventoActual.nombre || "Evento";
  descripcion.textContent =
    eventoActual.descripcion || "Sin descripción disponible.";
  metadatos.replaceChildren(
    elemento(
      "span",
      "",
      `Fecha: ${fechaLegible(eventoActual.fecha, eventoActual.hora)}`,
    ),
    elemento("span", "", `Lugar: ${eventoActual.ubicacion || "A confirmar"}`),
    elemento("span", "", `Estado: ${eventoActual.estado || "No informado"}`),
  );
  const autenticado = Boolean(sesionActual()?.token);
  if (acceso) {
    acceso.hidden = autenticado;
  }
  if (inscripcionEventoActiva) {
    botonEvento.textContent = "Ya estás inscrito al evento";
    botonEvento.disabled = true;
  } else {
    botonEvento.textContent = "Inscribirme al evento";
    botonEvento.disabled = !autenticado || !disponible(eventoActual);
  }
}

function tarjetaActividad(actividad) {
  const tarjeta = elemento("article", "activity-card");
  tarjeta.appendChild(elemento("h3", "", actividad.nombre || "Actividad"));
  tarjeta.appendChild(
    elemento("p", "", actividad.descripcion || "Sin descripción disponible."),
  );

  const pie = elemento("div", "activity-card__bottom");
  pie.appendChild(
    elemento(
      "span",
      "",
      `Fecha: ${fechaLegible(actividad.fecha, actividad.hora)} · Cupos: ${actividad.capacidad ?? "Sin límite"}`,
    ),
  );
  const boton = elemento(
    "button",
    "event-action",
    "Inscribirme a esta actividad",
  );
  boton.type = "button";
  const inscrita = inscripcionesActividades.has(Number(actividad.id));
  const puedeInscribirse =
    Boolean(sesionActual()?.token) &&
    inscripcionEventoActiva &&
    disponible(eventoActual) &&
    disponible(actividad);

  if (inscrita) {
    boton.textContent = "Ya estás inscrito a esta actividad";
    boton.disabled = true;
  } else {
    boton.disabled = !puedeInscribirse;
    if (!inscripcionEventoActiva && sesionActual()?.token) {
      boton.title = "Primero tenés que inscribirte al evento";
    }
  }

  boton.addEventListener("click", async () => {
    boton.disabled = true;
    try {
      await solicitar(
        `/inscripciones/actividades/${encodeURIComponent(actividad.id)}`,
        {
          method: "POST",
          headers: encabezadosSesion(),
        },
      );
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
  if (actividadesActuales.length === 0) {
    listado.appendChild(
      elemento(
        "p",
        "events-message",
        "Este evento todavía no tiene actividades.",
      ),
    );
    return;
  }
  actividadesActuales.forEach((actividad) =>
    listado.appendChild(tarjetaActividad(actividad)),
  );
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
    // 1. Obtener el evento y sus actividades
    const [respuestaEvento, respuestaActividades] = await Promise.all([
      solicitar(`/eventos/${encodeURIComponent(eventoId)}`),
      solicitar(`/actividades/evento/${encodeURIComponent(eventoId)}`),
    ]);

    eventoActual = respuestaEvento.evento ?? respuestaEvento;

    actividadesActuales = respuestaActividades.actividades ?? [];

    if (!Array.isArray(actividadesActuales)) {
      throw new Error("Respuesta de actividades inválida");
    }

    // 2. Mostrar la información pública inmediatamente
    mostrarEvento();
    mostrarActividades();
  } catch (error) {
    notificar(error.message, true);
    botonEvento.disabled = true;

    listado.replaceChildren(
      elemento(
        "p",
        "events-message error",
        "No se pudo cargar el detalle del evento.",
      ),
    );

    return;
  }

  // 3. Consultar las inscripciones por separado
  try {
    await cargarInscripciones();

    // 4. Actualizar botones según las inscripciones existentes
    mostrarEvento();
    mostrarActividades();
  } catch (error) {
    console.error("Error al cargar inscripciones:", error);

    // Evitar inscripciones mientras no se conoce su estado
    botonEvento.disabled = true;

    listado.querySelectorAll("button").forEach((boton) => {
      boton.disabled = true;
    });
  }
}

botonEvento.addEventListener("click", async () => {
  botonEvento.disabled = true;
  try {
    await solicitar(`/inscripciones/eventos/${encodeURIComponent(eventoId)}`, {
      method: "POST",
      headers: encabezadosSesion(),
    });
    inscripcionEventoActiva = true;
    notificar("Te inscribiste al evento. Ahora podés elegir sus actividades.");
    mostrarEvento();
    mostrarActividades();
  } catch (error) {
    notificar(error.message, true);
    mostrarEvento();
  }
});

iniciar();
