/**
 * ResourceToolbar — búsqueda, filtros combinados y acciones de un módulo.
 *
 * Capa: molecule
 * Props: query, filters, filterValues, searchPlaceholder, createLabel,
 * hasFilters, onQueryChange, onFiltersChange, onFilterRemove, onClear,
 * onCreate, importLabel, onImport
 * Efectos: abre el diálogo de filtros y conserva su estado de visibilidad.
 */
import type { Component } from 'solid-js';
import { createSignal, Show } from 'solid-js';

import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import ActiveFilters from '@/components/molecules/ActiveFilters';
import FiltersDialog from '@/components/molecules/FiltersDialog';
import {
  isFilterActive,
  removeFilterValue,
} from '@/lib/ui/filters';
import type {
  ResourceFilter,
  ResourceFilterValues,
} from '@/types/resource';

export interface ResourceToolbarProps {
  /** Término de búsqueda actual. */
  query: string;
  /** Filtros disponibles para esta tabla. */
  filters?: readonly ResourceFilter[];
  /** Valores activos por llave de filtro. */
  filterValues?: Readonly<ResourceFilterValues>;
  /** Texto de ejemplo para la búsqueda. */
  searchPlaceholder: string;
  /** Texto del botón de alta. */
  createLabel: string;
  /** Indica si hay algún filtro activo o una búsqueda escrita. */
  hasFilters: boolean;
  /** Notifica cambios en la búsqueda. */
  onQueryChange: (value: string) => void;
  /** Aplica una selección combinada de filtros. */
  onFiltersChange?: (values: ResourceFilterValues) => void;
  /** Quita un valor seleccionado desde su chip. */
  onFilterRemove?: (key: string, value: string) => void;
  /** Limpia la búsqueda y todos los filtros. */
  onClear: () => void;
  /** Abre el formulario de alta; si falta, el módulo es de solo consulta. */
  onCreate?: () => void;
  /** Texto del botón de importación; se omite si el módulo no la admite. */
  importLabel?: string;
  /** Abre el diálogo de importación masiva. */
  onImport?: () => void;
}

export const ResourceToolbar: Component<ResourceToolbarProps> = (props) => {
  const [filtersOpen, setFiltersOpen] = createSignal(false);

  const filters = () => props.filters ?? [];
  const values = () => props.filterValues ?? {};

  const activeCount = () =>
    filters().filter((filter) => isFilterActive(filter, values())).length;

  const triggerLabel = () => {
    const count = activeCount();
    if (count === 0) return 'Filtros';
    return `Filtros, ${count} ${count === 1 ? 'activo' : 'activos'}`;
  };

  const applyFilters = (next: ResourceFilterValues) => {
    props.onFiltersChange?.(next);
    setFiltersOpen(false);
  };

  const removeFilter = (key: string, value: string) => {
    if (props.onFilterRemove) {
      props.onFilterRemove(key, value);
      return;
    }

    props.onFiltersChange?.(removeFilterValue(values(), key, value));
  };

  const liveLabel = () => {
    const count = activeCount();
    if (count === 0) return 'Sin filtros activos';
    return `${count} ${count === 1 ? 'filtro activo' : 'filtros activos'}`;
  };

  return (
    <div class="resource-toolbar">
      <div class="field resource-toolbar__search">
        <label class="psa-visually-hidden" for="resource-search">
          Buscar registros
        </label>
        <div class="search-field">
          <Icon name="search" size={16} />
          <input
            id="resource-search"
            class="input"
            type="search"
            value={props.query}
            placeholder={props.searchPlaceholder}
            onInput={(event) => props.onQueryChange(event.currentTarget.value)}
          />
        </div>
      </div>

      <Show when={filters().length > 0}>
        <Button
          variant="secondary"
          aria-label={triggerLabel()}
          onClick={() => setFiltersOpen(true)}
        >
          <Icon name="filter" size={16} />
          Filtros
          <Show when={activeCount() > 0}>
            <span class="filter-button__count" aria-hidden="true">
              {activeCount()}
            </span>
          </Show>
        </Button>
      </Show>

      <Show when={props.hasFilters}>
        <Button variant="ghost" onClick={props.onClear}>
          <Icon name="x" size={16} />
          Limpiar filtros
        </Button>
      </Show>

      <Show when={props.onCreate || props.onImport}>
        <div class="resource-toolbar__actions">
          <Show when={props.onImport}>
            {(onImport) => (
              <Button variant="secondary" onClick={onImport()}>
                <Icon name="upload" size={16} />
                {props.importLabel ?? 'Importar'}
              </Button>
            )}
          </Show>
          <Show when={props.onCreate}>
            {(onCreate) => (
              <Button variant="primary" onClick={onCreate()}>
                <Icon name="plus" size={16} />
                {props.createLabel}
              </Button>
            )}
          </Show>
        </div>
      </Show>

      <Show when={activeCount() > 0}>
        <ActiveFilters
          filters={filters()}
          values={values()}
          onRemove={removeFilter}
        />
      </Show>

      <p class="psa-visually-hidden" role="status" aria-live="polite">
        {liveLabel()}
      </p>

      <FiltersDialog
        open={filtersOpen()}
        filters={filters()}
        values={values()}
        onApply={applyFilters}
        onClose={() => setFiltersOpen(false)}
      />
    </div>
  );
};

export default ResourceToolbar;
