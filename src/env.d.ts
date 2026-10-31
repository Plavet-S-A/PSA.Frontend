/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** Secreto usado para firmar la sesión JWT. Obligatorio en producción. */
  readonly PSA_SESSION_SECRET?: string;
}

declare namespace App {
  interface Locals {
    /** Usuario autenticado o null cuando no hay sesión válida. */
    user: import('@/types/auth').SessionUser | null;
  }
}
