/**
 * ConfirmDialog — confirmación explícita para una acción destructiva.
 *
 * Capa: molecule
 * Props: open, title, description, confirmLabel, onConfirm, onClose
 * Efectos: ninguno propio; delega en Modal.
 */
import type { Component } from 'solid-js';

import Button from '@/components/atoms/Button';
import Modal from '@/components/molecules/Modal';

export interface ConfirmDialogProps {
  /** Controla la visibilidad. */
  open: boolean;
  /** Título del diálogo. */
  title: string;
  /** Explica la consecuencia de confirmar. */
  description: string;
  /** Texto del botón destructivo. Default: Eliminar. */
  confirmLabel?: string;
  /** Ejecuta la acción confirmada. */
  onConfirm: () => void;
  /** Cancela y cierra. */
  onClose: () => void;
}

export const ConfirmDialog: Component<ConfirmDialogProps> = (props) => (
  <Modal
    open={props.open}
    title={props.title}
    size="sm"
    onClose={props.onClose}
    footer={
      <>
        <Button variant="secondary" onClick={props.onClose}>Cancelar</Button>
        <Button variant="danger" onClick={props.onConfirm}>
          {props.confirmLabel ?? 'Eliminar'}
        </Button>
      </>
    }
  >
    <p class="confirm-text">{props.description}</p>
  </Modal>
);

export default ConfirmDialog;
