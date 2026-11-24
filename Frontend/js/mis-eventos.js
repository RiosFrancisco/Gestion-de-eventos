import { solicitar, headersAuth } from "./shared/api.js";
import { obtenerSesion, cerrarSesion } from "./shared/sesion.js";
import { fechaConHora } from "./shared/formato.js";

const lista = document.getElementById("mis-eventos-lista");
const aviso = document.getElementById("mis-eventos-mensaje");
const editor = document.getElementById("editar-evento-dialog");
const formEditar = document.getElementById("editar-evento-form");
const dialogoActividad = document.getElementById("crear-actividad-dialog");
const formActividad = document.getElementById("crear-actividad-form");
let eventoEditado = null;
let eventoActividad = null;
let eventosActuales = [];

const nodo = (tag, clase, valor) => {
  const n = document.createElement(tag);
  if (clase) n.className = clase;
  if (valor !== undefined) n.textContent = String(valor);
  return n;
};

function informar(texto, error = false) {
  aviso.textContent = texto;
  aviso.dataset.error = String(error);
}

function sesionValida() {
  const sesion = obtenerSesion();
  if (!sesion?.token || !sesion?.usuario) {
    window.location.replace("/pages/index.html");
    return null;
  }
  if (Number(sesion.usuario.rol_id) !== 2) {
    informar("Solo los usuarios con rol creador pueden administrar eventos.", true);
    lista.replaceChildren();
    return null;
  }
  return sesion;
}

function campo(label, valor) {
  const p = nodo("p", "event-date");
  const strong = nodo("strong", "", `${label}: `);
  p.append(strong, document.createTextNode(String(valor ?? "")));
  return p;
}

function boton(texto, accion) {
  const b = nodo("button", "mis-eventos-boton", texto);
  b.type = "button";
  b.addEventListener("click", accion);
  return b;
}

function abrirEditor(evento) {
  eventoEditado = evento;
  for (const nombre of ["nombre", "descripcion", "fecha", "hora", "ubicacion"]) {
    formEditar.elements[nombre].value = String(evento[nombre] ?? "").slice(0, nombre === "fecha" ? 10 : undefined);
  }
  editor.showModal();
}

function abrirNuevaActividad(evento) {
  eventoActividad = evento;
  formActividad.reset();
  dialogoActividad.showModal();
}

async function cancelarEvento(evento) {
  if (!window.confirm(`¿Cancelar el evento «${evento.nombre}»?`)) return;
  try {
    await solicitar(`/eventos/${evento.id}/cancelar`, {
      method: "PATCH",
      headers: headersAuth(obtenerSesion()?.token)
    });
    await cargarMisEventos();
    informar("Evento cancelado correctamente.");
  } catch (error) {
    informar(error.message, true);
  }
}

function tarjeta(evento) {
  const article = nodo("article", "event-container");
  const info = nodo("div", "event-info");
  const estado = nodo("span", `status ${evento.estado === "cancelado" ? "status-cancelled" : evento.estado === "finalizado" ? "status-finished" : "status-next"}`, evento.estado);
  info.append(
    nodo("h4", "", evento.nombre), estado,
    campo("Fecha", fechaConHora(evento.fecha, evento.hora)),
    campo("Lugar", evento.ubicacion),
    nodo("p", "", evento.descripcion || ""),
    campo("Categoría", evento.categoria || "General")
  );
  const acciones = nodo("div", "mis-eventos-acciones");
  const ver = nodo("a", "mis-eventos-boton", "Ver detalles y actividades");
  ver.href = `/pages/detalle_evento.html?id=${encodeURIComponent(evento.id)}`;
  acciones.append(ver);
  if (evento.estado === "publicado") {
    acciones.append(
      boton("Modificar", () => abrirEditor(evento)),
      boton("Agregar actividad", () => abrirNuevaActividad(evento)),
      boton("Cancelar", () => cancelarEvento(evento))
    );
  }
  info.append(acciones);
  article.append(info);
  return article;
}

