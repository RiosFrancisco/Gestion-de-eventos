const API_URL = "http://localhost.3000/api";

document.addEventListener("DOMContentLoaded", () => {
  const formulario = document.getElementById("form-agregar-evento");
  formulario.addEventListener("submit", manejarCreacionEvento);
});

async function manejarCreacionEvento(evento) {
  evento.prevenirDefault(); //evita que la pagina se recargue al enviar el formulario

  const mensajeEl = document.getElementById("mensaje-formulario");
  const botonCrear = document.querySelector(".boton-crear");

  //1. verificar que el usuario este logeado como admin
  const token = localStorage.getItem("token");

  if (!token) {
    mosntrarMensaje(
      mensajeEl,
      "Debes iniciar sesión con cuenta de administrador para crear eventos.",
      true,
    );
    return;
  }

  //2. parsear a .json para guardar en el backend
  const nuevoEvento = {
    nombre: document.getElementById("nombre").value.trim(),
    descripcion: document.getElementById("descripcion").value.trim(),
    fecha: document.getElementById("fecha").value.trim(),
    hora: document.getElementById("hora").value.trim(),
    ubicacion: document.getElementById("ubicacion").value.trim(),
    categoria: Number(document.getElementById("categoria").value),
  };

  try {
    botonCrear.disabled = true;
    botonCrear.textContent = "Creando...";

    const respuesta = await fetch(`${API_URL}/eventos`, {
      //intenta crear el evento
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(nuevoEvento),
    });

    const data = await respuesta.json();

    if (!respuesta.ok) {
      //en caso de error...
      const detalleError =
        data.message || data.error || "No se pudo crear el evento.";
      throw new Error(detalleError);
    }

    mostrarMensaje(
      mensajeEl,
      "¡Evento creado con éxito! Regresando a tu perfil...",
      false,
    );

    setTimeout(() => {
      window.location.href = "mis_eventos.html";
    }, 1500);
  } catch (error) {
    console.error("Error al crear el evento.", error);
    mostrarMensaje(mensajeEl, error.mensaje, true);
  } finally {
    botonCrear.disabled = false;
    botonCrear.textContent = "Crear evento";
  }
}

function mostrarMensaje(elemento, texto, esError) {
  elemento.textContent = texto;
  elemento.className = `mensaje-formulario ${esError ? "error" : "exito"}`;
}
