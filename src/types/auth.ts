/**
 * Contratos de autenticación y sesión.
 *
 * Capa: types
 * Sin runtime: solo tipos compartidos entre servidor y cliente.
 */

/** Roles disponibles en la sesión de demostración. */
export type SessionRole =
  | 'coordinador'
  | 'vinculador'
  | 'tutor'
  | 'tutor-empresarial'
  | 'supervisor'
  | 'estudiante';

/** Usuario autenticado que viaja en la sesión y en Astro.locals. */
export interface SessionUser {
  /** Identificador estable del usuario. */
  id: string;
  /** Nombre completo para la interfaz. */
  name: string;
  /** Correo institucional. */
  email: string;
  /** Rol que determina el microcopy y, en producción, los permisos. */
  role: SessionRole;
  /** Identificador del estudiante cuando la sesión es de ese rol. */
  studentId?: string;
}

/** Payload firmado dentro del JWT. */
export interface SessionPayload extends SessionUser {
  /** Emitido en (segundos Unix). */
  iat: number;
  /** Expira en (segundos Unix). */
  exp: number;
}

/** Cuerpo aceptado por el endpoint de inicio de sesión. */
export interface LoginPayload {
  /** Credencial numérica asignada a la persona. */
  credential: string;
  password: string;
}
