/**
 * POST /api/auth/logout — invalida la cookie de sesión.
 *
 * Capa: servidor
 * Solo acepta POST para evitar cierres de sesión por navegación cruzada.
 */

import type { APIRoute } from 'astro';

import { SESSION_COOKIE } from '@/lib/auth/session';

export const prerender = false;

export const POST: APIRoute = ({ cookies, redirect }) => {
  cookies.delete(SESSION_COOKIE, { path: '/' });
  return redirect('/iniciar-sesion', 303);
};
