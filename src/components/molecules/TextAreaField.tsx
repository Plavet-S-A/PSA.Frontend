/**
 * TextAreaField — etiqueta, área de texto, ayuda y error.
 *
 * Capa: molecule
 * Props: id, label, value, onInput, error, hint, required, placeholder,
 * maxlength, rows, wide, ref
 * Efectos: ninguno; no administra el valor.
 */
import type { Component } from 'solid-js';
import { Show } from 'solid-js';

import Icon from '@/components/atoms/Icon';

export interface TextAreaFieldProps {
  /** Identificador único del control. */
  id: string;
  /** Etiqueta visible. */
  label: string;
  /** Valor actual. */
  value: string;
  /** Notifica cada cambio con el valor ya extraído. */
  onInput: (value: string) => void;
  /** Mensaje de error; también marca el control como inválido. */
  error?: string;
  /** Ayuda breve bajo el control. */
  hint?: string;
  /** Marca el campo como obligatorio. */
  required?: boolean;
  /** Texto de ejemplo. */
  placeholder?: string;
  /** Longitud máxima del valor. */
  maxlength?: number;
  /** Altura inicial en líneas. Default: 6. */
  rows?: number;
  /** Ocupa las dos columnas del formulario. */
  wide?: boolean;
  /** Expone el control para insertar texto en la posición del cursor. */
  ref?: (element: HTMLTextAreaElement) => void;
}

export const TextAreaField: Component<TextAreaFieldProps> = (props) => {
  const errorId = () => `${props.id}-error`;
  const hintId = () => `${props.id}-hint`;
  const describedBy = () =>
    [props.hint ? hintId() : '', props.error ? errorId() : ''].filter(Boolean).join(' ') ||
    undefined;

  return (
    <div
      class={[
        'field',
        props.wide ? 'field--wide' : '',
        props.error ? 'field--invalid' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <label class="field__label" for={props.id}>
        {props.label}
        <Show when={props.required}>
          <span class="field__required" aria-hidden="true"> *</span>
          <span class="psa-visually-hidden"> (obligatorio)</span>
        </Show>
      </label>

      <textarea
        ref={props.ref}
        id={props.id}
        class="textarea"
        value={props.value}
        rows={props.rows ?? 6}
        placeholder={props.placeholder}
        maxLength={props.maxlength}
        required={props.required}
        aria-invalid={props.error ? 'true' : undefined}
        aria-describedby={describedBy()}
        onInput={(event) => props.onInput(event.currentTarget.value)}
      />

      <Show when={props.hint && !props.error}>
        <span class="field__hint" id={hintId()}>{props.hint}</span>
      </Show>
      <Show when={props.error}>
        <span class="field__error" id={errorId()}>
          <Icon name="alert" size={16} />
          {props.error}
        </span>
      </Show>
    </div>
  );
};

export default TextAreaField;
