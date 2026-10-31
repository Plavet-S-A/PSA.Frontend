/**
 * EmptyState — explica por qué no hay contenido y ofrece el siguiente paso.
 *
 * Capa: molecule
 * Props: title, description, actionLabel, onAction, icon
 * Efectos: ninguno.
 */
import type { Component } from 'solid-js';
import { Show } from 'solid-js';

import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import type { IconName } from '@/lib/ui/icons';

export interface EmptyStateProps {
  /** Título breve del estado. */
  title: string;
  /** Explicación de qué hacer a continuación. */
  description: string;
  /** Texto del botón opcional. */
  actionLabel?: string;
  /** Acción del botón opcional. */
  onAction?: () => void;
  /** Icono ilustrativo. Default: layers. */
  icon?: IconName;
}

export const EmptyState: Component<EmptyStateProps> = (props) => (
  <div class="empty-state">
    <span class="empty-state__icon">
      <Icon name={props.icon ?? 'layers'} size={20} />
    </span>
    <p class="empty-state__title">{props.title}</p>
    <p class="empty-state__description">{props.description}</p>
    <Show when={props.actionLabel && props.onAction}>
      <Button variant="secondary" size="sm" onClick={() => props.onAction?.()}>
        {props.actionLabel}
      </Button>
    </Show>
  </div>
);

export default EmptyState;
