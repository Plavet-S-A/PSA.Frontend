/**
 * Badge — versión Solid del indicador de estado.
 *
 * Capa: atom
 * Props: tone, class, children
 * Efectos: ninguno.
 */
import type { Component, JSX } from 'solid-js';

import { badgeToneClass } from '@/lib/ui/daisy';
import type { StatusTone } from '@/lib/ui/status';

export interface BadgeProps {
  /** Tono semántico. Default: neutral. */
  tone?: StatusTone;
  /** Clases del consumidor. */
  class?: string;
  /** Texto del estado. */
  children: JSX.Element;
}

export const Badge: Component<BadgeProps> = (props) => (
  <span class={['badge', badgeToneClass(props.tone ?? 'neutral'), props.class].filter(Boolean).join(' ')}>
    <span class="badge__dot" aria-hidden="true" />
    {props.children}
  </span>
);

export default Badge;
