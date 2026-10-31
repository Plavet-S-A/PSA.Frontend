/**
 * Firma y verificación de JWT HS256 con Web Crypto.
 *
 * Capa: lib/auth
 * No depende de Astro, Solid ni Node: funciona en cualquier runtime con
 * `crypto.subtle`. El token solo viaja en una cookie HttpOnly.
 */

import type { SessionPayload, SessionRole } from '@/types/auth';

const encoder = new TextEncoder();
const ROLES: readonly SessionRole[] = [
  'coordinador',
  'vinculador',
  'tutor',
  'tutor-empresarial',
  'supervisor',
  'estudiante',
];
const HEADER = { alg: 'HS256', typ: 'JWT' } as const;

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function createKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

function isSessionRole(value: unknown): value is SessionRole {
  return typeof value === 'string' && ROLES.includes(value as SessionRole);
}

function isSessionPayload(value: unknown): value is SessionPayload {
  if (typeof value !== 'object' || value === null) return false;
  const payload = value as Record<string, unknown>;
  return (
    typeof payload.id === 'string' &&
    typeof payload.name === 'string' &&
    typeof payload.email === 'string' &&
    isSessionRole(payload.role) &&
    (payload.studentId === undefined || typeof payload.studentId === 'string') &&
    typeof payload.iat === 'number' &&
    typeof payload.exp === 'number'
  );
}

/**
 * Firma un JWT con los datos de la sesión.
 *
 * @param user Datos del usuario autenticado.
 * @param secret Clave HMAC de al menos 32 caracteres.
 * @param ttlSeconds Vigencia del token en segundos.
 * @returns Token compacto `header.payload.signature`.
 */
export async function signJwt(
  user: Omit<SessionPayload, 'iat' | 'exp'>,
  secret: string,
  ttlSeconds: number,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = { ...user, iat: now, exp: now + ttlSeconds };
  const header = encodeBase64Url(encoder.encode(JSON.stringify(HEADER)));
  const body = encodeBase64Url(encoder.encode(JSON.stringify(payload)));
  const input = `${header}.${body}`;
  const key = await createKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(input));
  return `${input}.${encodeBase64Url(new Uint8Array(signature))}`;
}

/**
 * Verifica la firma y la vigencia de un JWT.
 *
 * @param token Token compacto recibido desde la cookie.
 * @param secret Clave HMAC usada al firmar.
 * @returns Payload válido o null si el token está alterado, vencido o mal formado.
 */
export async function verifyJwt(
  token: string,
  secret: string,
): Promise<SessionPayload | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;
  if (!header || !body || !signature) return null;

  try {
    const decodedHeader: unknown = JSON.parse(new TextDecoder().decode(decodeBase64Url(header)));
    if (
      typeof decodedHeader !== 'object' ||
      decodedHeader === null ||
      (decodedHeader as Record<string, unknown>).alg !== 'HS256'
    ) {
      return null;
    }

    const key = await createKey(secret);
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      decodeBase64Url(signature),
      encoder.encode(`${header}.${body}`),
    );
    if (!isValid) return null;

    const payload: unknown = JSON.parse(new TextDecoder().decode(decodeBase64Url(body)));
    if (!isSessionPayload(payload)) return null;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
