/**
 * Usuarios de demostración del inicio de sesión.
 *
 * Capa: lib/auth
 * Solo se importa desde middleware y endpoints del servidor, por lo que sus
 * hashes no llegan al bundle del navegador. En producción esta lista se
 * reemplaza por la API de identidad.
 */

import type { SessionRole, SessionUser } from '@/types/auth';

/** Contraseña compartida por las cuentas de demostración. */
export const DEMO_PASSWORD = 'Psa2026!';

export interface DemoUser extends SessionUser {
  /** Credencial numérica con la que se inicia sesión. */
  credential: string;
  /** Hash PBKDF2 de la contraseña de demostración. */
  passwordHash: string;
}

const DEMO_USERS: readonly DemoUser[] = [
  {
    id: 'usr-001',
    name: 'Ana Lucía Herrera',
    credential: '20260001',
    email: 'coordinador@psa.mx',
    role: 'coordinador',
    passwordHash:
      'pbkdf2$600000$cZsZGOSVpfUBmpxwItvrEg==$407hwLNpaGxJYdgjCSAXH42k0JAVdljN77h9oFXDsNg=',
  },
  {
    id: 'usr-002',
    name: 'Ricardo Salinas',
    credential: '20260002',
    email: 'tutor@psa.mx',
    role: 'tutor',
    passwordHash:
      'pbkdf2$600000$3D9PowYI1DW5WSW/nUus8w==$O3pehGxf8KT1xcGSMEso3ZujUxKyTIcEjj9Qblontdc=',
  },
  {
    id: 'usr-003',
    name: 'Mariana Cortés',
    credential: '20260003',
    email: 'supervisor@psa.mx',
    role: 'supervisor',
    passwordHash:
      'pbkdf2$600000$6YVXhs0nvsenFecvnOwtSQ==$JIgLrEW+5r0gfKtXwIpOKuDxXsUFymcYe88eWXo6oD0=',
  },
  {
    id: 'usr-004',
    name: 'Laura Medina',
    credential: '20260004',
    email: 'vinculador@psa.mx',
    role: 'vinculador',
    passwordHash:
      'pbkdf2$600000$QzsgfqgexCkkL2TYKPIRzQ==$tv3RoC3oOebte4FySMuY0ROiCnEn45WAcT2ZlanmqM0=',
  },
  {
    id: 'usr-005',
    name: 'Luis Enrique Pacheco',
    credential: '20260005',
    email: 'tutor.empresarial@psa.mx',
    role: 'tutor-empresarial',
    passwordHash:
      'pbkdf2$600000$JCoZmjCBQ3BB5mvgbARrUA==$9hGhJm9PuAkyrxqqqpTlSfVQGwoFA/CFmpj1g0IWhzY=',
  },
  {
    id: 'usr-010',
    name: 'Camila Ortega Salas',
    credential: '20260010',
    email: 'camila.ortega@universidad.mx',
    role: 'estudiante',
    studentId: 'est-009',
    passwordHash:
      'pbkdf2$600000$iX6p15ICxRwC8scisfp7bg==$l1JrZRP6nx41FrTY1Pnlrq9WCRSBgxsd6C/cO0/MHcU=',
  },
  {
    // Tutora empresarial de una sola plaza (pla-001, Tecnologías del Bajío).
    // Sirve para probar el flujo de solicitud sin depender de otros talleres.
    id: 'usr-011',
    name: 'Patricia Solís Márquez',
    credential: '20260011',
    email: 'patricia.solis@tecnologiasbajio.mx',
    role: 'tutor-empresarial',
    passwordHash:
      'pbkdf2$600000$smHUqK6bA7fhasmzpgmW8w==$hggZZ6hw/9pHtz7ZXVDvow/hXJjdgb4Sclmy/wTKUYQ=',
  },
];

/**
 * Busca una cuenta de demostración por credencial.
 *
 * @param credential Número escrito en el formulario.
 * @returns La cuenta o undefined si no existe.
 */
export function findDemoUser(credential: string): DemoUser | undefined {
  const normalized = credential.trim();
  return DEMO_USERS.find((user) => user.credential === normalized);
}

/**
 * Convierte una cuenta de demostración en usuario de sesión.
 *
 * @param user Cuenta autenticada.
 * @returns Datos públicos que se guardan en el JWT.
 */
export function toSessionUser(user: DemoUser): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    ...(user.studentId ? { studentId: user.studentId } : {}),
  };
}

/** Roles cubiertos por la demostración, útil para documentación y pruebas. */
export const DEMO_ROLES: readonly SessionRole[] = [
  'coordinador',
  'vinculador',
  'tutor',
  'tutor-empresarial',
  'supervisor',
  'estudiante',
];
