/**
 * Alert — aviso en línea para errores, información o confirmaciones.
 *
 * Capa: molecule
 * Props: tone, title, class, children
 * Efectos: ninguno.
 */
import type { Component, JSX } from 'solid-js';
import { Show } from 'solid-js';

import Icon from '@/components/atoms/Icon';
import { alertToneClass } from '@/lib/ui/daisy';
import type { AlertTone } from '@/lib/ui/daisy';
import type { IconName } from '@/lib/ui/icons';

export interface AlertProps {
  /** Tono del aviso. Default: info. */
  tone?: AlertTone;
  /** Título opcional sobre el contenido. */
  title?: string;
  /** Clases del consumidor. */
  class?: string;
  /** Contenido del aviso. */
  children: JSX.Element;
}

const ICONS: Record<AlertTone, IconName> = {
  error: 'alert',
  info: 'info',
  success: 'check',
};

export const Alert: Component<AlertProps> = (props) => {
  const tone = () => props.tone ?? 'info';

  return (
    <div
      class={['alert', alertToneClass(tone()), props.class].filter(Boolean).join(' ')}
      role={tone() === 'error' ? 'alert' : 'status'}
    >
      <span class="alert__icon">
        <Icon name={ICONS[tone()]} size={18} />
      </span>
      <div>
        <Show when={props.title}>
          <p class="alert__title">{props.title}</p>
        </Show>
        <div>{props.children}</div>
      </div>
    </div>
  );
};

export default Alert;
