/**
 * Permisos de navegación y capacidades por rol.
 *
 * Capa: lib/ui
 * Es la fuente única para filtrar el sidebar, proteger rutas en el middleware
 * y decidir qué acciones se muestran. Ocultar UI no autoriza: el servidor debe
 * revalidar cuando exista la API real.
 */

import type { SessionRole } from '@/types/auth';

/** Áreas de la aplicación que se pueden permitir por rol. */
export type Permission =
  | 'panel'
  | 'academic'
  | 'companies'
  | 'plazas'
  | 'staff'
  | 'documents'
  | 'evaluations'
  | 'process'
  | 'reports'
  | 'student';

/** Permisos de navegación asignados a cada rol. */
const ROLE_PERMISSIONS: Record<SessionRole, readonly Permission[]> = {
  coordinador: [
    'panel',
    'academic',
    'companies',
    'plazas',
    'staff',
    'documents',
    'evaluations',
    'process',
    'reports',
  ],
  vinculador: [
    'panel',
    'academic',
    'companies',
    'plazas',
    'documents',
    'process',
    'reports',
  ],
  tutor: ['panel', 'academic', 'documents', 'evaluations', 'process', 'reports'],
  // Tutoría empresarial califica, consulta documentos de sus plazas y solicita
  // plazas nuevas; no administra el proceso, el cierre ni los reportes.
  'tutor-empresarial': ['panel', 'plazas', 'documents', 'evaluations'],
  supervisor: [
    'panel',
    'companies',
    'plazas',
    'documents',
    'evaluations',
    'process',
    'reports',
  ],
  estudiante: ['panel', 'student'],
};

/** Acciones que la interfaz habilita para cada rol. */
export interface RoleCapabilities {
  /** Crea, edita y elimina catálogos académicos y de empresas. */
  canManageCatalogs: boolean;
  /** Envía solicitudes de plazas para revisión de vinculación. */
  canRequestPlaza: boolean;
  /** Edita y elimina documentos de cualquier estudiante; la carga corresponde al estudiante. */
  canManageDocuments: boolean;
  /** Aprueba o rechaza documentos entregados. */
  canReviewDocuments: boolean;
  /** Captura y actualiza calificaciones. */
  canGrade: boolean;
  /** Crea y edita procesos de pasantía. */
  canManageProcess: boolean;
  /** Sube documentos a su propio expediente. */
  canSubmitDocuments: boolean;
  /** Envía excusas para revisión de un tutor. */
  canRequestExcuses: boolean;
  /** Aprueba o rechaza las excusas; el alcance depende del rol. */
  canReviewExcuses: boolean;
}

const ROLE_CAPABILITIES: Record<SessionRole, RoleCapabilities> = {
  coordinador: {
    canManageCatalogs: true,
    canRequestPlaza: false,
    canManageDocuments: true,
    canReviewDocuments: true,
    canGrade: true,
    canManageProcess: true,
    canSubmitDocuments: false,
    canRequestExcuses: false,
    canReviewExcuses: true,
  },
  vinculador: {
    canManageCatalogs: true,
    canRequestPlaza: false,
    canManageDocuments: true,
    canReviewDocuments: true,
    canGrade: false,
    canManageProcess: true,
    canSubmitDocuments: false,
    canRequestExcuses: false,
    canReviewExcuses: true,
  },
  tutor: {
    canManageCatalogs: false,
    canRequestPlaza: false,
    canManageDocuments: false,
    canReviewDocuments: true,
    canGrade: true,
    canManageProcess: false,
    canSubmitDocuments: false,
    canRequestExcuses: false,
    canReviewExcuses: true,
  },
  'tutor-empresarial': {
    canManageCatalogs: false,
    canRequestPlaza: true,
    canManageDocuments: false,
    canReviewDocuments: false,
    canGrade: true,
    canManageProcess: false,
    canSubmitDocuments: false,
    canRequestExcuses: false,
    canReviewExcuses: true,
  },
  supervisor: {
    canManageCatalogs: false,
    canRequestPlaza: false,
    canManageDocuments: false,
    canReviewDocuments: false,
    canGrade: false,
    canManageProcess: false,
    canSubmitDocuments: false,
    canRequestExcuses: false,
    canReviewExcuses: false,
  },
  estudiante: {
    canManageCatalogs: false,
    canRequestPlaza: false,
    canManageDocuments: false,
    canReviewDocuments: false,
    canGrade: false,
    canManageProcess: false,
    canSubmitDocuments: true,
    canRequestExcuses: true,
    canReviewExcuses: false,
  },
};

/**
 * Indica si el rol puede ver un área.
 *
 * @param role Rol de la sesión.
 * @param permission Área solicitada.
 * @returns true si el rol tiene el permiso.
 */
export function hasPermission(role: SessionRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Devuelve las acciones habilitadas para el rol.
 *
 * @param role Rol de la sesión.
 * @returns Capacidades de edición de la interfaz.
 */
export function capabilitiesFor(role: SessionRole): RoleCapabilities {
  return ROLE_CAPABILITIES[role];
}

/**
 * Talleres asignados a cada rol. `null` significa acceso a todos.
 *
 * La demostración replica el alcance real del tutor: consulta únicamente los
 * documentos y estudiantes del taller que imparte (Ricardo Salinas, tut-001,
 * «Taller de empleabilidad»). El tutor empresarial ve los talleres de su
 * empresa. En producción esta asignación vendrá de la API de la práctica.
 */
const ROLE_TALLER_SCOPE: Record<SessionRole, readonly string[] | null> = {
  coordinador: null,
  vinculador: null,
  tutor: ['Taller de empleabilidad'],
  'tutor-empresarial': [
    'Herramientas de productividad',
    'Seguridad y ética profesional',
  ],
  supervisor: null,
  estudiante: null,
};

/**
 * Talleres asignados a una cuenta concreta de la demostración.
 *
 * `ROLE_TALLER_SCOPE` define el alcance por rol, pero una persona puede tener
 * menos plazas que las de su rol. La cuenta de prueba `usr-011` (Patricia
 * Solís, tutora empresarial de Tecnologías del Bajío) queda acotada a un solo
 * taller, que en el catálogo tiene una única plaza (pla-001). En producción
 * esta relación vendrá de la asignación plaza ↔ tutor de la API.
 */
const USER_TALLER_SCOPE: Readonly<Record<string, readonly string[]>> = {
  'usr-011': ['Herramientas de productividad'],
};

/**
 * Filtra los talleres que puede consultar una sesión.
 *
 * @param role Rol de la sesión.
 * @param talleres Catálogo completo de talleres.
 * @param userId Identificador de la cuenta; permite un alcance más estrecho.
 * @returns Talleres permitidos, conservando el orden original.
 */
export function visibleTalleres(
  role: SessionRole,
  talleres: readonly string[],
  userId?: string,
): readonly string[] {
  const scope = (userId ? USER_TALLER_SCOPE[userId] : undefined) ?? ROLE_TALLER_SCOPE[role];
  if (!scope) return [...talleres];
  return talleres.filter((taller) => scope.includes(taller));
}
