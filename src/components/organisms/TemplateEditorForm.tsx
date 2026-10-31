/**
 * TemplateEditorForm — formulario de edición de una plantilla.
 *
 * Capa: organism
 * Props: formId, values, errors, source, fileName, cambios y onSubmit
 * Efectos: inserta marcadores en la posición del cursor del cuerpo.
 */
import type { Component } from 'solid-js';
import { For, Show } from 'solid-js';

import Alert from '@/components/molecules/Alert';
import FormField from '@/components/molecules/FormField';
import TextAreaField from '@/components/molecules/TextAreaField';
import {
  DOCUMENT_BODY_MAX,
  DOCUMENT_FOOTER_MAX,
  DOCUMENT_HEADING_MAX,
  GRADE_PLACEHOLDERS,
  TEMPLATE_NAME_MAX,
} from '@/lib/grading/templates';

export interface TemplateEditorFormProps {
  /** Identificador del formulario para el botón de guardado externo. */
  formId: string;
  name: string;
  title: string;
  body: string;
  footer: string;
  errors: Record<string, string>;
  source: 'custom' | 'uploaded';
  fileName?: string;
  onNameChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onFooterChange: (value: string) => void;
  onSubmit: (event: SubmitEvent) => void;
}

function fieldId(key: string): string {
  return `template-field-${key}`;
}

export const TemplateEditorForm: Component<TemplateEditorFormProps> = (props) => {
  let bodyInput: HTMLTextAreaElement | undefined;

  const insertPlaceholder = (key: string) => {
    const token = `{{${key}}}`;
    const textarea = bodyInput;
    if (!textarea) {
      props.onBodyChange(`${props.body}${token}`);
      return;
    }

    const start = textarea.selectionStart ?? props.body.length;
    const end = textarea.selectionEnd ?? start;
    const next = props.body.slice(0, start) + token + props.body.slice(end);
    props.onBodyChange(next);
    queueMicrotask(() => {
      textarea.focus();
      const position = start + token.length;
      textarea.setSelectionRange(position, position);
    });
  };

  return (
    <>
      <Show when={props.source === 'uploaded'}>
        <Alert class="template-manager__error" tone="info" title="Plantilla importada">
          Se importó el texto de {props.fileName}. Puedes ajustar el nombre, el título,
          el contenido y la firma antes de guardar.
        </Alert>
      </Show>

      <form id={props.formId} class="form-grid" onSubmit={props.onSubmit} noValidate>
        <FormField
          id={fieldId('name')}
          label="Nombre de la plantilla"
          value={props.name}
          onInput={props.onNameChange}
          error={props.errors.name}
          required
          maxlength={TEMPLATE_NAME_MAX}
          placeholder="Ej. Constancia de calificación"
          wide
        />
        <FormField
          id={fieldId('title')}
          label="Título del documento"
          value={props.title}
          onInput={props.onTitleChange}
          error={props.errors.title}
          required
          maxlength={DOCUMENT_HEADING_MAX}
          placeholder="Ej. Constancia de calificación"
          hint="Admite marcadores como {{estudiante}}."
          wide
        />
        <TextAreaField
          id={fieldId('body')}
          label="Contenido"
          value={props.body}
          onInput={props.onBodyChange}
          error={props.errors.body}
          required
          maxlength={DOCUMENT_BODY_MAX}
          rows={10}
          placeholder="Escribe el texto de la plantilla."
          hint="Los marcadores se sustituyen al generar el documento."
          ref={(element) => { bodyInput = element; }}
          wide
        />
        <div class="template-editor__placeholders">
          <span class="template-editor__label">Insertar marcador:</span>
          <For each={GRADE_PLACEHOLDERS}>
            {(placeholder) => (
              <button
                type="button"
                class="placeholder-chip"
                onClick={() => insertPlaceholder(placeholder.key)}
                title={`Insertar ${placeholder.label}`}
              >
                {`{{${placeholder.key}}}`}
              </button>
            )}
          </For>
        </div>
        <TextAreaField
          id={fieldId('footer')}
          label="Pie o firma"
          value={props.footer}
          onInput={props.onFooterChange}
          error={props.errors.footer}
          maxlength={DOCUMENT_FOOTER_MAX}
          rows={4}
          placeholder="Firma, fecha y datos de contacto."
          wide
        />
      </form>
    </>
  );
};

export default TemplateEditorForm;
