document.addEventListener("DOMContentLoaded", () => {
  //busca etiquetas data-page y redirecciona
  const elementosNavegables = document.querySelectorAll("[data-page]");

  elementosNavegables.forEach((elemento) => {
    elemento.style.cursor = "pointer";
    elemento.addEventListener("click", () => {
      const destino = elemento.dataset.page;
      if (destino) {
        window.location.href = destino;
      }
    });
  });
});
