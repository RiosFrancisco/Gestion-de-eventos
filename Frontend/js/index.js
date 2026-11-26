import { solicitar, headersAuth } from './shared/api.js';
import { obtenerSesion, guardarSesion, cerrarSesion, puedeCrearEventos } from './shared/sesion.js';
import { fechaConHora } from './shared/formato.js';

let destinoTrasLogin = null;


function actualizarBarraUsuario() {
  const sesion = obtenerSesion();

  const boton = document.getElementById("user-button");
  const texto = document.getElementById("user-status");
  const salir = document.getElementById("logout-button");
  const registro = document.getElementById("register-button");
  const admin = document.getElementById("admin-button");

  const autenticado = Boolean(
    sesion?.token && sesion?.usuario
  );

  const esAdministrador =
    autenticado &&
    Number(sesion.usuario.rol_id) === 3;

  if (texto) {
    texto.textContent = autenticado
      ? sesion.usuario.nombre
      : "Iniciar sesión";
  }

  if (boton) {
    boton.title = autenticado
      ? `Usuario: ${sesion.usuario.nombre}`
      : "Iniciar sesión";
  }

  if (salir) salir.hidden = !autenticado;
  if (registro) registro.hidden = autenticado;

  if (admin) {
    admin.hidden = !esAdministrador;

    admin.style.setProperty(
      "display",
      esAdministrador ? "inline-flex" : "none",
      "important"
    );
  }
}


function mensaje(id, texto, tipo = 'error') {
  const nodo = document.getElementById(id);
  if (!nodo) return;
  nodo.textContent = texto;
  nodo.className = `form-message ${tipo}`;
}

function mostrarDialogo(id) {
  document.getElementById(id)?.showModal();
}

function mostrarAccesoDenegado() {
  mostrarDialogo("acceso-denegado-dialog");
}

function salir() {
  cerrarSesion();
  document.getElementById('evento-dialog')?.close();
  actualizarBarraUsuario();
}

async function verificarSesion() {
  const sesion = obtenerSesion();
  if (!sesion?.token || !sesion?.usuario) return;
  try {
    await solicitar('/auth/protegida', { headers: headersAuth(sesion.token) });
  } catch (error) {
    if (error.status === 401 || error.status === 403) salir();
    else console.warn('No se pudo verificar la sesión:', error);
  }
}

function configurarFormularios() {
  document.getElementById('user-button')?.addEventListener('click', () => {
    if (!obtenerSesion()?.token) mostrarDialogo('login-dialog');
    else window.location.href = '/pages/perfil.html';
  });
  document.getElementById('logout-button')?.addEventListener('click', salir);
  document.getElementById('register-button')?.addEventListener('click', () => {
    if (!obtenerSesion()?.token) mostrarDialogo('register-dialog');
  });
  document.getElementById('go-register')?.addEventListener('click', () => {
    document.getElementById('login-dialog')?.close();
    mensaje('register-message', '', 'success');
    mostrarDialogo('register-dialog');
  });
  document.getElementById('go-login')?.addEventListener('click', () => {
    document.getElementById('register-dialog')?.close();
    mensaje('login-message', '', 'success');
    mostrarDialogo('login-dialog');
  });
  document.getElementById('add-button')?.addEventListener('click', () => {
    const sesion = obtenerSesion();
    if (!sesion?.token) {
      mensaje('login-message', 'Iniciá sesión para crear un evento.');
      mostrarDialogo('login-dialog');
    } else if (!puedeCrearEventos(sesion)) {
      mostrarAccesoDenegado();
    }
    else {
      mensaje('evento-message', '', 'success');
      mostrarDialogo('evento-dialog');
    }
  });
  // Si el usuario inicia sesión desde este botón, debe volver a pulsar «Mis eventos».
  document.getElementById('my-events-button')?.addEventListener('click', () => {
    const sesion = obtenerSesion();
    if (!sesion?.token) {
      mensaje('login-message', 'Iniciá sesión para administrar tus eventos.');
      destinoTrasLogin = '/pages/mis_eventos.html';
      mostrarDialogo('login-dialog');
    } else if (!puedeCrearEventos(sesion)) {
      mostrarAccesoDenegado();
    } else {
      window.location.href = '/pages/mis_eventos.html';
    }
  });
  document.querySelectorAll('[data-close]').forEach(boton => {
    boton.addEventListener('click', () => document.getElementById(boton.dataset.close)?.close());
  });
  document.getElementById('login-form')?.addEventListener('submit', iniciarSesion);
  document.getElementById('register-form')?.addEventListener('submit', registrarUsuario);
  document.getElementById('evento-form')?.addEventListener('submit', crearEvento);
  document.getElementById("cerrar-acceso-denegado")
    ?.addEventListener("click", () => {
      document.getElementById("acceso-denegado-dialog")?.close();
    });
  document.getElementById("admin-button")
    ?.addEventListener("click", () => {
      const sesion = obtenerSesion();

      const esAdministrador =
        Boolean(sesion?.token && sesion?.usuario) &&
        Number(sesion.usuario.rol_id) === 3;

      if (!esAdministrador) {
        mostrarAccesoDenegado();
        return;
      }

      window.location.href = "/pages/admin.html";
    });
}

