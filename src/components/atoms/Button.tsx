/**
 * Button — versión Solid de la acción del sistema.
 *
 * Capa: atom
 * Props: variant, size, loading, block, iconOnly, class y atributos nativos.
 * Efectos: ninguno.
 */
import type { Component, JSX } from 'solid-js';
import { Show, splitProps } from 'solid-js';

import { buttonVariantClass } from '@/lib/ui/daisy';
import type { ButtonSize, ButtonVariant } from '@/lib/ui/daisy';

export type { ButtonSize, ButtonVariant } from '@/lib/ui/daisy';

export interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Jerarquía visual. Default: secondary. */
  variant?: ButtonVariant;
  /** Altura del control. Default: md. */
  size?: ButtonSize;
  /** Muestra spinner y bloquea la acción. */
  loading?: boolean;
  /** Ocupa todo el ancho disponible. */
  block?: boolean;
  /** Cuadrado, para un icono con etiqueta accesible. */
  iconOnly?: boolean;
}

export const Button: Component<ButtonProps> = (props) => {
  const [local, rest] = splitProps(props, [
    'variant',
    'size',
    'loading',
    'block',
    'iconOnly',
    'class',
    'children',
    'disabled',
  ]);

  const className = () =>
    [
      'btn',
      buttonVariantClass(local.variant ?? 'secondary'),
      local.size === 'sm' ? 'btn-sm' : '',
      local.size === 'lg' ? 'btn-lg' : '',
      local.block ? 'btn-block' : '',
      local.iconOnly ? 'btn-square' : '',
      local.class,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <button
      class={className()}
      {...rest}
      disabled={local.disabled || local.loading}
      aria-busy={local.loading ? 'true' : undefined}
    >
      <Show when={local.loading}>
        <span class="loading loading-spinner" aria-hidden="true" />
      </Show>
      {local.children}
    </button>
  );
};

export default Button;
