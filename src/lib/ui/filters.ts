/**
 * Utilidades de filtros para tablas administrativas.
 *
 * Capa: lib/ui
 * Sin estado: normaliza valores, detecta filtros activos, ordena las
 * opciones y decide si una fila cumple la selección del diálogo.
 */
import type {
  ResourceFilter,
  ResourceFilterValues,
  ResourceRow,
  ResourceValue,
} from '@/types/resource';

/** Indica si un filtro tiene al menos un valor seleccionado. */
export const isFilterActive = (
  filter: ResourceFilter,
  values: Readonly<ResourceFilterValues>,
): boolean => (values[filter.key] ?? []).length > 0;

/** Ordena los filtros por etiqueta y, en empate, por llave. */
export const sortResourceFilters = (
  filters: readonly ResourceFilter[],
): ResourceFilter[] =>
  [...filters].sort(
    (left, right) =>
      left.label.localeCompare(right.label, 'es-MX') ||
      left.key.localeCompare(right.key, 'es-MX'),
  );

/** Filtros con selección activa, en orden alfabético. */
export const activeResourceFilters = (
  filters: readonly ResourceFilter[],
  values: Readonly<ResourceFilterValues>,
): ResourceFilter[] =>
  sortResourceFilters(filters.filter((filter) => isFilterActive(filter, values)));

/** Valores seleccionados de un filtro; vacío significa "sin filtrar". */
export const selectedFilterValues = (
  values: Readonly<ResourceFilterValues>,
  key: string,
): string[] => values[key] ?? [];

/** Conserva solo los valores válidos de los filtros declarados. */
export const normalizeFilterValues = (
  filters: readonly ResourceFilter[],
  values: Readonly<ResourceFilterValues>,
): ResourceFilterValues => {
  const next: ResourceFilterValues = {};

  for (const filter of filters) {
    const selected = [...new Set(values[filter.key] ?? [])].filter(
      (value) => value !== '' && value !== 'all',
    );
    if (selected.length > 0) next[filter.key] = selected;
  }

  return next;
};

/** Quita un valor seleccionado; si era el último, el filtro deja de aplicar. */
export const removeFilterValue = (
  values: Readonly<ResourceFilterValues>,
  key: string,
  value: string,
): ResourceFilterValues => {
  const next = { ...values };
  const remaining = (values[key] ?? []).filter((item) => item !== value);

  if (remaining.length > 0) next[key] = remaining;
  else delete next[key];

  return next;
};

/**
 * Interpreta el valor de una fila para filtros booleanos.
 *
 * Cero, cadena vacía y «No» se consideran falso; cualquier otro valor
 * numérico o textual se considera verdadero.
 */
const isTruthy = (value: ResourceValue | undefined): boolean => {
  if (value === undefined) return false;
  if (typeof value === 'number') return value > 0;

  const text = String(value).trim().toLocaleLowerCase('es-MX');
  return text !== '' && text !== '0' && text !== 'no' && text !== 'false';
};

/** Indica si la fila cumple la selección activa del filtro. */
export const rowMatchesFilter = (
  row: ResourceRow,
  filter: ResourceFilter,
  selected: readonly string[],
): boolean => {
  if (selected.length === 0) return true;

  if (filter.type === 'boolean') {
    const affirmative = filter.options[0] ?? 'Sí';
    const negative = filter.options[1] ?? 'No';
    const label = isTruthy(row[filter.key]) ? affirmative : negative;
    return selected.includes(label);
  }

  return selected.includes(String(row[filter.key] ?? ''));
};
