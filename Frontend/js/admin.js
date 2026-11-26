
import { solicitar, headersAuth } from "./shared/api.js";
import { obtenerSesion, cerrarSesion } from "./shared/sesion.js";

const panel = document.getElementById("admin-panel");
const lista = document.getElementById("admin-lista");
const aviso = document.getElementById("admin-mensaje");
const busqueda = document.getElementById("buscar-usuarios");

const dialogo = document.getElementById("admin-editar-dialog");
const formulario = document.getElementById("admin-editar-form");

let usuarios = [];
let usuarioEditado = null;
let adminId = null;


function informar(texto, error = false) {
    aviso.textContent = texto;
    aviso.dataset.error = String(error);
}

function rolDe(usuario) {
    const rol = Number(usuario.rol_id);

    if (rol === 3) return "admin";
    if (rol === 2) return "creador";

    return "usuario";
}

function esEditable(usuario) {
    return (
        Number(usuario.rol_id) !== 3 &&
        Number(usuario.id) !== adminId
    );
}

function crearElemento(tag, clase, contenido) {
    const elemento = document.createElement(tag);

    if (clase) elemento.className = clase;

    if (contenido !== undefined) {
        elemento.textContent = String(contenido);
    }

    return elemento;
}

function cerrarAcceso() {
    cerrarSesion();
    window.location.replace("/");
}

function manejarError(error) {
    if (error.status === 401) {
        cerrarAcceso();
        return;
    }

    informar(error.message || "Ocurrió un error.", true);
}

function actualizarResumen() {
    document.getElementById("total-usuarios").textContent =
        String(usuarios.length);

    document.getElementById("total-creadores").textContent =
        String(
            usuarios.filter(
                usuario => Number(usuario.rol_id) === 2
            ).length
        );

    document.getElementById("total-admins").textContent =
        String(
            usuarios.filter(
                usuario => Number(usuario.rol_id) === 3
            ).length
        );
}

function abrirEdicion(usuario) {
    usuarioEditado = usuario;

    formulario.elements.nombre.value = usuario.nombre || "";
    formulario.elements.email.value = usuario.email || "";

    document.getElementById("admin-editar-subtitulo").textContent =
        `Cuenta #${usuario.id}`;

    document.getElementById("admin-editar-error").textContent = "";

    dialogo.showModal();
}

function crearTarjeta(usuario) {
    const tarjeta = crearElemento("article", "admin-user");

    const cabecera = crearElemento("div", "admin-user__head");
    const datos = crearElemento("div", "admin-user__identity");

    datos.append(
        crearElemento("h3", "", usuario.nombre),
        crearElemento("p", "", usuario.email),
        crearElemento("span", "admin-user__id", `Usuario #${usuario.id}`)
    );

    const etiqueta = crearElemento(
        "span",
        "admin-role",
        rolDe(usuario)
    );

    cabecera.append(datos, etiqueta);
    tarjeta.append(cabecera);

    if (!esEditable(usuario)) {
        tarjeta.append(
            crearElemento(
                "p",
                "admin-note",
                "Cuenta administrativa: edición no disponible desde este panel."
            )
        );

        return tarjeta;
    }

    const acciones = crearElemento("div", "admin-user__actions");

    // Botón de edición
    const editar = crearElemento(
        "button",
        "admin-button admin-button--primary",
        "Editar datos"
    );

    editar.type = "button";

    editar.addEventListener("click", () => {
        abrirEdicion(usuario);
    });

    // Selector de roles
    const selector = document.createElement("select");

    selector.className = "admin-role-select";

    selector.setAttribute(
        "aria-label",
        `Rol de ${usuario.nombre}`
    );

    for (const [valor, nombre] of [
        ["usuario", "usuario"],
        ["creador", "creador"]
    ]) {
        const opcion = new Option(nombre, valor);
        selector.add(opcion);
    }

    selector.value =
        Number(usuario.rol_id) === 2
            ? "creador"
            : "usuario";

    // Guardar cambio de rol
    const guardarRol = crearElemento(
        "button",
        "admin-button admin-button--neutral",
        "Guardar rol"
    );

    guardarRol.type = "button";

    guardarRol.addEventListener("click", async () => {
        const rolOriginal =
            Number(usuario.rol_id) === 2
                ? "creador"
                : "usuario";

        if (selector.value === rolOriginal) {
            informar("No hay cambios de rol para guardar.");
            return;
        }

        const nuevoRol =
            selector.value === "creador"
                ? "creador"
                : "usuario";

        const confirmado = window.confirm(
            `¿Cambiar el rol de ${usuario.nombre} a ${nuevoRol}?`
        );

        if (!confirmado) {
            selector.value = rolOriginal;
            return;
        }

        guardarRol.disabled = true;

        try {
            await solicitar(
                `/usuarios/${encodeURIComponent(usuario.id)}/rol`,
                {
                    method: "PATCH",
                    headers: headersAuth(
                        obtenerSesion()?.token,
                        true
                    ),
                    body: JSON.stringify({
                        rol: selector.value
                    })
                }
            );

            await cargarUsuarios();

            informar("Rol actualizado correctamente.");

        } catch (error) {
            selector.value = rolOriginal;
            manejarError(error);

        } finally {
            guardarRol.disabled = false;
        }
    });

    acciones.append(
        editar,
        selector,
        guardarRol
    );

    tarjeta.append(acciones);

    return tarjeta;
}

