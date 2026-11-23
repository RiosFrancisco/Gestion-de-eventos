const API_URL = "https://gestion-de-eventos-8jyw.onrender.com/api";

// La sesión se conserva únicamente en esta pestaña y se elimina al cerrarla.
const SESSION_KEY = "festival_sesion";
let sesion = recuperarSesion();

document.addEventListener("DOMContentLoaded", () => {
  actualizarBarraUsuario();
  configurarFormularios();
  verificarSesion();
  cargarEventos();
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

function guardarSesion(datos) {
  sesion = { token: datos.token, usuario: datos.usuario };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(sesion));
  actualizarBarraUsuario();
}

function cerrarSesion() {
  sesion = null;
  sessionStorage.removeItem(SESSION_KEY);
  document.getElementById("evento-dialog")?.close();
  actualizarBarraUsuario();
}

function esCreador() {
  const rolId = Number(sesion?.usuario?.rol_id);
  return rolId === 2 || rolId === 3;
}

function actualizarBarraUsuario() {
  const boton = document.querySelector("#user-button");
  const texto = document.querySelector("#user-status");
  if (!boton || !texto) return;
  const salida = document.getElementById("logout-button");
  const registro = document.getElementById("register-button");
  const sesionIniciada = Boolean(sesion?.token && sesion?.usuario);
  texto.textContent = sesionIniciada ? sesion.usuario.nombre : "Iniciar sesión";
  boton.title = sesionIniciada
    ? `Usuario: ${sesion.usuario.nombre}`
    : "Iniciar sesión";
  if (salida) salida.hidden = !sesionIniciada;
  if (registro) registro.hidden = sesionIniciada;
}

function mostrarDialogo(id) {
  document.getElementById(id)?.showModal();
}

async function verificarSesion() {
  if (!sesion?.token || !sesion?.usuario) {
    if (sesion) cerrarSesion();
    return;
  }
  try {
    const respuesta = await fetch(`${API_URL}/auth/protegida`, {
      headers: { Authorization: `Bearer ${sesion.token}` },
    });
    if (respuesta.status === 401 || respuesta.status === 403) cerrarSesion();
  } catch (error) {
    // Sin conexión no se borra la sesión; se verificará al realizar una operación protegida.
    console.warn("No se pudo verificar la sesión:", error);
  }
}

function mensaje(id, texto, tipo = "error") {
  const elemento = document.getElementById(id);
  elemento.textContent = texto;
  elemento.className = `form-message ${tipo}`;
}

function configurarFormularios() {
  document.getElementById("user-button").addEventListener("click", () => {
    if (!sesion) {
      mostrarDialogo("login-dialog");
    } else {
      window.location.href = "/pages/perfil.html";
    }
  });

  document
    .getElementById("logout-button")
    .addEventListener("click", cerrarSesion);

  document.getElementById("register-button").addEventListener("click", () => {
    if (!sesion) mostrarDialogo("register-dialog");
  });
  document.getElementById("go-register").addEventListener("click", () => {
    document.getElementById("login-dialog").close();
    mensaje("register-message", "", "success");
    mostrarDialogo("register-dialog");
  });
  document.getElementById("go-login").addEventListener("click", () => {
    document.getElementById("register-dialog").close();
    mensaje("login-message", "", "success");
    mostrarDialogo("login-dialog");
  });

  document.getElementById("add-button").addEventListener("click", () => {
    if (!sesion) {
      mensaje("login-message", "Iniciá sesión para crear un evento.");
      mostrarDialogo("login-dialog");
      return;
    }
    if (!esCreador()) {
      window.alert("Tu cuenta no tiene el rol creador o administrador.");
      return;
    }
    mensaje("evento-message", "", "success");
    mostrarDialogo("evento-dialog");
  });

  document.querySelectorAll("[data-close]").forEach((boton) => {
    boton.addEventListener("click", () => {
      document.getElementById(boton.dataset.close).close();
    });
  });

  document
    .getElementById("login-form")
    .addEventListener("submit", iniciarSesion);
  document
    .getElementById("register-form")
    .addEventListener("submit", registrarUsuario);
  document
    .getElementById("evento-form")
    .addEventListener("submit", crearEvento);
}

async function iniciarSesion(event) {
  event.preventDefault();
  const formulario = event.currentTarget;
  const boton = formulario.querySelector('[type="submit"]');
  const datos = Object.fromEntries(new FormData(formulario));
  boton.disabled = true;
  mensaje("login-message", "Ingresando...", "success");
  try {
    const respuesta = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });
    const resultado = await respuesta.json();
    if (!respuesta.ok || !resultado.token || !resultado.usuario) {
      throw new Error(resultado.message || "No se pudo iniciar sesión.");
    }
    guardarSesion(resultado);
    formulario.reset();
    document.getElementById("login-dialog").close();
    mensaje("login-message", "", "success");
  } catch (error) {
    mensaje("login-message", error.message || "Error de conexión.");
  } finally {
    boton.disabled = false;
  }
}

