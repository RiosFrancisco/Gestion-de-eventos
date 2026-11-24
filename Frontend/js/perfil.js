import { solicitar, headersAuth } from './shared/api.js';
import { obtenerSesion, actualizarUsuario, cerrarSesion } from './shared/sesion.js';
import { fechaSimple } from './shared/formato.js';

function volverInicio() { window.location.href = '/pages/index.html'; }
function salir() { cerrarSesion(); volverInicio(); }

function rolNombre(id) {
  if (Number(id) === 3) return 'Administrador';
  if (Number(id) === 2) return 'Creador de eventos';
  return 'Participante';
}

function mostrarMensaje(texto, tipo = 'error') {
  const nodo = document.getElementById('perfil-message');
  if (!nodo) return;
  nodo.textContent = texto;
  nodo.className = `form-message ${tipo}`;
}

function texto(id, valor) {
  const nodo = document.getElementById(id);
  if (nodo) nodo.textContent = valor ?? '';
}

function renderizarDatosUsuario(usuario) {
  texto('user-status', usuario.nombre);
  texto('perfil-nombre-titulo', usuario.nombre);
  texto('perfil-email-subtitulo', usuario.email);
  texto('perfil-rol-badge', rolNombre(usuario.rol_id));
  const formulario = document.getElementById('perfil-form');
  if (formulario) {
    formulario.elements.nombre.value = usuario.nombre || '';
    formulario.elements.email.value = usuario.email || '';
  }
  if (usuario.created_at) {
    texto('perfil-fecha-registro', `Miembro desde el ${fechaSimple(usuario.created_at)}`);
  }
}

function configurarNavegacion() {
  ['logo', 'back-home-button', 'volver-inicio-btn'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', volverInicio);
  });
  document.getElementById('logout-button')?.addEventListener('click', salir);
  document.getElementById('perfil-form')?.addEventListener('submit', actualizarPerfil);
}

async function cargarPerfilServidor() {
  try {
    const sesion = obtenerSesion();
    const { usuario } = await solicitar('/usuarios/perfil', {
      headers: headersAuth(sesion?.token),
    });
    if (usuario) {
      actualizarUsuario(usuario);
      renderizarDatosUsuario(usuario);
    }
  } catch (error) {
    if ([401, 403].includes(error.status)) return salir();
    console.warn('No se pudo sincronizar el perfil:', error);
  }
}

async function actualizarPerfil(evento) {
  evento.preventDefault();
  const formulario = evento.currentTarget;
  const boton = formulario.querySelector('[type="submit"]');
  const sesion = obtenerSesion();
  if (!sesion?.usuario) return salir();
  const nombre = formulario.elements.nombre.value.trim();
  const email = formulario.elements.email.value.trim();
  const cambios = {};
  if (nombre && nombre !== sesion.usuario.nombre) cambios.nombre = nombre;
  if (email && email !== sesion.usuario.email) cambios.email = email;
  if (!Object.keys(cambios).length) {
    mostrarMensaje('No realizaste cambios para guardar.');
    return;
  }
  boton.disabled = true;
  mostrarMensaje('Guardando cambios...', 'success');
  try {
    const { usuario } = await solicitar('/usuarios/perfil', {
      method: 'PATCH', headers: headersAuth(sesion.token, true), body: JSON.stringify(cambios),
    });
    if (!usuario) throw new Error('El servidor no devolvió el usuario actualizado.');
    actualizarUsuario(usuario);
    renderizarDatosUsuario(usuario);
    mostrarMensaje('Datos actualizados correctamente.', 'success');
  } catch (error) {
    if (error.status === 401) return salir();
    mostrarMensaje(error.message || 'Error de conexión.');
  } finally { boton.disabled = false; }
}


const detallesEventos = new Map();
const detallesActividades = new Map();

