/**
 * Composición de filas de recursos.
 *
 * Capa: lib/resource
 * Mezcla valores editables con la fila actual, aplica normalizaciones de
 * versiones anteriores y calcula campos derivados de presentación. No conoce
 * el DOM ni Solid: es lógica pura reutilizable por cualquier catálogo.
 */

import type {
  ResourceConfig,
  ResourceDeriveRow,
  ResourceRow,
  ResourceValues,
} from '@/types/resource';

/**
 * Convierte una fila completa a valores serializables para `deriveRow`.
 *
 * @param row Fila de origen.
 * @returns Copia con las mismas llaves y valores admitidos por la interfaz.
 */
function valuesOf(row: ResourceRow): ResourceValues {
  return { ...row };
}

/**
 * Aplica la normalización y los campos derivados de una configuración.
 *
 * @param config Configuración del módulo.
 * @param values Valores editables capturados en el formulario.
 * @param current Fila original cuando se está editando.
 * @param normalizeRow Función de normalización resuelta en el cliente.
 * @param deriveRow Función de derivación resuelta en el cliente.
 * @returns Fila resultante lista para persistir o mostrar.
 */
export function applyResourceValues(
  config: ResourceConfig,
  values: ResourceValues,
  current?: ResourceRow,
  normalizeRow?: (row: ResourceRow) => ResourceRow,
  deriveRow?: ResourceDeriveRow,
): ResourceRow {
  const base: ResourceRow = current
    ? { ...current, ...values }
    : { ...values, id: '' };
  const resolvedNormalize = normalizeRow ?? config.normalizeRow;
  const normalized = resolvedNormalize ? resolvedNormalize(base) : base;
  const resolvedDerive = deriveRow ?? config.deriveRow;
  const derived = resolvedDerive
    ? resolvedDerive(valuesOf(normalized), normalized)
    : {};
  return { ...normalized, ...derived };
}

/**
 * Normaliza un conjunto de filas cargadas de almacenamiento local.
 *
 * @param config Configuración del módulo.
 * @param rows Filas guardadas o de ejemplo.
 * @param normalizeRow Función de normalización resuelta en el cliente.
 * @param deriveRow Función de derivación resuelta en el cliente.
 * @returns Filas con campos derivados recalculados.
 */
export function normalizeResourceRows(
  config: ResourceConfig,
  rows: readonly ResourceRow[],
  normalizeRow?: (row: ResourceRow) => ResourceRow,
  deriveRow?: ResourceDeriveRow,
): ResourceRow[] {
  return rows.map((row) =>
    applyResourceValues(config, valuesOf(row), row, normalizeRow, deriveRow),
  );
}