async function registrarUsuario(event) {
  event.preventDefault();
  const formulario = event.currentTarget;
  const boton = formulario.querySelector('[type="submit"]');
  const datos = Object.fromEntries(new FormData(formulario));
  boton.disabled = true;
  mensaje("register-message", "Creando cuenta...", "success");
  try {
    const respuesta = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });
    const resultado = await respuesta.json();
    if (!respuesta.ok) {
      throw new Error(resultado.message || "No se pudo registrar la cuenta.");
    }
    formulario.reset();
    document.getElementById("register-dialog").close();
    const loginFormulario = document.getElementById("login-form");
    loginFormulario.elements.email.value = datos.email;
    loginFormulario.elements.password.value = "";
    mensaje("login-message", "Cuenta creada. Ahora iniciá sesión.", "success");
    mostrarDialogo("login-dialog");
  } catch (error) {
    mensaje("register-message", error.message || "Error de conexión.");
  } finally {
    boton.disabled = false;
  }
}

async function crearEvento(event) {
  event.preventDefault();
  const formulario = event.currentTarget;
  const boton = formulario.querySelector('[type="submit"]');
  const datos = Object.fromEntries(new FormData(formulario));
  datos.categoria_id = Number(datos.categoria_id);
  if (!datos.categoria_id) {
    mensaje("evento-message", "Seleccioná una categoría válida.");
    return;
  }
  if (new Date(`${datos.fecha}T${datos.hora}:00`) <= new Date()) {
    mensaje("evento-message", "La fecha y hora deben ser futuras.");
    return;
  }
  boton.disabled = true;
  mensaje("evento-message", "Publicando evento...", "success");
  try {
    const respuesta = await fetch(`${API_URL}/eventos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sesion?.token || ""}`,
      },
      body: JSON.stringify(datos),
    });
    const resultado = await respuesta.json();
    if (!respuesta.ok) {
      if (respuesta.status === 401) cerrarSesion();
      throw new Error(resultado.message || "No se pudo crear el evento.");
    }
    formulario.reset();
    document.getElementById("evento-dialog").close();
    await cargarEventos();
    window.alert("Evento publicado correctamente.");
  } catch (error) {
    mensaje("evento-message", error.message || "Error de conexión.");
  } finally {
    boton.disabled = false;
  }
}

async function cargarEventos() {
  const contenedor = document.querySelector(".events-list");
  if (!contenedor) return;
  try {
    const respuesta = await fetch(`${API_URL}/eventos`);
    if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);
    const { eventos } = await respuesta.json();
    if (!Array.isArray(eventos))
      throw new Error("Respuesta de eventos inválida");
    contenedor.replaceChildren();
    if (eventos.length === 0) {
      const texto = document.createElement("p");
      texto.className = "events-message";
      texto.textContent = "Aún no hay eventos publicados.";
      contenedor.appendChild(texto);
      return;
    }
    eventos.forEach((evento) =>
      contenedor.appendChild(crearTarjetaEvento(evento)),
    );
  } catch (error) {
    console.error("Error al cargar eventos:", error);
    contenedor.replaceChildren();
    const texto = document.createElement("p");
    texto.className = "events-message error";
    texto.textContent =
      "No se pudieron cargar los eventos. Revisá la conexión.";
    contenedor.appendChild(texto);
  }
}

function obtenerInfoEstado(estado) {
  if (estado === "cancelado")
    return { texto: "Cancelado", clase: "status-cancelled" };
  if (estado === "finalizado")
    return { texto: "Finalizado", clase: "status-finished" };
  return { texto: "Publicado", clase: "status-next" };
}

function formatearFecha(fecha, hora) {
  if (!fecha) return "Fecha a confirmar";
  const [anio, mes, dia] = fecha.slice(0, 10).split("-");
  const fechaTexto = `${dia}/${mes}/${anio}`;
  return hora ? `${fechaTexto} - ${hora.slice(0, 5)} hs` : fechaTexto;
}

function crearCampo(titulo, valor, clase) {
  const elemento = document.createElement("p");
  elemento.className = clase;
  const etiqueta = document.createElement("strong");
  etiqueta.textContent = `${titulo}: `;
  elemento.append(
    etiqueta,
    document.createTextNode(valor == null ? "" : String(valor)),
  );
  return elemento;
}

function crearTarjetaEvento(evento) {
  const tarjeta = document.createElement("article");
  tarjeta.className = "event-container";
  tarjeta.dataset.id = evento.id;
  const info = document.createElement("div");
  info.className = "event-info";
  const nombre = document.createElement("h4");
  nombre.textContent = evento.nombre;
  const estado = obtenerInfoEstado(evento.estado);
  const estadoElemento = document.createElement("span");
  estadoElemento.className = `status ${estado.clase}`;
  estadoElemento.textContent = estado.texto;
  info.append(
    nombre,
    estadoElemento,
    crearCampo(
      "Fecha",
      formatearFecha(evento.fecha, evento.hora),
      "event-date",
    ),
    crearCampo("Lugar", evento.ubicacion, "event-location"),
  );
  const descripcion = document.createElement("p");
  descripcion.textContent = evento.descripcion || "";
  info.append(
    descripcion,
    crearCampo("Etiquetas", evento.categoria || "General", "event-tags"),
  );
  const enlace = document.createElement("a");
  enlace.className = "event-card-link";
  enlace.href = `/pages/detalle_evento.html?id=${encodeURIComponent(evento.id)}`;
  enlace.setAttribute("aria-label", `Ver detalles de ${evento.nombre}`);
  const llamado = document.createElement("span");
  llamado.className = "event-card-cta";
  llamado.textContent = "Ver detalles →";
  info.appendChild(llamado);
  enlace.appendChild(info);
  tarjeta.appendChild(enlace);
  return tarjeta;
}