async function cargarMisEventos() {
  const sesion = sesionValida();
  if (!sesion) return;
  informar("Cargando tus eventos...");
  lista.replaceChildren();
  try {
    const datos = await solicitar("/eventos/mios", { headers: headersAuth(sesion.token) });
    if (!Array.isArray(datos.eventos)) throw new Error("Formato de eventos inesperado.");
    eventosActuales = datos.eventos;
    document.getElementById("total-eventos").textContent = String(eventosActuales.length);
    document.getElementById("eventos-publicados").textContent = String(eventosActuales.filter(e => e.estado === "publicado").length);
    document.getElementById("eventos-finalizados").textContent = String(eventosActuales.filter(e => e.estado === "finalizado").length);
    informar(eventosActuales.length ? "" : "Todavía no creaste eventos.");
    eventosActuales.forEach(e => lista.append(tarjeta(e)));
  } catch (error) {
    if (error.status === 401) {
      cerrarSesion(); window.location.replace("/pages/index.html"); return;
    }
    informar(error.status === 404
      ? "El backend desplegado todavía no incluye GET /api/eventos/mios. Tenés que desplegar el cambio incluido."
      : error.message, true);
  }
}

formEditar.addEventListener("submit", async e => {
  e.preventDefault();
  if (!eventoEditado || !sesionValida()) return;
  const valores = Object.fromEntries(new FormData(formEditar));
  const cambios = {};
  for (const nombre of ["nombre", "descripcion", "fecha", "hora", "ubicacion"]) {
    const anterior = String(eventoEditado[nombre] ?? "").slice(0, nombre === "fecha" ? 10 : undefined);
    if (valores[nombre].trim() !== anterior) cambios[nombre] = valores[nombre].trim();
  }
  if (!Object.keys(cambios).length) return informar("No hay cambios para guardar.");
  const enviar = formEditar.querySelector('[type="submit"]');
  enviar.disabled = true;
  try {
    await solicitar(`/eventos/${eventoEditado.id}`, {
      method: "PATCH", headers: headersAuth(obtenerSesion()?.token, true), body: JSON.stringify(cambios)
    });
    editor.close();
    await cargarMisEventos();
    informar("Evento modificado correctamente.");
  } catch (error) { informar(error.message, true); }
  finally { enviar.disabled = false; }
});

formActividad.addEventListener("submit", async e => {
  e.preventDefault();
  if (!eventoActividad || !sesionValida()) return;
  const datos = Object.fromEntries(new FormData(formActividad));
  const payload = {
    evento_id: Number(eventoActividad.id),
    nombre: datos.nombre.trim(),
    descripcion: datos.descripcion.trim(),
    fecha: datos.fecha,
    hora: datos.hora,
    capacidad: datos.capacidad === "" ? null : Number(datos.capacidad)
  };
  const enviar = formActividad.querySelector('[type="submit"]');
  enviar.disabled = true;
  try {
    await solicitar("/actividades", {
      method: "POST", headers: headersAuth(obtenerSesion()?.token, true), body: JSON.stringify(payload)
    });
    dialogoActividad.close();
    informar("Actividad creada correctamente. Podés verla en el detalle del evento.");
  } catch (error) { informar(error.message, true); }
  finally { enviar.disabled = false; }
});

document.getElementById("cerrar-edicion")?.addEventListener("click", () => editor.close());
document.getElementById("cerrar-actividad")?.addEventListener("click", () => dialogoActividad.close());
document.getElementById("logout-button")?.addEventListener("click", () => {
  cerrarSesion(); window.location.replace("/pages/index.html");
});
document.getElementById("user-button")?.addEventListener("click", () => {
  window.location.href = "/pages/perfil.html";
});
document.getElementById("add-button")?.addEventListener("click", () => {
  window.location.href = "/pages/index.html#crear-evento";
});
document.getElementById("search-button")?.addEventListener("click", () => {
  window.location.href = "/pages/index.html";
});

const usuario = sesionValida();
if (usuario) {
  document.getElementById("user-status").textContent = usuario.usuario.nombre;
  void cargarMisEventos();
}
