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

function mostrarListaInscripciones(id, registros, tipo) {
  const lista = document.getElementById(id);
  if (!lista) return;
  lista.replaceChildren();
  if (!Array.isArray(registros) || !registros.length) {
    const li = document.createElement('li');
    li.className = 'form-hint';
    li.textContent = tipo === 'evento'
      ? 'Aún no estás inscripto a ningún evento.'
      : 'Aún no estás inscripto a ninguna actividad.';
    lista.append(li);
    return;
  }
  registros.forEach(item => {
    const li = document.createElement('li');
    li.className = 'inscripcion-item';
    const titulo = document.createElement('h3');
    titulo.textContent = tipo === 'evento'
      ? item.evento_nombre || item.nombre || `Evento #${item.evento_id || item.id}`
      : item.actividad_nombre || item.nombre || `Actividad #${item.actividad_id || item.id}`;
    const detalle = document.createElement('p');
    detalle.textContent = tipo === 'actividad' && item.evento_nombre
      ? `Evento: ${item.evento_nombre}`
      : `Fecha: ${fechaSimple(item.fecha) || 'A confirmar'}`;
    const estado = document.createElement('span');
    estado.className = 'inscripcion-estado';
    estado.textContent = `Estado: ${item.estado || 'confirmada'}`;
    li.append(titulo, detalle, estado);
    lista.append(li);
  });
}

async function cargarInscripciones(ruta, listaId, tipo) {
  if (!document.getElementById(listaId)) return;
  try {
    const sesion = obtenerSesion();
    const datos = await solicitar(ruta, { headers: headersAuth(sesion?.token) });
    const registros = datos.inscripciones || datos.eventos || datos.actividades || [];
    mostrarListaInscripciones(listaId, registros, tipo);
  } catch (error) {
    if (error.status === 401) return salir();
    console.error(`Error cargando inscripciones de ${tipo}:`, error);
    const lista = document.getElementById(listaId);
    lista.replaceChildren();
    const li = document.createElement('li');
    li.className = 'form-message error';
    li.textContent = `No se pudieron cargar tus inscripciones a ${tipo === 'evento' ? 'eventos' : 'actividades'}.`;
    lista.append(li);
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
