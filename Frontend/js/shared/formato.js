export function fechaSimple(fecha) {
  if (!fecha) return '';
  const partes = String(fecha).slice(0, 10).split('-');
  return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : String(fecha);
}

export function fechaConHora(fecha, hora) {
  if (!fecha) return 'Fecha a confirmar';
  return `${fechaSimple(fecha)}${hora ? ` - ${String(hora).slice(0, 5)} hs` : ''}`;
}

export function esFuturo(item) {
  if (!item?.fecha || !item?.hora) return false;
  const fecha = new Date(`${String(item.fecha).slice(0, 10)}T${String(item.hora).slice(0, 8)}`);
  return Number.isFinite(fecha.getTime()) && fecha > new Date();
}

// Compatibilidad con la vista de detalle existente.
export function fechaLegible(fecha, hora = '') {
  if (!fecha) return 'Fecha a confirmar';
  return `${fechaSimple(fecha)}${hora ? ` · ${String(hora).slice(0, 5)} hs` : ''}`;
}
export function disponible(item) {
  return item?.estado === 'publicado' && esFuturo(item);
}
