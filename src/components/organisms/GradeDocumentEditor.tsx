/**
 * GradeDocumentEditor — edición del documento generado a partir de una plantilla.
 *
 * Capa: organism
 * Props: formId, templates, values, errors, cambios, onRestore, onSubmit
 * Efectos: ninguno; el estado vive en GradeDocumentDialog.
 */
import type { Component } from 'solid-js';
import { For, Show } from 'solid-js';

import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import FormField from '@/components/molecules/FormField';
import TextAreaField from '@/components/molecules/TextAreaField';
import {
  DOCUMENT_BODY_MAX,
  DOCUMENT_FOOTER_MAX,
  DOCUMENT_HEADING_MAX,
} from '@/lib/grading/templates';
import type { GradeTemplate } from '@/types/grading';

export interface GradeDocumentEditorProps {
  /** Identificador del formulario para el botón externo de guardado. */
  formId: string;
  /** Plantillas disponibles. */
  templates: readonly GradeTemplate[];
  /** Plantilla seleccionada. */
  templateId: string;
  heading: string;
  body: string;
  footer: string;
  errors: Record<string, string>;
  /** Cambia de plantilla y regenera el contenido. */
  onTemplateChange: (id: string) => void;
  onHeadingChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onFooterChange: (value: string) => void;
  /** Restaura el contenido desde la plantilla seleccionada. */
  onRestore: () => void;
  onSubmit: (event: SubmitEvent) => void;
}

export const GradeDocumentEditor: Component<GradeDocumentEditorProps> = (props) => (
  <form id={props.formId} class="document-editor" onSubmit={props.onSubmit} noValidate>
    <Show when={props.templates.length > 0}>
      <div class="field">
        <label class="field__label" for="document-template">Plantilla</label>
        <div class="field__select-wrap">
          <select
            id="document-template"
            class="select"
            value={props.templateId}
            onChange={(event) => props.onTemplateChange(event.currentTarget.value)}
          >
            <Show when={!props.templates.some((item) => item.id === props.templateId)}>
              <option value={props.templateId}>Plantilla no disponible</option>
            </Show>
            <For each={props.templates}>
              {(template) => <option value={template.id}>{template.name}</option>}
            </For>
          </select>
        </div>
        <span class="field__hint">
          Cambiar de plantilla reemplaza el contenido actual del editor.
        </span>
      </div>
    </Show>

    <FormField
      id="document-field-heading"
      label="Título del documento"
      value={props.heading}
      onInput={props.onHeadingChange}
      error={props.errors.heading}
      required
      maxlength={DOCUMENT_HEADING_MAX}
    />
    <TextAreaField
      id="document-field-body"
      label="Contenido"
      value={props.body}
      onInput={props.onBodyChange}
      error={props.errors.body}
      required
      maxlength={DOCUMENT_BODY_MAX}
      rows={9}
      hint="Este texto se genera con la plantilla y puedes editarlo libremente."
    />
    <TextAreaField
      id="document-field-footer"
      label="Pie o firma"
      value={props.footer}
      onInput={props.onFooterChange}
      error={props.errors.footer}
      maxlength={DOCUMENT_FOOTER_MAX}
      rows={4}
    />
    <div class="document-editor__actions">
      <Button
        variant="ghost"
        size="sm"
        type="button"
        onClick={props.onRestore}
        disabled={props.templates.length === 0}
      >
        <Icon name="refresh" size={16} />
        Restaurar desde plantilla
      </Button>
    </div>
  </form>
);

export default GradeDocumentEditor;