function dibujarUsuarios() {
    const filtro = busqueda.value
        .trim()
        .toLocaleLowerCase("es");

    const resultados = usuarios.filter(usuario => {
        const texto = `${usuario.nombre} ${usuario.email}`
            .toLocaleLowerCase("es");

        return texto.includes(filtro);
    });

    lista.replaceChildren();

    if (resultados.length === 0) {
        lista.append(
            crearElemento(
                "p",
                "admin-empty",
                "No se encontraron usuarios."
            )
        );

        return;
    }

    resultados.forEach(usuario => {
        lista.append(crearTarjeta(usuario));
    });
}


async function cargarUsuarios() {
    const sesion = obtenerSesion();

    if (!sesion?.token) {
        cerrarAcceso();
        return;
    }

    informar("Cargando usuarios...");

    try {
        const datos = await solicitar("/usuarios", {
            headers: headersAuth(sesion.token)
        });

        if (!Array.isArray(datos.usuarios)) {
            throw new Error("Respuesta de usuarios inválida.");
        }

        usuarios = datos.usuarios;

        panel.hidden = false;

        actualizarResumen();
        dibujarUsuarios();

        informar("");

    } catch (error) {
        panel.hidden = true;
        manejarError(error);
    }
}

async function guardarEdicion(evento) {
    evento.preventDefault();

    if (!usuarioEditado) return;

    const nombre = formulario.elements.nombre.value.trim();
    const email = formulario.elements.email.value.trim();

    const cambios = {};

    if (nombre !== usuarioEditado.nombre) {
        cambios.nombre = nombre;
    }

    if (email !== usuarioEditado.email) {
        cambios.email = email;
    }

    if (Object.keys(cambios).length === 0) {
        document.getElementById("admin-editar-error").textContent =
            "No realizaste cambios.";

        return;
    }

    const guardar = formulario.querySelector('[type="submit"]');

    guardar.disabled = true;

    try {
        await solicitar(
            `/usuarios/${encodeURIComponent(usuarioEditado.id)}`,
            {
                method: "PATCH",
                headers: headersAuth(
                    obtenerSesion()?.token,
                    true
                ),
                body: JSON.stringify(cambios)
            }
        );

        dialogo.close();

        await cargarUsuarios();

        informar("Datos del usuario actualizados correctamente.");

    } catch (error) {
        if (error.status === 401) {
            cerrarAcceso();
            return;
        }

        document.getElementById("admin-editar-error").textContent =
            error.message;

    } finally {
        guardar.disabled = false;
    }
}


function iniciar() {
    const sesion = obtenerSesion();

    if (!sesion?.token || !sesion?.usuario) {
        cerrarAcceso();
        return;
    }

    // Solo administradores
    if (Number(sesion.usuario.rol_id) !== 3) {
        informar(
            "Acceso no autorizado. Esta sección es exclusiva para administradores.",
            true
        );

        return;
    }

    adminId = Number(sesion.usuario.id);

    document.getElementById("admin-identidad").textContent =
        `Administrador: ${sesion.usuario.nombre}`;

    document.getElementById("admin-logout")
        .addEventListener("click", cerrarAcceso);

    document.getElementById("admin-cerrar-edicion")
        .addEventListener("click", () => dialogo.close());

    formulario.addEventListener("submit", guardarEdicion);

    busqueda.addEventListener("input", dibujarUsuarios);

    void cargarUsuarios();
}

document.addEventListener("DOMContentLoaded", iniciar);
