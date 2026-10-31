/**
 * Validación básica de correo.
 *
 * Capa: lib/validation
 * Es una ayuda de experiencia; el servidor siempre vuelve a validar.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Comprueba si un texto tiene forma de correo electrónico.
 *
 * @param value Texto ingresado por la persona.
 * @returns true si cumple el patrón mínimo.
 */
export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}
