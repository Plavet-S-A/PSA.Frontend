/**
 * ResourceFormDialog — alta y edición de una fila del módulo.
 *
 * Capa: organism
 * Props: open, config, row, onClose, onSave, submitLabel, description,
 * idPrefix, error
 * Efectos: reinicia el formulario al abrir y enfoca el primer error.
 */
import type { Component } from 'solid-js';
import { createEffect, createSignal, For, Show } from 'solid-js';

import Button from '@/components/atoms/Button';
import Alert from '@/components/molecules/Alert';
import FormField from '@/components/molecules/FormField';
import Modal from '@/components/molecules/Modal';
import TextAreaField from '@/components/molecules/TextAreaField';
import {
  buildInitialValues,
  validateResourceForm,
} from '@/lib/validation/resource-form';
import type { ResourceConfig, ResourceRow } from '@/types/resource';

export interface ResourceFormDialogProps {
  /** Controla la visibilidad. */
  open: boolean;
  /** Configuración del módulo. */
  config: ResourceConfig;
  /** Fila en edición; undefined para alta. */
  row?: ResourceRow;
  /** Cierra el diálogo. */
  onClose: () => void;
  /** Entrega los valores validados. */
  onSave: (values: Record<string, string>) => void;
  /** Texto del botón al crear; por defecto «Crear registro». */
  submitLabel?: string;
  /** Descripción propia del diálogo; por defecto usa el microcopy de alta. */
  description?: string;
  /**
   * Prefijo de los identificadores del formulario. Necesario cuando conviven
   * dos diálogos de recurso en la misma pantalla para no duplicar `id`.
   */
  idPrefix?: string;
  /** Error de guardado ajeno a la validación; se muestra dentro del diálogo. */
  error?: string;
}

const DEFAULT_FORM_ID = 'resource-form';

/** Identificador del control de un campo. */
function fieldId(prefix: string, key: string): string {
  return `${prefix}-field-${key}`;
}

export const ResourceFormDialog: Component<ResourceFormDialogProps> = (props) => {
  const [values, setValues] = createSignal<Record<string, string>>({});
  const [errors, setErrors] = createSignal<Record<string, string>>({});

  const errorEntries = () => Object.entries(errors());
  const title = () => (props.row ? `Editar ${props.config.singular}` : props.config.createLabel);
  const prefix = () => props.idPrefix ?? 'resource';
  const formId = () => (props.idPrefix ? `${props.idPrefix}-form` : DEFAULT_FORM_ID);

  createEffect(() => {
    if (!props.open) return;
    setValues(buildInitialValues(props.config.fields, props.row));
    setErrors({});
  });

  const updateValue = (key: string, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    const nextErrors = validateResourceForm(props.config.fields, values());
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const firstKey = Object.keys(nextErrors)[0];
      if (firstKey) {
        queueMicrotask(() => document.getElementById(fieldId(prefix(), firstKey))?.focus());
      }
      return;
    }
    props.onSave(values());
  };

  return (
    <Modal
      open={props.open}
      title={title()}
      description={
        props.description ??
        (props.row
          ? 'Actualiza la información del registro y guarda los cambios.'
          : 'Completa la información para crear el registro.')
      }
      onClose={props.onClose}
      footer={
        <>
          <Button variant="secondary" onClick={props.onClose}>Cancelar</Button>
          <Button variant="primary" type="submit" form={formId()}>
            {props.row ? 'Guardar cambios' : (props.submitLabel ?? 'Crear registro')}
          </Button>
        </>
      }
    >
      <Show when={props.error}>
        <div class="form-summary">
          <Alert tone="error" title="No se pudo guardar">
            <p>{props.error}</p>
          </Alert>
        </div>
      </Show>

      <Show when={errorEntries().length > 0}>
        <div class="form-summary">
          <Alert tone="error" title="Revisa la información">
            <p>Hay {errorEntries().length} campo(s) por corregir.</p>
            <ul class="form-summary__list">
              <For each={errorEntries()}>
                {([key, message]) => (
                  <li>
                    <a class="form-summary__link" href={`#${fieldId(prefix(), key)}`}>
                      {message}
                    </a>
                  </li>
                )}
              </For>
            </ul>
          </Alert>
        </div>
      </Show>

      <form id={formId()} class="form-grid" onSubmit={submit} noValidate>
        <For each={props.config.fields}>
          {(field) => (
            <Show
              when={field.type === 'textarea'}
              fallback={
                <FormField
                  id={fieldId(prefix(), field.key)}
                  label={field.label}
                  type={field.type}
                  value={values()[field.key] ?? ''}
                  onInput={(value) => updateValue(field.key, value)}
                  error={errors()[field.key]}
                  hint={field.hint}
                  required={field.required}
                  placeholder={field.placeholder}
                  autocomplete={field.autocomplete}
                  options={field.options}
                  min={field.min}
                  max={field.max}
                  wide={field.wide}
                />
              }
            >
              <TextAreaField
                id={fieldId(prefix(), field.key)}
                label={field.label}
                value={values()[field.key] ?? ''}
                onInput={(value) => updateValue(field.key, value)}
                error={errors()[field.key]}
                hint={field.hint}
                required={field.required}
                placeholder={field.placeholder}
                rows={field.rows ?? 3}
                wide={field.wide}
              />
            </Show>
          )}
        </For>
      </form>
    </Modal>
  );
};

export default ResourceFormDialog;
