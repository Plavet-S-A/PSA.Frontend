/**
 * Utilidades de formato de fechas.
 *
 * Capa: lib/format
 * La API entrega ISO; la interfaz usa es-MX con día antes que mes.
 */

/**
 * Formatea una fecha larga para encabezados y resúmenes.
 *
 * @param date Fecha a formatear.
 * @returns Texto como "Lunes, 26 de octubre de 2026".
 */
export function formatLongDate(date: Date): string {
  const formatted = new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);

  return formatted.charAt(0).toLocaleUpperCase('es-MX') + formatted.slice(1);
}

/**
 * Convierte una fecha ISO corta a texto largo es-MX.
 *
 * @param iso Fecha en formato YYYY-MM-DD.
 * @returns Fecha como "Martes, 27 de octubre de 2026" o el texto original.
 */
export function formatDateInput(iso: string): string {
  const parts = iso.split('-').map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return iso;
  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day, 12);
  return Number.isNaN(date.getTime()) ? iso : formatLongDate(date);
}

/**
 * Obtiene la fecha local actual en formato ISO corto.
 *
 * @returns Fecha como `YYYY-MM-DD`, útil para defaults de formularios y filas.
 */
export function todayIsoDate(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
