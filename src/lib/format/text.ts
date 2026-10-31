/**
 * Utilidades de texto para conteos visibles.
 *
 * Capa: lib/format
 * Evita etiquetas como "1 documentos" en encabezados y barras de estado.
 */

/**
 * Acompaña un conteo con su sustantivo en singular o plural.
 *
 * @param count Número entero a mostrar.
 * @param singular Forma para uno.
 * @param plural Forma para cero o más de uno.
 * @returns Texto como "1 documento" o "4 documentos".
 */
export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
