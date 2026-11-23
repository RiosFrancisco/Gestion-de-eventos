const API_URL = "[https://gestion-de-eventos-8jyw.onrender.com](https://gestion-de-eventos-8jyw.onrender.com)";
const SESSION_KEY = "festival_sesion";

let sesion = recuperarSesion();

document.addEventListener("DOMContentLoaded", () => {
  if (!sesion?.token || !sesion?.usuario) {
    window.location.href = "/pages/index.html";
    return;
  }

  configurarNavegacion();
  renderizarDatosUsuario(sesion.usuario);
  cargarPerfilServidor();
  cargarInscripcionesEventos();
  cargarInscripcionesActividades();
});

function recuperarSesion() {
  try {
    const dato = sessionStorage.getItem(SESSION_KEY);
    return dato ? JSON.parse(dato) : null;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function guardarSesion(usuarioActualizado) {
  sesion = { ...sesion, usuario: usuarioActualizado };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(sesion));
}

function cerrarSesion() {
  sesion = null;
  sessionStorage.removeItem(SESSION_KEY);
  window.location.href = "/pages/index.html";
}

function obtenerNombreRol(rolId) {
  const id = Number(rolId);
  if (id === 3) return "Administrador";
  if (id === 2) return "Creador de eventos";
  return "Participante";
}

function formatearFechaSimple(fechaIso) {
  if (!fechaIso) return "";
  const [anio, mes, dia] = String(fechaIso).slice(0, 10).split("-");
  return `${dia}/${mes}/${anio}`;
}

function mostrarMensaje(texto, tipo = "error") {
  const elemento = document.getElementById("perfil-message");
  if (!elemento) return;
  elemento.textContent = texto;
  elemento.className = `form-message ${tipo}`;
}

function configurarNavegacion() {
  const irInicio = () => {
    window.location.href = "/pages/index.html";
  };

  document.getElementById("logo")?.addEventListener("click", irInicio);
  document
    .getElementById("back-home-button")
    ?.addEventListener("click", irInicio);
  document
    .getElementById("volver-inicio-btn")
    ?.addEventListener("click", irInicio);
  document
    .getElementById("logout-button")
    ?.addEventListener("click", cerrarSesion);

  document
    .getElementById("perfil-form")
    ?.addEventListener("submit", actualizarPerfil);
}

function renderizarDatosUsuario(usuario) {
  document.getElementById("user-status").textContent = usuario.nombre;
  document.getElementById("perfil-nombre-titulo").textContent = usuario.nombre;
  document.getElementById("perfil-email-subtitulo").textContent = usuario.email;
  document.getElementById("perfil-rol-badge").textContent = obtenerNombreRol(
    usuario.rol_id,
  );

  const formulario = document.getElementById("perfil-form");
  if (formulario) {
    formulario.elements.nombre.value = usuario.nombre || "";
    formulario.elements.email.value = usuario.email || "";
  }

  const fechaTexto = formatearFechaSimple(usuario.created_at);
  if (fechaTexto) {
    document.getElementById("perfil-fecha-registro").textContent =
      `Miembro desde el ${fechaTexto}`;
  }
}

async function cargarPerfilServidor() {
  try {
    const respuesta = await fetch(`${API_URL}/usuarios/perfil`, {
      headers: { Authorization: `Bearer ${sesion.token}` },
    });

    if (respuesta.status === 401 || respuesta.status === 403) {
      cerrarSesion();
      return;
    }

    if (!respuesta.ok) return;

    const { usuario } = await respuesta.json();
    if (usuario) {
      guardarSesion(usuario);
      renderizarDatosUsuario(usuario);
    }
  } catch (error) {
    console.warn("No se pudo sincronizar el perfil con el servidor:", error);
  }
}

async function actualizarPerfil(event) {
  event.preventDefault();
  const formulario = event.currentTarget;
  const boton = formulario.querySelector('[type="submit"]');

  const nombre = formulario.elements.nombre.value.trim();
  const email = formulario.elements.email.value.trim();

  const payload = {};
  if (nombre && nombre !== sesion.usuario.nombre) payload.nombre = nombre;
  if (email && email !== sesion.usuario.email) payload.email = email;

  if (Object.keys(payload).length === 0) {
    mostrarMensaje("No realizaste cambios para guardar.", "error");
    return;
  }

  boton.disabled = true;
  mostrarMensaje("Guardando cambios...", "success");

  try {
    const respuesta = await fetch(`${API_URL}/usuarios/perfil`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sesion.token}`,
      },
      body: JSON.stringify(payload),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      if (respuesta.status === 401) cerrarSesion();
      throw new Error(resultado.message || "No se pudo actualizar el perfil.");
    }

    guardarSesion(resultado.usuario);
    renderizarDatosUsuario(resultado.usuario);
    mostrarMensaje("Datos actualizados correctamente.", "success");
  } catch (error) {
    mostrarMensaje(error.message || "Error de conexión.", "error");
  } finally {
    boton.disabled = false;
  }
}

async function cargarInscripcionesEventos() {
  const lista = document.getElementById("lista-inscripciones-eventos");
  if (!lista) return;

  try {
    const respuesta = await fetch(
      `${API_URL}/inscripciones/eventos/misEventos`,
      {
        headers: { Authorization: `Bearer ${sesion.token}` },
      },
    );

    if (!respuesta.ok) throw new Error("Error al obtener inscripciones");

    const data = await respuesta.json();
    const inscripciones = data.inscripciones || data.eventos || [];

    lista.replaceChildren();

    if (!Array.isArray(inscripciones) || inscripciones.length === 0) {
      const li = document.createElement("li");
      li.className = "form-hint";
      li.textContent = "Aún no estás inscripto a ningún evento.";
      lista.appendChild(li);
      return;
    }

    inscripciones.forEach((item) => {
      const li = document.createElement("li");
      li.className = "inscripcion-item";

      const titulo = document.createElement("h3");
      titulo.textContent =
        item.evento_nombre ||
        item.nombre ||
        `Evento #${item.evento_id || item.id}`;

      const fecha = document.createElement("p");
      fecha.textContent = `Fecha: ${formatearFechaSimple(item.fecha) || "A confirmar"}`;

      const estado = document.createElement("span");
      estado.className = "inscripcion-estado";
      estado.textContent = `Estado: ${item.estado || "confirmada"}`;

      li.append(titulo, fecha, estado);
      lista.appendChild(li);
    });
  } catch (error) {
    console.error("Error cargando inscripciones a eventos:", error);
    lista.replaceChildren();
    const li = document.createElement("li");
    li.className = "form-message error";
    li.textContent = "No se pudieron cargar tus inscripciones a eventos.";
    lista.appendChild(li);
  }
}