async function iniciarSesion(evento) {
  evento.preventDefault();
  const formulario = evento.currentTarget;
  const boton = formulario.querySelector('[type="submit"]');
  const datos = Object.fromEntries(new FormData(formulario));
  boton.disabled = true;
  mensaje('login-message', 'Ingresando...', 'success');
  try {
    const resultado = await solicitar('/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos),
    });
    if (!resultado.token || !resultado.usuario) throw new Error('Respuesta de login inválida.');
    guardarSesion(resultado);
    formulario.reset();
    document.getElementById('login-dialog')?.close();
    actualizarBarraUsuario();
    mensaje('login-message', '', 'success');
    if (destinoTrasLogin) {
      const destino = destinoTrasLogin;
      destinoTrasLogin = null;
      if (puedeCrearEventos(resultado)) {
        window.location.href = destino;
      } else {
        mostrarAccesoDenegado();
      }
    }
  } catch (error) { mensaje('login-message', error.message || 'Error de conexión.'); }
  finally { boton.disabled = false; }
}

async function registrarUsuario(evento) {
  evento.preventDefault();
  const formulario = evento.currentTarget;
  const boton = formulario.querySelector('[type="submit"]');
  const datos = Object.fromEntries(new FormData(formulario));
  boton.disabled = true;
  mensaje('register-message', 'Creando cuenta...', 'success');
  try {
    await solicitar('/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos),
    });
    formulario.reset();
    document.getElementById('register-dialog')?.close();
    const login = document.getElementById('login-form');
    if (login) {
      login.elements.email.value = datos.email;
      login.elements.password.value = '';
    }
    mensaje('login-message', 'Cuenta creada. Ahora iniciá sesión.', 'success');
    mostrarDialogo('login-dialog');
  } catch (error) { mensaje('register-message', error.message || 'Error de conexión.'); }
  finally { boton.disabled = false; }
}

async function crearEvento(evento) {
  evento.preventDefault();
  const formulario = evento.currentTarget;
  const boton = formulario.querySelector('[type="submit"]');
  const datos = Object.fromEntries(new FormData(formulario));
  datos.categoria_id = Number(datos.categoria_id);
  if (!datos.categoria_id) return mensaje('evento-message', 'Seleccioná una categoría válida.');
  if (new Date(`${datos.fecha}T${datos.hora}:00`) <= new Date()) {
    return mensaje('evento-message', 'La fecha y hora deben ser futuras.');
  }
  boton.disabled = true;
  mensaje('evento-message', 'Publicando evento...', 'success');
  try {
    const sesion = obtenerSesion();
    await solicitar('/eventos', {
      method: 'POST', headers: headersAuth(sesion?.token, true), body: JSON.stringify(datos),
    });
    formulario.reset();
    document.getElementById('evento-dialog')?.close();
    await cargarEventos();
    window.alert('Evento publicado correctamente.');
  } catch (error) {
    if (error.status === 401) salir();
    mensaje('evento-message', error.message || 'Error de conexión.');
  } finally { boton.disabled = false; }
}

