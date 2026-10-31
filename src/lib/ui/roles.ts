/**
 * Etiquetas legibles de los roles de sesión.
 *
 * Capa: lib/ui
 */

import type { SessionRole } from '@/types/auth';

/** Nombre que se muestra en el shell para cada rol. */
export const ROLE_LABELS: Record<SessionRole, string> = {
  coordinador: 'Coordinación',
  vinculador: 'Vinculador',
  tutor: 'Tutor académico',
  'tutor-empresarial': 'Tutor empresarial',
  supervisor: 'Supervisor institucional',
  estudiante: 'Estudiante',
};
