/**
 * Normalización de nombres de personas en los catálogos.
 *
 * Capa: lib/catalog
 * El esquema separa `nombre` y `apellido`. Las filas guardadas por versiones
 * anteriores usaban un solo campo; este módulo evita duplicar el apellido al
 * migrarlas y compone la etiqueta visible.
 */

import type { ResourceRow } from '@/types/resource';

/**
 * Compone el nombre visible sin duplicar el apellido.
 *
 * @param nombre Nombre o nombre completo.
 * @param apellido Apellido(s) del registro.
 * @returns Nombre completo listo para tabla y encabezados.
 */
export function personFullName(nombre: string, apellido: string): string {
  const cleanName = nombre.trim();
  const cleanSurname = apellido.trim();
  if (!cleanSurname) return cleanName;
  const normalizedName = cleanName.toLocaleLowerCase('es-MX');
  const normalizedSurname = cleanSurname.toLocaleLowerCase('es-MX');
  if (normalizedName.endsWith(normalizedSurname)) return cleanName;
  return `${cleanName} ${cleanSurname}`.trim();
}

/**
 * Separa un nombre completo heredado cuando el apellido ya está en la fila.
 *
 * @param row Fila cargada de una versión anterior.
 * @returns Copia con `nombre` sin el apellido duplicado cuando aplica.
 */
export function normalizePersonName(row: ResourceRow): ResourceRow {
  const nombre = String(row.nombre ?? '').trim();
  const apellido = String(row.apellido ?? '').trim();
  if (!apellido) return row;
  const normalizedName = nombre.toLocaleLowerCase('es-MX');
  const normalizedSurname = apellido.toLocaleLowerCase('es-MX');
  if (!normalizedName.endsWith(normalizedSurname)) return row;
  return {
    ...row,
    nombre: nombre.slice(0, nombre.length - apellido.length).trim(),
  };
}
