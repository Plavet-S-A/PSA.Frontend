/**
 * Sesión JWT en cookie HttpOnly.
 *
 * Capa: lib/auth
 * El token no se expone al navegador: el servidor lo firma al iniciar sesión y
 * lo valida en cada request. En desarrollo hay un secreto de respaldo; en
 * producción la variable PSA_SESSION_SECRET es obligatoria.
 */

import { signJwt, verifyJwt } from '@/lib/auth/jwt';
import type { SessionPayload, SessionUser } from '@/types/auth';

/** Nombre de la cookie de sesión. */
export const SESSION_COOKIE = 'psa_session';
/** Vigencia de la sesión: 8 horas. */
export const SESSION_TTL_SECONDS = 60 * 60 * 8;

const DEV_SECRET = 'psa-dev-session-secret-only-for-local-development';
const MIN_SECRET_LENGTH = 32;

/**
 * Obtiene el secreto de firma según el entorno.
 *
 * @returns Secreto configurado o el respaldo de desarrollo.
 * @throws Error si producción no configuró un secreto suficientemente largo.
 */
export function getSessionSecret(): string {
  // `import.meta.env` se resuelve al compilar; el adaptador de Node expone los
  // secretos de ejecución en `process.env`.
  const configured = process.env.PSA_SESSION_SECRET ?? import.meta.env.PSA_SESSION_SECRET;
  if (configured) {
    if (configured.length < MIN_SECRET_LENGTH) {
      throw new Error(`PSA_SESSION_SECRET debe tener al menos ${MIN_SECRET_LENGTH} caracteres.`);
    }
    return configured;
  }
  if (import.meta.env.PROD) {
    throw new Error('PSA_SESSION_SECRET es obligatorio en producción.');
  }
  return DEV_SECRET;
}

/**
 * Firma el token de sesión de un usuario.
 *
 * @param user Usuario autenticado.
 * @returns JWT listo para la cookie.
 */
export async function createSessionToken(user: SessionUser): Promise<string> {
  return signJwt(user, getSessionSecret(), SESSION_TTL_SECONDS);
}

/**
 * Lee y valida el token de la cookie.
 *
 * @param token Valor de la cookie o undefined.
 * @returns Usuario de sesión o null si el token no es válido.
 */
export async function readSession(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  const payload: SessionPayload | null = await verifyJwt(token, getSessionSecret());
  if (!payload) return null;
  return {
    id: payload.id,
    name: payload.name,
    email: payload.email,
    role: payload.role,
    ...(payload.studentId ? { studentId: payload.studentId } : {}),
  };
}

/**
 * Opciones de la cookie de sesión.
 *
 * @returns Atributos HttpOnly, SameSite y Secure según el entorno.
 */
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: import.meta.env.PROD,
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  };
}
