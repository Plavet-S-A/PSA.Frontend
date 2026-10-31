/**
 * FiltersDialog — selección combinada de los filtros de una tabla.
 *
 * Capa: molecule
 * Props: open, filters, values, onApply, onClose
 * Efectos: mantiene un borrador local para no aplicar hasta confirmar y
 * guarda el término de búsqueda de cada filtro.
 */
import type { Component } from 'solid-js';
import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  For,
} from 'solid-js';

import Button from '@/components/atoms/Button';
import FilterField from '@/components/molecules/FilterField';
import Modal from '@/components/molecules/Modal';
import { sortResourceFilters } from '@/lib/ui/filters';
import type { ResourceFilter, ResourceFilterValues } from '@/types/resource';

export interface FiltersDialogProps {
  /** Controla la visibilidad. */
  open: boolean;
  /** Filtros disponibles en el contexto de la tabla. */
  filters: readonly ResourceFilter[];
  /** Valores aplicados actualmente. */
  values: Readonly<ResourceFilterValues>;
  /** Aplica la selección al cerrar el diálogo. */
  onApply: (values: ResourceFilterValues) => void;
  /** Cierra sin aplicar cambios. */
  onClose: () => void;
}

export const FiltersDialog: Component<FiltersDialogProps> = (props) => {
  const prefix = createUniqueId();
  const [draft, setDraft] = createSignal<ResourceFilterValues>({});
  const [searches, setSearches] = createSignal<Record<string, string>>({});

  createEffect(() => {
    if (!props.open) return;
    setDraft({ ...props.values });
    setSearches({});
  });

  const orderedFilters = createMemo(() => sortResourceFilters(props.filters));

  const selectedFor = (key: string) => draft()[key] ?? [];

  const toggleValue = (key: string, option: string) =>
    setDraft((current) => {
      const selected = current[key] ?? [];
      const next = selected.includes(option)
        ? selected.filter((item) => item !== option)
        : [...selected, option];
      const values = { ...current };

      if (next.length > 0) values[key] = next;
      else delete values[key];

      return values;
    });

  const setSingleValue = (key: string, option: string) =>
    setDraft((current) => ({ ...current, [key]: [option] }));

  const searchFor = (key: string) => searches()[key] ?? '';

  const setSearch = (key: string, value: string) =>
    setSearches((current) => ({ ...current, [key]: value }));

  const hasDraft = () =>
    props.filters.some((filter) => selectedFor(filter.key).length > 0);

  const apply = () => {
    props.onApply({ ...draft() });
    props.onClose();
  };

  return (
    <Modal
      open={props.open}
      title="Filtros"
      description="Combina los filtros para acotar los resultados."
      size="md"
      onClose={props.onClose}
      footer={
        <>
          <Button
            class="filters-dialog__clear"
            variant="ghost"
            disabled={!hasDraft()}
            onClick={() => setDraft({})}
          >
            Limpiar
          </Button>
          <Button variant="secondary" onClick={props.onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={apply}>
            Aplicar filtros
          </Button>
        </>
      }
    >
      <div class="filters-dialog__fields">
        <For each={orderedFilters()}>
          {(filter, index) => (
            <FilterField
              filter={filter}
              selected={selectedFor(filter.key)}
              search={searchFor(filter.key)}
              prefix={prefix}
              open={props.open}
              focusOnOpen={index() === 0}
              onSearchChange={(value) => setSearch(filter.key, value)}
              onToggle={(option) => toggleValue(filter.key, option)}
              onSelectSingle={(option) => setSingleValue(filter.key, option)}
            />
          )}
        </For>
      </div>
    </Modal>
  );
};

export default FiltersDialog;
