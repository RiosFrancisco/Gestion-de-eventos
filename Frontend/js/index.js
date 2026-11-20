const API_URL = "http://localhost:3000/api";

document.addEventListener("DOMContentLoaded", () => {
  cargarEventos(); //ejecuta la función "cargarEventos"
});

async function cargarEventos() {
  const contenedorEventos = document.querySelector(".events-list");

  try {
    const respuesta = await fetch(`${API_URL}/eventos`); //intenta obtener la lista de eventos

    if (!respuesta.ok) {
      throw new Error(`Error HTTP: ${respuesta.status}`); //si no lo consigue, da error
    }

    const eventos = await respuesta.json(); //parsea la lista a un .json

    contenedorEventos.innerHTML = ""; //vacía el espacio de event-list de mensajes de aviso

    if (eventos.lenght === 0) {
      //aviso si no hay eventos publicados
      contenedorEventos.innerHTML =
        "<p>Aún no hay eventos publicados, intenta más tarde.</p>";
      return;
    }

    eventos.forEach((evento) => {
      //se crea una tarjeta de evento por cada evento del .json (lista de eventos)
      const tarjeta = crearTarjetaEvento(evento);
      contenedorEventos.appendChild(tarjeta);
    });
  } catch (error) {
    console.error("Error al obtener los eventos:", error); //aviso si no se puede acceder a los eventos
    contenedorEventos.innerHTML =
      "<p>No se pudieron cargar los eventos. Revisa la conexión.</p>";
  }
}

function obtenerInfoEstado(estadoBackend) {
  //estados definidos manualmente por el usuario
  if (evento.estado === "cancelado") {
    return { texto: "Cancelado", clase: "status-cancelled" };
  }
  if (evento.estado === "finalizado") {
    return { texto: "Finalizado", clase: "status-finished" };
  }

  //si el evento esta publicado y próximo, calcula fecha y hora actual
  const ahora = new Date();
  const soloFecha = evento.fecha.split("T")[0];
  const soloHora = evento.hora ? evento.hora.slice(0, 5) : "00:00";
  const inicioEvento = new Date(`${soloFecha}T${soloHora}:00`);

  const fechaLimite = new Date(inicioEvento.getTime() + 168 * 60 * 60 * 1000); //finaliza el evento autmáticamente luego de 7 días

  if (ahora < inicioEvento) {
    //condiciones para cada estado
    return { texto: "Próximo", clase: "status-next" };
  } else if (ahora >= inicioEvento && ahora <= finEstimado) {
    return { texto: "En curso", clase: "status-ongoing" };
  } else {
    return { texto: "Finalizado", clase: "status-finished" };
  }
}

function formatearFecha(fechaISO, hora) {
  if (!fechaISO) return "Fecha a confimar";

  const partes = fechaISO;
}
