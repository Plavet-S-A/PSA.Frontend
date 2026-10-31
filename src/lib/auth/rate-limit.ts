/**
 * Límite de intentos de inicio de sesión en memoria.
 *
 * Capa: lib/auth
 * Suficiente para la demostración de un solo proceso. En producción se usa un
 * almacén distribuido (Redis o el rate limit del proveedor) y se mide por IP y
 * por cuenta.
 */

const attempts = new Map<string, number[]>();

function prune(now: number, windowMs: number): void {
  for (const [key, timestamps] of attempts) {
    const recent = timestamps.filter((timestamp) => now - timestamp < windowMs);
    if (recent.length === 0) attempts.delete(key);
    else attempts.set(key, recent);
  }
}

/**
 * Registra un intento y comprueba si la clave sigue dentro del límite.
 *
 * @param key Identificador del cliente (IP en la demo).
 * @param limit Intentos permitidos por ventana.
 * @param windowMs Duración de la ventana en milisegundos.
 * @returns true si el intento está permitido.
 */
export function checkLoginRateLimit(
  key: string,
  limit = 5,
  windowMs = 60_000,
): boolean {
  const now = Date.now();
  if (attempts.size > 1_000) prune(now, windowMs);

  const timestamps = (attempts.get(key) ?? []).filter(
    (timestamp) => now - timestamp < windowMs,
  );
  if (timestamps.length >= limit) {
    attempts.set(key, timestamps);
    return false;
  }

  timestamps.push(now);
  attempts.set(key, timestamps);
  return true;
}

/**
 * Limpia los intentos de una clave después de un acceso correcto.
 *
 * @param key Identificador del cliente.
 */
export function resetLoginRateLimit(key: string): void {
  attempts.delete(key);
}
