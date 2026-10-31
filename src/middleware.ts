/**
 * Middleware — sesión y cabeceras de seguridad.
 *
 * Capa: servidor
 * Lee la cookie HttpOnly, expone el usuario en locals, protege las rutas
 * privadas y agrega cabeceras seguras a cada respuesta.
 */

import { defineMiddleware } from 'astro:middleware';

import { SESSION_COOKIE, readSession } from '@/lib/auth/session';
import { NAV_SECTIONS, PANEL_PATH, permissionForPath } from '@/lib/ui/navigation';
import { hasPermission } from '@/lib/ui/permissions';

const PROTECTED_PREFIXES = NAV_SECTIONS.flatMap((section) =>
  section.items.map((item) => item.href),
);

const PRIVATE_PREFIXES = [...PROTECTED_PREFIXES, '/api/auth'] as const;

/** Indica si la ruta requiere sesión. */
function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Indica si la respuesta no debe almacenarse en cachés. */
function isPrivate(pathname: string): boolean {
  return PRIVATE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Aplica cabeceras de endurecimiento del navegador. */
function applySecurityHeaders(response: Response, pathname: string): Response {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');

  if (isPrivate(pathname)) {
    response.headers.set('Cache-Control', 'no-store');
  }

  if (import.meta.env.PROD) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return response;
}

export const onRequest = defineMiddleware(async (context, next) => {
  // Las páginas prerenderizadas no tienen headers ni cookies en tiempo de build.
  const user = context.isPrerendered
    ? null
    : await readSession(context.cookies.get(SESSION_COOKIE)?.value);
  context.locals.user = user;

  if (!user && isProtected(context.url.pathname)) {
    const target = `${context.url.pathname}${context.url.search}`;
    const redirect = context.redirect(
      `/iniciar-sesion?next=${encodeURIComponent(target)}`,
    );
    return applySecurityHeaders(redirect, context.url.pathname);
  }

  if (user && isProtected(context.url.pathname)) {
    const permission = permissionForPath(context.url.pathname);
    if (permission && !hasPermission(user.role, permission)) {
      const redirect = context.redirect(PANEL_PATH);
      return applySecurityHeaders(redirect, context.url.pathname);
    }
  }

  const response = await next();
  return applySecurityHeaders(response, context.url.pathname);
});
