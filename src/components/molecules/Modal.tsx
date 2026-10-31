/**
 * Modal — diálogo accesible con foco atrapado y cierre por Escape.
 *
 * Capa: molecule
 * Props: open, title, description, size, onClose, children, footer
 * Efectos: usa `<dialog>` nativo para el foco atrapado y el fondo inerte.
 */
import type { Component, JSX } from 'solid-js';
import { createEffect, createSignal, createUniqueId, onCleanup, Show } from 'solid-js';
import { Portal } from 'solid-js/web';

import Icon from '@/components/atoms/Icon';

export interface ModalProps {
  /** Controla la visibilidad. */
  open: boolean;
  /** Título del diálogo. */
  title: string;
  /** Descripción opcional bajo el título. */
  description?: string;
  /** Ancho del panel. Default: md. */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Cierra el diálogo. */
  onClose: () => void;
  /** Contenido principal. */
  children: JSX.Element;
  /** Acciones al pie. */
  footer: JSX.Element;
}

export const Modal: Component<ModalProps> = (props) => {
  const titleId = createUniqueId();
  const descriptionId = createUniqueId();
  const [dialog, setDialog] = createSignal<HTMLDialogElement>();
  let pressedOnBackdrop = false;

  // El diálogo se muestra y se oculta con la API nativa: el navegador se
  // encarga del foco atrapado, del fondo inerte y de la tecla Escape.
  createEffect(() => {
    const element = dialog();
    if (!element) return;

    if (props.open) {
      if (!element.open) element.showModal();
      return;
    }

    if (element.open) element.close();
  });

  // El scroll del fondo se bloquea mientras el diálogo está abierto.
  createEffect(() => {
    if (!props.open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    onCleanup(() => {
      document.body.style.overflow = previousOverflow;
    });
  });

  // Escape cierra el `<dialog>` y dispara `close`: ahí se avisa al padre.
  const handleClose = () => {
    if (props.open) props.onClose();
  };

  // Solo se cierra si la pulsación y el clic caen en el fondo; así, el clic
  // que abrió el diálogo no lo cierra al terminar.
  const handlePointerDown = (event: PointerEvent) => {
    pressedOnBackdrop = event.target === dialog();
  };

  const handleBackdrop = (event: MouseEvent) => {
    if (pressedOnBackdrop && event.target === dialog()) props.onClose();
    pressedOnBackdrop = false;
  };

  return (
    <Portal>
      <dialog
        ref={setDialog}
        class="modal"
        aria-labelledby={titleId}
        aria-describedby={props.description ? descriptionId : undefined}
        onClose={handleClose}
        onPointerDown={handlePointerDown}
        onClick={handleBackdrop}
      >
        <div
          class={[
            'modal-box',
            props.size === 'sm' ? 'modal-box--sm' : '',
            props.size === 'lg' ? 'modal-box--lg' : '',
            props.size === 'xl' ? 'modal-box--xl' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div class="modal__header">
            <div>
              <h2 class="modal__title" id={titleId}>{props.title}</h2>
              <Show when={props.description}>
                <p class="modal__description" id={descriptionId}>{props.description}</p>
              </Show>
            </div>
            <button
              class="btn btn-ghost btn-square btn-sm"
              type="button"
              aria-label="Cerrar"
              title="Cerrar"
              onClick={props.onClose}
            >
              <Icon name="x" size={18} />
            </button>
          </div>
          <div class="modal__body">{props.children}</div>
          <div class="modal__footer">{props.footer}</div>
        </div>
      </dialog>
    </Portal>
  );
};

export default Modal;
