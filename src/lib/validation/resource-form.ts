/**
 * Construcción y validación de formularios de recursos.
 *
 * Capa: lib/validation
 * Las reglas son puras y compartidas por todos los módulos; el formulario solo
 * pinta los mensajes que devuelve este módulo.
 */

import type { ResourceField, ResourceRow } from '@/types/resource';
import { isValidEmail } from '@/lib/validation/email';

const PHONE_PATTERN = /^[+()\d\s-]{7,20}$/;

function valueOf(row: ResourceRow | undefined, key: string, fallback: string): string {
  if (!row) return fallback;
  const value = row[key];
  return value === undefined ? fallback : String(value);
}

/**
 * Crea el estado inicial del formulario a partir de una fila existente.
 *
 * @param fields Campos del módulo.
 * @param row Fila en edición; undefined para alta.
 * @returns Valores del formulario indexados por llave.
 */
export function buildInitialValues(
  fields: readonly ResourceField[],
  row?: ResourceRow,
): Record<string, string> {
  const values: Record<string, string> = {};
  for (const field of fields) {
    values[field.key] = valueOf(row, field.key, field.defaultValue ?? '');
  }
  return values;
}

function validateField(field: ResourceField, rawValue: string): string | null {
  const value = rawValue.trim();
  if (field.required && value === '') return 'Este campo es obligatorio.';
  if (value === '') return null;

  if (field.type === 'email' && !isValidEmail(value)) {
    return 'Escribe un correo válido.';
  }
  if (field.type === 'tel' && !PHONE_PATTERN.test(value)) {
    return 'Escribe un teléfono válido de 7 a 20 caracteres.';
  }
  if (field.type === 'number') {
    const number = Number(value);
    if (!Number.isFinite(number)) return 'Escribe un número válido.';
    if (field.min !== undefined && number < field.min) return `El mínimo es ${field.min}.`;
    if (field.max !== undefined && number > field.max) return `El máximo es ${field.max}.`;
  }
  if (field.type === 'select' && field.options && !field.options.includes(value)) {
    return 'Selecciona una opción válida.';
  }
  return null;
}

/**
 * Valida todos los campos y devuelve los errores por llave.
 *
 * @param fields Campos del módulo.
 * @param values Valores actuales del formulario.
 * @returns Objeto vacío cuando no hay errores.
 */
export function validateResourceForm(
  fields: readonly ResourceField[],
  values: Record<string, string>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const error = validateField(field, values[field.key] ?? '');
    if (error) errors[field.key] = error;
  }
  return errors;
}
