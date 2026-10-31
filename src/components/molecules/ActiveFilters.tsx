/**
 * ActiveFilters — resumen de filtros aplicados con remoción individual.
 *
 * Capa: molecule
 * Props: filters, values, onRemove
 * Efectos: ninguno; ordena etiquetas y valores alfabéticamente para mantener
 * una lectura estable entre tablas.
 */
import type { Component } from 'solid-js';
import { createMemo, For, Show } from 'solid-js';

import Icon from '@/components/atoms/Icon';
import { activeResourceFilters } from '@/lib/ui/filters';
import type { ResourceFilter, ResourceFilterValues } from '@/types/resource';

export interface ActiveFiltersProps {
  /** Definiciones disponibles para la tabla. */
  filters: readonly ResourceFilter[];
  /** Valores activos por llave de filtro. */
  values: Readonly<ResourceFilterValues>;
  /** Quita un valor seleccionado y devuelve el control al estado general. */
  onRemove: (key: string, value: string) => void;
}

export const ActiveFilters: Component<ActiveFiltersProps> = (props) => {
  const items = createMemo(() => {
    const active: Array<{ filter: ResourceFilter; value: string }> = [];

    for (const filter of activeResourceFilters(props.filters, props.values)) {
      for (const value of props.values[filter.key] ?? []) {
        active.push({ filter, value });
      }
    }

    return active.sort(
      (left, right) =>
        left.filter.label.localeCompare(right.filter.label, 'es-MX') ||
        left.value.localeCompare(right.value, 'es-MX'),
    );
  });

  return (
    <Show when={items().length > 0}>
      <div class="filter-chips" role="group" aria-label="Filtros activos">
        <For each={items()}>
          {(item) => (
            <button
              type="button"
              class="filter-chip"
              aria-label={`Quitar filtro ${item.filter.label}: ${item.value}`}
              onClick={() => props.onRemove(item.filter.key, item.value)}
            >
              <span>
                {item.filter.label}: {item.value}
              </span>
              <Icon name="x" size={16} />
            </button>
          )}
        </For>
      </div>
    </Show>
  );
};

export default ActiveFilters;
