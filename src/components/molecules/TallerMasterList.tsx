/**
 * TallerMasterList — navegación maestra de talleres para los espacios de trabajo.
 *
 * Capa: molecule
 * Props: id, hidden, items, selected, onSelect
 * Efectos: ninguno; notifica la selección del taller.
 */
import type { Component } from 'solid-js';
import { For, Show } from 'solid-js';

import Badge from '@/components/atoms/Badge';

export interface TallerMasterItem {
  nombre: string;
  meta: string;
  /** Aviso breve, por ejemplo "3 pendientes". */
  flag?: string;
}

export interface TallerMasterListProps {
  /** Id del panel, enlazado con el aria-controls del disparador. */
  id?: string;
  /** true cuando el panel está plegado; bloquea foco y lectores de pantalla. */
  hidden?: boolean;
  items: readonly TallerMasterItem[];
  /** Taller seleccionado; null si aún no hay ninguno. */
  selected: string | null;
  /** Etiqueta accesible del panel; cambia a «Plazas» en el alcance por plaza. */
  label?: string;
  onSelect: (nombre: string) => void;
}

export const TallerMasterList: Component<TallerMasterListProps> = (props) => (
  <nav
    id={props.id}
    class="workspace__master"
    aria-label={props.label ?? 'Talleres'}
    aria-hidden={props.hidden ? 'true' : undefined}
    inert={props.hidden}
  >
    <ul class="master-list">
      <For each={props.items}>
        {(item) => (
          <li>
            <button
              type="button"
              class="master-item"
              aria-pressed={props.selected === item.nombre}
              onClick={() => props.onSelect(item.nombre)}
            >
              <span class="master-item__name">{item.nombre}</span>
              <span class="master-item__meta">{item.meta}</span>
              <Show when={item.flag}>
                {(flag) => <Badge tone="warning">{flag()}</Badge>}
              </Show>
            </button>
          </li>
        )}
      </For>
    </ul>
  </nav>
);

export default TallerMasterList;