function obtenerInfoEstado(estado) {
  if (estado === 'cancelado') return { texto: 'Cancelado', clase: 'status-cancelled' };
  if (estado === 'finalizado') return { texto: 'Finalizado', clase: 'status-finished' };
  return { texto: 'Publicado', clase: 'status-next' };
}

function crearCampo(titulo, valor, clase) {
  const parrafo = document.createElement('p');
  parrafo.className = clase;
  const etiqueta = document.createElement('strong');
  etiqueta.textContent = `${titulo}: `;
  parrafo.append(etiqueta, document.createTextNode(valor == null ? '' : String(valor)));
  return parrafo;
}

function crearTarjetaEvento(evento) {
  const tarjeta = document.createElement('article');
  tarjeta.className = 'event-container';
  tarjeta.dataset.id = evento.id;
  const info = document.createElement('div');
  info.className = 'event-info';
  const nombre = document.createElement('h4');
  nombre.textContent = evento.nombre;
  const estado = obtenerInfoEstado(evento.estado);
  const estadoNodo = document.createElement('span');
  estadoNodo.className = `status ${estado.clase}`;
  estadoNodo.textContent = estado.texto;
  info.append(
    nombre, estadoNodo,
    crearCampo('Fecha', fechaConHora(evento.fecha, evento.hora), 'event-date'),
    crearCampo('Lugar', evento.ubicacion, 'event-location'),
  );
  const descripcion = document.createElement('p');
  descripcion.textContent = evento.descripcion || '';
  info.append(descripcion, crearCampo('Etiquetas', evento.categoria || 'General', 'event-tags'));
  const enlace = document.createElement('a');
  enlace.className = 'event-card-link';
  enlace.href = `/pages/detalle_evento.html?id=${encodeURIComponent(evento.id)}`;
  enlace.setAttribute('aria-label', `Ver detalles de ${evento.nombre}`);
  const llamado = document.createElement('span');
  llamado.className = 'event-card-cta';
  llamado.textContent = 'Ver detalles →';
  info.appendChild(llamado);
  enlace.appendChild(info);
  tarjeta.appendChild(enlace);
  return tarjeta;
}

async function cargarEventos() {
  const contenedor = document.querySelector('.events-list');
  if (!contenedor) return;
  try {
    const { eventos } = await solicitar("/eventos");

    if (!Array.isArray(eventos)) {
      throw new Error("Respuesta de eventos inválida");
    }

    // Mostrar solamente eventos publicados
    const eventosPublicados = eventos.filter(
      evento => evento.estado === "publicado"
    );

    contenedor.replaceChildren();

    if (eventosPublicados.length === 0) {
      const mensaje = document.createElement("p");

      mensaje.className = "events-message";
      mensaje.textContent = "No hay eventos publicados actualmente.";

      contenedor.appendChild(mensaje);
      return;
    }

    // Crear tarjetas únicamente para eventos publicados
    eventosPublicados.forEach(evento => {
      contenedor.appendChild(crearTarjetaEvento(evento));
    });
  } catch (error) {
    console.error('Error al cargar eventos:', error);
    contenedor.replaceChildren();
    const parrafo = document.createElement('p');
    parrafo.className = 'events-message error';
    parrafo.textContent = 'No se pudieron cargar los eventos. Revisá la conexión.';
    contenedor.append(parrafo);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  actualizarBarraUsuario();
  configurarFormularios();
  void verificarSesion();
  void cargarEventos();
  if (location.hash === '#crear-evento') {
    document.getElementById('add-button')?.click();
    history.replaceState(null, '', location.pathname + location.search);
  }
});
