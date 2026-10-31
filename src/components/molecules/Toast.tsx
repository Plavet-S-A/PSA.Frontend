/**
 * Toast — aviso breve que se descarta solo.
 *
 * Capa: molecule
 * Props: message, tone, onDismiss
 * Efectos: programa el cierre a los 5 segundos.
 */
import type { Component } from 'solid-js';
import { createEffect, onCleanup, Show } from 'solid-js';

import Icon from '@/components/atoms/Icon';
import { alertToneClass } from '@/lib/ui/daisy';
import type { ToastTone } from '@/lib/ui/daisy';
import type { IconName } from '@/lib/ui/icons';

export interface ToastProps {
  /** Mensaje visible; null oculta el aviso. */
  message: string | null;
  /** Tono del aviso. Default: success. */
  tone?: ToastTone;
  /** Descarta el aviso. */
  onDismiss: () => void;
}

const DURATION_MS = 5000;

const ICONS: Record<ToastTone, IconName> = {
  success: 'check',
  error: 'alert',
  info: 'info',
};

export const Toast: Component<ToastProps> = (props) => {
  createEffect(() => {
    if (!props.message) return;

    const timer = setTimeout(() => props.onDismiss(), DURATION_MS);
    onCleanup(() => clearTimeout(timer));
  });

  const tone = () => props.tone ?? 'success';

  return (
    <Show when={props.message}>
      <div
        class="toast"
        role={tone() === 'error' ? 'alert' : 'status'}
        aria-live={tone() === 'error' ? 'assertive' : 'polite'}
        aria-atomic="true"
      >
        <div class={['alert', 'toast__message', alertToneClass(tone())].join(' ')}>
          <span class="alert__icon">
            <Icon name={ICONS[tone()]} size={18} />
          </span>
          <div class="toast__body">
            <p class="toast__content">{props.message}</p>
            <button
              class="toast__close"
              type="button"
              aria-label="Cerrar aviso"
              title="Cerrar aviso"
              onClick={props.onDismiss}
            >
              <Icon name="x" size={16} />
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default Toast;
