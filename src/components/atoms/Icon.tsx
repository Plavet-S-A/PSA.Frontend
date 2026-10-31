/**
 * Icon — versión Solid del catálogo de iconos.
 *
 * Capa: atom
 * Props: name, size, label, class
 * Efectos: ninguno.
 */
import type { Component } from 'solid-js';
import { For } from 'solid-js';

import { ICON_PATHS, type IconName } from '@/lib/ui/icons';

export interface IconProps {
  /** Nombre semántico del icono. */
  name: IconName;
  /** Tamaño en píxeles. Default: 18. */
  size?: 16 | 18 | 20 | 24;
  /** Texto accesible; si falta, el icono se oculta a lectores. */
  label?: string;
  /** Clases del consumidor. */
  class?: string;
}

export const Icon: Component<IconProps> = (props) => {
  const size = () => props.size ?? 18;
  const className = () => ['icon', `icon--${size()}`, props.class].filter(Boolean).join(' ');

  return (
    <svg
      class={className()}
      viewBox="0 0 24 24"
      width={size()}
      height={size()}
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      role={props.label ? 'img' : undefined}
      aria-label={props.label}
      aria-hidden={props.label ? undefined : 'true'}
    >
      <For each={ICON_PATHS[props.name]}>{(path) => <path d={path} />}</For>
    </svg>
  );
};

export default Icon;
