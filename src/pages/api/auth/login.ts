/**
 * POST /api/auth/login — valida credenciales y emite la cookie de sesión.
 *
 * Capa: servidor
 * Aplica límite de intentos, compara PBKDF2 y nunca devuelve el token en el
 * cuerpo. La cookie es HttpOnly, SameSite=Lax y Secure en producción.
 */

import type { APIRoute } from 'astro';

import { findDemoUser, toSessionUser } from '@/lib/auth/demo-users';
import { DUMMY_PASSWORD_HASH, verifyPassword } from '@/lib/auth/password';
import { checkLoginRateLimit, resetLoginRateLimit } from '@/lib/auth/rate-limit';
import {
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
} from '@/lib/auth/session';
import { isValidCredential } from '@/lib/validation/credential';
import type { LoginPayload } from '@/types/auth';

export const prerender = false;

const JSON_HEADERS = { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' };
const MAX_PASSWORD_LENGTH = 200;

/** Valida el cuerpo sin confiar en el tipo declarado por el cliente. */
function isLoginPayload(value: unknown): value is LoginPayload {
  if (typeof value !== 'object' || value === null) return false;
  const payload = value as Record<string, unknown>;
  return typeof payload.credential === 'string' && typeof payload.password === 'string';
}

/** Respuesta JSON uniforme del endpoint. */
function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  if (!checkLoginRateLimit(clientAddress)) {
    return json({ message: 'Demasiados intentos. Espera un minuto.' }, 429);
  }

  const payload: unknown = await request.json().catch(() => null);
  if (!isLoginPayload(payload)) {
    return json({ message: 'Solicitud inválida.' }, 400);
  }

  const credential = payload.credential.trim();
  if (
    !isValidCredential(credential) ||
    payload.password.length === 0 ||
    payload.password.length > MAX_PASSWORD_LENGTH
  ) {
    return json({ message: 'Solicitud inválida.' }, 400);
  }

  const user = findDemoUser(credential);
  const isValid = await verifyPassword(
    payload.password,
    user?.passwordHash ?? DUMMY_PASSWORD_HASH,
  );

  if (!user || !isValid) {
    return json({ message: 'La credencial o la contraseña no son correctas.' }, 401);
  }

  resetLoginRateLimit(clientAddress);
  const sessionUser = toSessionUser(user);
  const token = await createSessionToken(sessionUser);
  cookies.set(SESSION_COOKIE, token, sessionCookieOptions());

  return json({ user: sessionUser }, 200);
};