async function obtenerDetalle(ruta, id, cache, clave) {
  if (!id) return null;

  if (!cache.has(id)) {
    const consulta = solicitar(`${ruta}/${encodeURIComponent(id)}`)
      .then(datos => datos[clave] ?? datos)
      .catch(error => {
        console.warn(`No se pudo consultar ${ruta}/${id}`, error);
        return null;
      });

    cache.set(id, consulta);
  }

  return cache.get(id);
}

async function completarInscripcion(item, tipo) {
  if (tipo === "evento") {
    const evento = await obtenerDetalle(
      "/eventos",
      item.evento_id,
      detallesEventos,
      "evento"
    );

    return {
      ...item,
      nombreMostrar: item.evento_nombre || evento?.nombre ||
        "Evento no disponible",
      fechaMostrar: evento?.fecha || item.fecha
    };
  }

  const actividad = await obtenerDetalle(
    "/actividades",
    item.actividad_id,
    detallesActividades,
    "actividad"
  );

  const eventoId = actividad?.evento_id ?? item.evento_id;

  const evento = await obtenerDetalle(
    "/eventos",
    eventoId,
    detallesEventos,
    "evento"
  );

  return {
    ...item,
    nombreMostrar: item.actividad_nombre || actividad?.nombre ||
      "Actividad no disponible",
    fechaMostrar: actividad?.fecha || item.fecha,
    eventoMostrar: item.evento_nombre || evento?.nombre || null
  };
}

function mostrarListaInscripciones(id, registros, tipo) {
    const lista = document.getElementById(id);
    if (!lista) return;

    lista.replaceChildren();

    if (!Array.isArray(registros) || registros.length === 0) {
        const li = document.createElement("li");
        li.className = "form-hint";
        li.textContent = tipo === "evento"
            ? "Aún no estás inscripto a ningún evento."
            : "Aún no estás inscripto a ninguna actividad.";

        lista.appendChild(li);
        return;
    }

    registros.forEach(item => {
        const li = document.createElement("li");
        li.className = "inscripcion-item";

        const titulo = document.createElement("h3");
        titulo.textContent = item.nombreMostrar;

        const detalle = document.createElement("p");

        detalle.textContent =
            tipo === "actividad" && item.eventoMostrar
                ? `Evento: ${item.eventoMostrar}`
                : `Fecha: ${fechaSimple(item.fechaMostrar) || "A confirmar"}`;

        const estado = document.createElement("span");
        estado.className = "inscripcion-estado";
        estado.textContent = `Estado: ${item.estado || "No informado"}`;

        li.append(titulo, detalle, estado);
        lista.appendChild(li);
    });
}

async function cargarInscripciones(ruta, listaId, tipo) {
    const lista = document.getElementById(listaId);
    if (!lista) return;

    try {
        const sesion = obtenerSesion();

        const datos = await solicitar(ruta, {
            headers: headersAuth(sesion?.token)
        });

        const registros =
            datos.inscripciones ||
            datos.eventos ||
            datos.actividades ||
            [];

        if (!Array.isArray(registros)) {
            throw new Error("Formato de inscripciones inválido");
        }

        const inscripcionesCompletas = await Promise.all(
            registros.map(item => completarInscripcion(item, tipo))
        );

        mostrarListaInscripciones(
            listaId,
            inscripcionesCompletas,
            tipo
        );

    } catch (error) {
        if (error.status === 401) {
            salir();
            return;
        }

        console.error("Error al cargar inscripciones:", error);

        lista.replaceChildren();

        const li = document.createElement("li");
        li.className = "form-message error";
        li.textContent = "No se pudieron cargar tus inscripciones.";

        lista.appendChild(li);
    }
}


document.addEventListener('DOMContentLoaded', () => {
  const sesion = obtenerSesion();
  if (!sesion?.token || !sesion?.usuario) return volverInicio();
  configurarNavegacion();
  renderizarDatosUsuario(sesion.usuario);
  void cargarPerfilServidor();
  void cargarInscripciones('/inscripciones/eventos/misEventos', 'lista-inscripciones-eventos', 'evento');
  void cargarInscripciones('/inscripciones/actividades/misActividades', 'lista-inscripciones-actividades', 'actividad');
});
