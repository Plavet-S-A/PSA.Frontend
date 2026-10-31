/**
 * FormField — etiqueta, control, ayuda y error de un campo.
 *
 * Capa: molecule
 * Props: id, label, type, value, onInput, error, hint, required, placeholder,
 * autocomplete, options, min, max, wide
 * Efectos: alterna la visibilidad de la contraseña.
 */
import type { Component } from 'solid-js';
import { createSignal, Show } from 'solid-js';

import Icon from '@/components/atoms/Icon';
import type { ResourceFieldType } from '@/types/resource';

export interface FormFieldProps {
  /** Identificador único del control. */
  id: string;
  /** Etiqueta visible. */
  label: string;
  /** Tipo de control. Default: text. */
  type?: ResourceFieldType | 'password';
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
  /** Pista de autocompletado del navegador. */
  autocomplete?: string;
  /** Teclado sugerido en dispositivos móviles. */
  inputmode?: 'numeric' | 'text' | 'tel';
  /** Longitud máxima del valor. */
  maxlength?: number;
  /** Opciones cuando el control es un select. */
  options?: readonly string[];
  /** Límite inferior para campos numéricos. */
  min?: number;
  /** Límite superior para campos numéricos. */
  max?: number;
  /** Ocupa las dos columnas del formulario. */
  wide?: boolean;
}

export const FormField: Component<FormFieldProps> = (props) => {
  const [showPassword, setShowPassword] = createSignal(false);
  const type = () => props.type ?? 'text';
  const errorId = () => `${props.id}-error`;
  const hintId = () => `${props.id}-hint`;
  const describedBy = () =>
    [props.hint ? hintId() : '', props.error ? errorId() : ''].filter(Boolean).join(' ') ||
    undefined;

  return (
    <div class={['field', props.wide ? 'field--wide' : '', props.error ? 'field--invalid' : ''].filter(Boolean).join(' ')}>
      <label class="field__label" for={props.id}>
        {props.label}
        <Show when={props.required}>
          <span class="field__required" aria-hidden="true"> *</span>
          <span class="psa-visually-hidden"> (obligatorio)</span>
        </Show>
      </label>

      <Show
        when={type() === 'select'}
        fallback={
          <div class="field__control-wrap">
            <input
              id={props.id}
              class="input"
              type={props.type === 'password' && showPassword() ? 'text' : type()}
              value={props.value}
              placeholder={props.placeholder}
              autocomplete={props.autocomplete}
              inputmode={props.inputmode}
              maxLength={props.maxlength}
              min={props.min}
              max={props.max}
              required={props.required}
              aria-invalid={props.error ? 'true' : undefined}
              aria-describedby={describedBy()}
              onInput={(event) => props.onInput(event.currentTarget.value)}
            />
            <Show when={props.type === 'password'}>
              <button
                class="field__action"
                type="button"
                aria-label={showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                title={showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                <Icon name={showPassword() ? 'eye-off' : 'eye'} size={16} />
              </button>
            </Show>
          </div>
        }
      >
        <div class="field__select-wrap">
          <select
            id={props.id}
            class="select"
            value={props.value}
            required={props.required}
            aria-invalid={props.error ? 'true' : undefined}
            aria-describedby={describedBy()}
            onChange={(event) => props.onInput(event.currentTarget.value)}
          >
            <option value="">Selecciona una opción</option>
            {props.options?.map((option) => <option value={option}>{option}</option>)}
          </select>
        </div>
      </Show>

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

export default FormField;
