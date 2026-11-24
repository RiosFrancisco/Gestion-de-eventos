// Único punto de configuración para la API.
export const API_BASE = 'https://gestion-de-eventos-8jyw.onrender.com/api';

export async function solicitar(ruta, opciones = {}) {
  const respuesta = await fetch(`${API_BASE}${ruta}`, opciones);
  const resultado = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    const error = new Error(resultado.message || `Error HTTP ${respuesta.status}`);
    error.status = respuesta.status;
    throw error;
  }
  return resultado;
}

export function headersAuth(token, incluirJson = false) {
  if (!token) throw new Error('Iniciá sesión para continuar.');
  return {
    ...(incluirJson ? { 'Content-Type': 'application/json' } : {}),
    Authorization: `Bearer ${token}`,
  };
}
