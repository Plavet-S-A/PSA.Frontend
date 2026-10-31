/**
 * Verificación de contraseñas PBKDF2-SHA256.
 *
 * Capa: lib/auth
 * El formato almacenado es `pbkdf2$iteraciones$sal$hash` en base64. La
 * comparación es de tiempo constante. En producción el hash lo administra la
 * API real; esta pieza solo sostiene el acceso de demostración.
 */

/** OWASP recomienda al menos 600 000 iteraciones para PBKDF2-HMAC-SHA256. */
const ITERATIONS_MIN = 600_000;
const ITERATIONS_MAX = 1_000_000;
const KEY_BITS = 256;
const encoder = new TextEncoder();

/**
 * Hash de relleno para igualar el tiempo de respuesta cuando el correo no
 * existe. Nunca coincide con una contraseña real.
 */
export const DUMMY_PASSWORD_HASH =
  'pbkdf2$600000$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';

function decodeBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function timingSafeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

/**
 * Comprueba una contraseña contra un hash PBKDF2 almacenado.
 *
 * @param password Contraseña en claro recibida por el endpoint.
 * @param stored Hash con formato `pbkdf2$iteraciones$sal$hash`.
 * @returns true solo si la contraseña coincide.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;

  const iterations = Number(parts[1]);
  if (!Number.isInteger(iterations)) return false;
  if (iterations < ITERATIONS_MIN || iterations > ITERATIONS_MAX) return false;

  try {
    const salt = decodeBase64(parts[2] ?? '');
    const expected = decodeBase64(parts[3] ?? '');
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits'],
    );
    const derived = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
      keyMaterial,
      KEY_BITS,
    );
    return timingSafeEqual(new Uint8Array(derived), expected);
  } catch {
    return false;
  }
}
