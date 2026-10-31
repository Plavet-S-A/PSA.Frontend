/**
 * FilterField — controles de un filtro dentro del diálogo de filtros.
 *
 * Capa: molecule
 * Props: filter, selected, search, prefix, open, focusOnOpen, onSearchChange,
 * onToggle, onSelectSingle
 * Efectos: enfoca el primer control útil cuando se abre el diálogo; el
 * borrador y la búsqueda los administra el diálogo.
 */
import type { Component } from 'solid-js';
import { createEffect, For, Show } from 'solid-js';

import Icon from '@/components/atoms/Icon';
import type { ResourceFilter } from '@/types/resource';

export interface FilterFieldProps {
  /** Definición del filtro que se muestra. */
  filter: ResourceFilter;
  /** Valores seleccionados del borrador. */
  selected: readonly string[];
  /** Término de búsqueda de las opciones. */
  search: string;
  /** Prefijo único para los identificadores del control. */
  prefix: string;
  /** Estado del diálogo; reinicia el foco cuando se abre. */
  open: boolean;
  /** Enfoca el primer control cuando se abre el diálogo. */
  focusOnOpen?: boolean;
  /** Notifica cambios en el buscador de opciones. */
  onSearchChange: (value: string) => void;
  /** Activa o desactiva una opción de selección múltiple. */
  onToggle: (option: string) => void;
  /** Fija el único valor de un filtro booleano. */
  onSelectSingle: (option: string) => void;
}

export const FilterField: Component<FilterFieldProps> = (props) => {
  let searchInput: HTMLInputElement | undefined;
  let firstOption: HTMLInputElement | undefined;

  const isBoolean = () => props.filter.type === 'boolean';

  // El foco inicial debe caer en el primer control útil, no en «Cerrar».
  createEffect(() => {
    if (!props.open || !props.focusOnOpen) return;
    const target = searchInput ?? firstOption;
    target?.focus();
  });

  const visibleOptions = () => {
    const term = props.search.trim().toLocaleLowerCase('es-MX');
    if (term === '') return props.filter.options;
    return props.filter.options.filter((option) =>
      option.toLocaleLowerCase('es-MX').includes(term),
    );
  };

  const summary = () => {
    if (props.selected.length === 0) return props.filter.allLabel;
    return `${props.selected.length} de ${props.filter.options.length} seleccionadas`;
  };

  return (
    <fieldset class="filter-field">
      <legend class="field__label">{props.filter.label}</legend>

      <Show when={!isBoolean() && props.filter.searchable}>
        <div class="field filter-field__search">
          <label
            class="psa-visually-hidden"
            for={`${props.prefix}-search-${props.filter.key}`}
          >
            Buscar {props.filter.label}
          </label>
          <div class="search-field">
            <Icon name="search" size={16} />
            <input
              ref={searchInput}
              id={`${props.prefix}-search-${props.filter.key}`}
              class="input"
              type="search"
              value={props.search}
              placeholder={`Buscar ${props.filter.label.toLocaleLowerCase('es-MX')}`}
              onInput={(event) => props.onSearchChange(event.currentTarget.value)}
            />
          </div>
        </div>
      </Show>

      <div class="filter-field__options">
        <For each={isBoolean() ? props.filter.options : visibleOptions()}>
          {(option, index) => (
            <label class="filter-option">
              <input
                ref={(element) => {
                  if (index() === 0) firstOption = element;
                }}
                type={isBoolean() ? 'radio' : 'checkbox'}
                name={`${props.prefix}-${props.filter.key}`}
                checked={props.selected.includes(option)}
                onChange={() =>
                  isBoolean()
                    ? props.onSelectSingle(option)
                    : props.onToggle(option)
                }
              />
              <span>{option}</span>
            </label>
          )}
        </For>
      </div>

      <Show when={!isBoolean() && visibleOptions().length === 0}>
        <p class="filter-field__meta">Sin coincidencias</p>
      </Show>

      <p class="filter-field__meta">{summary()}</p>
    </fieldset>
  );
};

export default FilterField;
