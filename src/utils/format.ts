/**
 * Formatea una cantidad numerica para mostrar: redondea a maximo 3
 * decimales y recorta ceros de mas (51.055 queda igual, 4.000 se muestra
 * como "4"). No confundir con montos en pesos, que usan Intl.NumberFormat
 * con moneda en cada componente que los muestra.
 */
export function formatCantidad(n: number): string {
  const redondeado = Math.round(n * 1000) / 1000;
  return redondeado.toString();
}
