/**
 * Utilidades de formato de nombres.
 *
 * Capa: lib/format
 */

/**
 * Obtiene las iniciales visibles de un nombre completo.
 *
 * @param name Nombre de la persona.
 * @returns Una o dos iniciales en mayúsculas; "?" si el nombre está vacío.
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0]?.charAt(0) ?? '';
  if (parts.length === 1) return `${first}${parts[0]?.charAt(1) ?? ''}`.toUpperCase();
  const last = parts[parts.length - 1]?.charAt(0) ?? '';
  return `${first}${last}`.toUpperCase();
}
