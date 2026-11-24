export function fechaLegible(fecha, hora = "") {
  if (!fecha) return "Fecha a confirmar";
  const partes = String(fecha).slice(0, 10).split("-");
  const texto = partes.length === 3
    ? `${partes[2]}/${partes[1]}/${partes[0]}`
    : String(fecha);
  return `${texto}${hora ? ` · ${String(hora).slice(0, 5)} hs` : ""}`;
}

export function disponible(item) {
  if (item?.estado !== "publicado" || !item.fecha || !item.hora) return false;
  const fecha = new Date(`${String(item.fecha).slice(0, 10)}T${String(item.hora).slice(0, 8)}`);
  return Number.isFinite(fecha.getTime()) && fecha > new Date();
}
