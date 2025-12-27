/**
 * Date utility functions
 */

/**
 * Calcula fecha relativa agregando días a una fecha base
 * @param start - Fecha de inicio (string ISO o Date object)
 * @param days - Número de días a agregar
 * @returns String ISO de la fecha resultante
 */
export function calculateRelativeEndDate(
  start: string | Date,
  days: number
): string {
  if (!start) return "";
  const date = new Date(start);
  const newDate = new Date(date.getTime());
  newDate.setDate(date.getDate() + days);
  return newDate.toISOString();
}
