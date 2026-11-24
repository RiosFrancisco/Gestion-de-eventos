const SESSION_KEY = 'festival_sesion';

export function obtenerSesion() {
  try {
    const valor = sessionStorage.getItem(SESSION_KEY);
    return valor ? JSON.parse(valor) : null;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function guardarSesion(datos) {
  const sesion = { token: datos.token, usuario: datos.usuario };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(sesion));
  return sesion;
}

export function actualizarUsuario(usuario) {
  const sesion = obtenerSesion();
  if (!sesion?.token) throw new Error('No hay una sesión activa.');
  return guardarSesion({ token: sesion.token, usuario });
}

export function cerrarSesion() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function tieneRolCreador(sesion = obtenerSesion()) {
  return Number(sesion?.usuario?.rol_id) === 2;
}

export function puedeCrearEventos(sesion = obtenerSesion()) {
  return [2, 3].includes(Number(sesion?.usuario?.rol_id));
}

// Compatibilidad con detalle-evento.js de la refactorización anterior.
export function encabezadosSesion() {
  const token = obtenerSesion()?.token;
  if (!token) throw new Error('Iniciá sesión para continuar.');
  return { Authorization: `Bearer ${token}` };
}
