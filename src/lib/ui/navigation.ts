/**
 * Navegación principal y rutas compartidas del shell.
 *
 * Capa: lib/ui
 * La estructura vive en un solo lugar para que sidebar, middleware, breadcrumb
 * y panel no se desincronicen. Cada sección declara el permiso que la protege.
 */

import type { IconName } from '@/lib/ui/icons';
import { hasPermission, type Permission } from '@/lib/ui/permissions';
import type { SessionRole } from '@/types/auth';

/** Ruta pública de inicio de sesión. */
export const LOGIN_PATH = '/iniciar-sesion';
/** Ruta inicial después de autenticarse. */
export const PANEL_PATH = '/panel';
/** Endpoint que invalida la sesión. */
export const LOGOUT_PATH = '/api/auth/logout';

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  /** Permiso propio cuando el módulo no comparte el alcance de su sección. */
  permission?: Permission;
}

export interface NavSection {
  /** Clave estable para el acordeón y su preferencia local. */
  id: string;
  label: string;
  permission: Permission;
  items: readonly NavItem[];
}

/** Secciones y items del sidebar, en orden de uso. */
export const NAV_SECTIONS: readonly NavSection[] = [
  {
    id: 'mi-pasantia',
    label: 'Mi pasantía',
    permission: 'student',
    items: [
      { href: '/mi-pasantia', label: 'Resumen de pasantía', icon: 'route' },
      { href: '/mis-documentos', label: 'Mis documentos', icon: 'file' },
      { href: '/mis-calificaciones', label: 'Mis calificaciones', icon: 'chart' },
      { href: '/mis-excusas', label: 'Mis excusas', icon: 'clipboard' },
    ],
  },
  {
    id: 'gestion-academica',
    label: 'Gestión académica',
    permission: 'academic',
    items: [
      { href: '/estudiantes', label: 'Estudiantes', icon: 'graduation' },
      { href: '/talleres', label: 'Talleres', icon: 'book' },
      { href: '/tutores', label: 'Tutores académicos', icon: 'user-check' },
    ],
  },
  {
    id: 'gestion-empresas',
    label: 'Gestión de empresas',
    permission: 'companies',
    items: [
      { href: '/centros-trabajo', label: 'Centros de trabajo', icon: 'building' },
      { href: '/tutores-empresariales', label: 'Tutores empresariales', icon: 'briefcase' },
    ],
  },
  {
    // Módulo propio para que tutoría empresarial solicite plazas sin recibir
    // el resto de la gestión de empresas.
    id: 'plazas',
    label: 'Plazas',
    permission: 'plazas',
    items: [{ href: '/plazas', label: 'Plazas', icon: 'layers' }],
  },
  {
    id: 'roles-y-personal',
    label: 'Roles y personal',
    permission: 'staff',
    items: [
      { href: '/vinculadores', label: 'Vinculadores', icon: 'link' },
      { href: '/supervisores', label: 'Supervisores', icon: 'id-card' },
      { href: '/usuarios', label: 'Usuarios', icon: 'users' },
    ],
  },
  {
    id: 'documentacion',
    label: 'Documentación',
    permission: 'documents',
    items: [{ href: '/documentacion', label: 'Documentación', icon: 'file' }],
  },
  {
    id: 'evaluacion',
    label: 'Evaluación',
    permission: 'evaluations',
    items: [{ href: '/evaluacion', label: 'Evaluación', icon: 'chart' }],
  },
  {
    id: 'proceso-de-pasantia',
    label: 'Proceso de pasantía',
    permission: 'process',
    items: [{ href: '/proceso-pasantia', label: 'Proceso de pasantía', icon: 'route' }],
  },
  {
    id: 'reportes',
    label: 'Reportes',
    permission: 'reports',
    items: [{ href: '/reportes', label: 'Reportes', icon: 'chart' }],
  },
  {
    id: 'seguimiento',
    label: 'Seguimiento',
    permission: 'documents',
    items: [
      { href: '/excusas', label: 'Excusas de pasantía', icon: 'file' },
      {
        href: '/cierre-pasantia',
        label: 'Cierre de pasantía',
        icon: 'book',
        permission: 'process',
      },
    ],
  },
];

/** Máximo de secciones abiertas a la vez en el acordeón del sidebar. */
export const MAX_OPEN_SECTIONS = 3;

/**
 * Secciones que cada rol ve abiertas al entrar por primera vez.
 *
 * El orden importa: define la prioridad de contexto de cada rol y evita que
 * todos reciban el mismo menú genérico. El usuario puede cambiarlo y la
 * preferencia se conserva en el navegador.
 */
const DEFAULT_OPEN_SECTIONS: Record<SessionRole, readonly string[]> = {
  coordinador: ['gestion-academica', 'gestion-empresas', 'roles-y-personal'],
  vinculador: ['gestion-academica', 'gestion-empresas', 'documentacion'],
  tutor: ['gestion-academica', 'documentacion', 'evaluacion'],
  'tutor-empresarial': ['plazas', 'documentacion', 'evaluacion'],
  supervisor: ['gestion-empresas', 'documentacion', 'evaluacion'],
  estudiante: ['mi-pasantia'],
};

/**
 * Secciones abiertas por defecto para un rol.
 *
 * @param role Rol de la sesión.
 * @returns Claves de sección en orden de prioridad.
 */
export function defaultOpenSections(role: SessionRole): readonly string[] {
  return DEFAULT_OPEN_SECTIONS[role];
}

/**
 * Indica si una ruta corresponde al item de navegación.
 *
 * @param currentPath Ruta actual, sin query string.
 * @param href Ruta del item.
 * @returns true para la ruta exacta o sus rutas hijas.
 */
export function isActivePath(currentPath: string, href: string): boolean {
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

/**
 * Filtra las secciones que puede ver un rol.
 *
 * @param role Rol de la sesión.
 * @returns Secciones permitidas, en el mismo orden.
 */
export function visibleSections(role: SessionRole): readonly NavSection[] {
  return NAV_SECTIONS.flatMap((section) => {
    if (!hasPermission(role, section.permission)) return [];
    const items = section.items.filter(
      (item) => !item.permission || hasPermission(role, item.permission),
    );
    return items.length > 0 ? [{ ...section, items }] : [];
  });
}

/**
 * Obtiene el permiso que protege una ruta.
 *
 * @param pathname Ruta solicitada, sin query string.
 * @returns Permiso del item, el de su sección o null si la ruta no es de
 * navegación.
 */
export function permissionForPath(pathname: string): Permission | null {
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (isActivePath(pathname, item.href)) {
        return item.permission ?? section.permission;
      }
    }
  }
  return null;
}
