/**
 * WorkspaceMasterToggle — disparador estable del panel de talleres.
 *
 * Capa: molecule
 * Props: expanded, controls, count, onToggle
 * Efectos: no muta estado; notifica la apertura o el cierre del panel.
 * El botón conserva su posición y su ancho para que ocultar y mostrar no
 * obligue a buscar el control en otra esquina.
 */
import type { Component } from 'solid-js';
import { Show } from 'solid-js';

import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';

export interface WorkspaceMasterToggleProps {
  /** true cuando el panel de talleres está visible. */
  expanded: boolean;
  /** Id del panel que controla el botón. */
  controls: string;
  /** Número de talleres disponibles. */
  count?: number;
  /** Texto del disparador; cambia a «Plazas» en el alcance por plaza. */
  label?: string;
  onToggle: () => void;
}

export const WorkspaceMasterToggle: Component<WorkspaceMasterToggleProps> = (props) => {
  const label = () => props.label ?? 'Talleres';
  return (
    <Button
      class="workspace__master-toggle"
      variant="ghost"
      size="sm"
      aria-expanded={props.expanded}
      aria-controls={props.controls}
      aria-label={`${props.expanded ? 'Ocultar' : 'Mostrar'} ${label().toLowerCase()}`}
      title={`${props.expanded ? 'Ocultar' : 'Mostrar'} ${label().toLowerCase()}`}
      onClick={() => props.onToggle()}
    >
      <Icon name={props.expanded ? 'eye-off' : 'eye'} size={16} />
      <span>{label()}</span>
      <Show when={props.count !== undefined}>
        <span class="workspace__master-toggle-count" aria-hidden="true">
          {props.count}
        </span>
      </Show>
    </Button>
  );
};

export default WorkspaceMasterToggle;
