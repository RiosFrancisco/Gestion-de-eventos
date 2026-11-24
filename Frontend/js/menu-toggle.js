const headerEl = document.querySelector("header");
const menuToggle = document.getElementById("menu-toggle");

if (headerEl && menuToggle) {
  const setMenuState = (isOpen) => {
    headerEl.classList.toggle("menu-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Cerrar menú" : "Abrir menú",
    );
  };

  menuToggle.addEventListener("click", () => {
    const isOpen = !headerEl.classList.contains("menu-open");
    setMenuState(isOpen);
  });

  headerEl.querySelectorAll("nav button, nav a").forEach((item) => {
    item.addEventListener("click", () => setMenuState(false));
  });
}
