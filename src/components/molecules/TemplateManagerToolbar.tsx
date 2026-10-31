/**
 * TemplateManagerToolbar — resumen y acciones del administrador de plantillas.
 *
 * Capa: molecule
 * Props: count, uploading, onUpload, onCreate
 * Efectos: ninguno; los botones delegan en el contenedor.
 */
import type { Component } from 'solid-js';

import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';

export interface TemplateManagerToolbarProps {
  /** Número de plantillas disponibles. */
  count: number;
  /** Indica que un archivo se está importando. */
  uploading: boolean;
  /** Abre el selector de archivos. */
  onUpload: () => void;
  /** Abre el editor en blanco. */
  onCreate: () => void;
}

export const TemplateManagerToolbar: Component<TemplateManagerToolbarProps> = (props) => (
  <div class="template-manager__toolbar">
    <p class="workspace__meta">
      {props.count} plantilla{props.count === 1 ? '' : 's'}
    </p>
    <div class="workspace__actions">
      <Button
        variant="secondary"
        size="sm"
        loading={props.uploading}
        onClick={props.onUpload}
      >
        <Icon name="upload" size={16} />
        Subir plantilla
      </Button>
      <Button variant="primary" size="sm" onClick={props.onCreate}>
        <Icon name="plus" size={16} />
        Nueva plantilla
      </Button>
    </div>
  </div>
);

export default TemplateManagerToolbar;
