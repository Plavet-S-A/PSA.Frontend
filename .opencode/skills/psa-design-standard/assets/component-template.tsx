/**
 * ComponentName — una frase que explique qué hace y para qué existe.
 *
 * Capa: molecule | organism
 * Props: title, compact, class
 * Efectos: ninguno.
 *
 * Ejemplo:
 *   <ComponentName title="Documentos" compact />
 */
import type { Component } from 'solid-js';
import { splitProps } from 'solid-js';

export interface ComponentNameProps {
  /** Título visible. */
  title: string;
  /** Reduce el espaciado. Default: false. */
  compact?: boolean;
  /** Clases del consumidor; se suman a las del componente. */
  class?: string;
}

export const ComponentName: Component<ComponentNameProps> = (props) => {
  const [local, rest] = splitProps(props, ['title', 'compact', 'class']);

  // Se compone una sola cadena para no mezclar class y classList.
  const className = () =>
    ['component', local.compact ? 'component--compact' : '', local.class]
      .filter(Boolean)
      .join(' ');

  return (
    <section class={className()} {...rest}>
      <h2 class="component__title">{local.title}</h2>
    </section>
  );
};