async function cargarInscripcionesActividades() {
  const lista = document.getElementById("lista-inscripciones-actividades");
  if (!lista) return;

  try {
    const respuesta = await fetch(
      `${API_URL}/inscripciones/actividades/misActividades`,
      {
        headers: { Authorization: `Bearer ${sesion.token}` },
      },
    );

    if (!respuesta.ok) throw new Error("Error al obtener actividades");

    const data = await respuesta.json();
    const inscripciones = data.inscripciones || data.actividades || [];

    lista.replaceChildren();

    if (!Array.isArray(inscripciones) || inscripciones.length === 0) {
      const li = document.createElement("li");
      li.className = "form-hint";
      li.textContent = "Aún no estás inscripto a ninguna actividad.";
      lista.appendChild(li);
      return;
    }

    inscripciones.forEach((item) => {
      const li = document.createElement("li");
      li.className = "inscripcion-item";

      const titulo = document.createElement("h3");
      titulo.textContent =
        item.actividad_nombre ||
        item.nombre ||
        `Actividad #${item.actividad_id || item.id}`;

      const detalle = document.createElement("p");
      detalle.textContent = item.evento_nombre
        ? `Evento: ${item.evento_nombre}`
        : `Fecha: ${formatearFechaSimple(item.fecha) || "A confirmar"}`;

      const estado = document.createElement("span");
      estado.className = "inscripcion-estado";
      estado.textContent = `Estado: ${item.estado || "confirmada"}`;

      li.append(titulo, detalle, estado);
      lista.appendChild(li);
    });
  } catch (error) {
    console.error("Error cargando inscripciones a actividades:", error);
    lista.replaceChildren();
    const li = document.createElement("li");
    li.className = "form-message error";
    li.textContent = "No se pudieron cargar tus inscripciones a actividades.";
    lista.appendChild(li);
  }
}
