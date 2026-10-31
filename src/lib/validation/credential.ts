/**
 * Validación básica de credenciales.
 *
 * Capa: lib/validation
 * La credencial es un número de 4 a 12 dígitos. Es una ayuda de experiencia; el
 * servidor siempre vuelve a validar.
 */

const CREDENTIAL_PATTERN = /^\d{4,12}$/;

/**
 * Comprueba si un texto tiene forma de credencial numérica.
 *
 * @param value Texto ingresado por la persona.
 * @returns true si solo contiene dígitos y cumple la longitud.
 */
export function isValidCredential(value: string): boolean {
  return CREDENTIAL_PATTERN.test(value.trim());
}
