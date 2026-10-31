/**
 * Asignación de estudiantes a plazas de práctica.
 *
 * Capa: lib/catalog
 * La relación vive fuera de `ResourceRow` porque una plaza puede tener varios
 * estudiantes. El almacenamiento local conserva los cambios de la demostración;
 * las plazas y los estudiantes se resuelven contra el catálogo vigente.
 */

import { estudiantesRows } from '@/lib/catalog/estudiantes-rows';
import { plazasRows } from '@/lib/catalog/plazas-rows';
import { procesoPasantiaRows } from '@/lib/catalog/proceso-pasantia-rows';
import type { ResourceRow } from '@/types/resource';

export { plazasRows } from '@/lib/catalog/plazas-rows';

/** Estudiantes asignados a una plaza. */
export interface PlazaAssignment {
  /** Identificador de la plaza (`plazasRows`). */
  plazaId: string;
  /** Identificadores de los estudiantes asignados. */
  studentIds: string[];
}

/** Clave de la relación en el almacenamiento local de la demostración. */
const STORAGE_KEY = 'psa:data:asignaciones-plaza';

/** Resuelve el nombre completo de un estudiante por su identificador. */
function studentName(row: ResourceRow): string {
  return String(row.nombreCompleto ?? row.nombre ?? '');
}

/**
 * Construye las asignaciones iniciales a partir de las pasantías de ejemplo.
 *
 * @returns Una asignación por cada plaza que ya tiene estudiantes en proceso.
 */
export function defaultPlazaAssignments(): PlazaAssignment[] {
  const byPlaza = new Map<string, string[]>();

  for (const pasantia of procesoPasantiaRows) {
    const plaza = plazasRows.find((row) => row.plaza === pasantia.plaza);
    const estudiante = estudiantesRows.find(
      (row) => studentName(row) === pasantia.estudiante,
    );
    if (!plaza || !estudiante) continue;

    const studentIds = byPlaza.get(plaza.id) ?? [];
    if (!studentIds.includes(estudiante.id)) studentIds.push(estudiante.id);
    byPlaza.set(plaza.id, studentIds);
  }

  return plazasRows
    .filter((row) => byPlaza.has(row.id))
    .map((row) => ({ plazaId: row.id, studentIds: [...(byPlaza.get(row.id) ?? [])] }));
}

/** Indica si un valor tiene la forma de una asignación guardada. */
function isAssignment(value: unknown): value is PlazaAssignment {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.plazaId === 'string' &&
    Array.isArray(record.studentIds) &&
    record.studentIds.every((id) => typeof id === 'string')
  );
}

/**
 * Lee las asignaciones guardadas; si no existen, parte de las iniciales.
 *
 * @returns Asignaciones válidas para el catálogo actual.
 */
export function loadPlazaAssignments(): PlazaAssignment[] {
  if (typeof window === 'undefined') return defaultPlazaAssignments();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPlazaAssignments();

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultPlazaAssignments();

    const plazaIds = new Set(plazasRows.map((row) => row.id));
    const studentIds = new Set(estudiantesRows.map((row) => row.id));
    return parsed.filter(isAssignment).map((assignment) => ({
      plazaId: assignment.plazaId,
      studentIds: assignment.studentIds.filter(
        (id) => plazaIds.has(assignment.plazaId) && studentIds.has(id),
      ),
    }));
  } catch {
    return defaultPlazaAssignments();
  }
}

/**
 * Guarda las asignaciones en el navegador.
 *
 * @param assignments Relación completa de plazas y estudiantes.
 * @returns false si el navegador rechazó la escritura.
 */
export function savePlazaAssignments(
  assignments: readonly PlazaAssignment[],
): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
    return true;
  } catch {
    return false;
  }
}

/**
 * Obtiene los estudiantes asignados a una plaza.
 *
 * @param assignments Relación completa.
 * @param plazaId Plaza consultada.
 * @returns Filas de estudiantes en el orden del catálogo.
 */
export function assignedStudentsForPlaza(
  assignments: readonly PlazaAssignment[],
  plazaId: string,
): ResourceRow[] {
  const assigned = assignments.find((item) => item.plazaId === plazaId);
  if (!assigned) return [];
  const ids = new Set(assigned.studentIds);
  return estudiantesRows.filter((row) => ids.has(row.id));
}

/**
 * Obtiene los identificadores de los estudiantes asignados a una plaza.
 *
 * @param assignments Relación completa.
 * @param plazaId Plaza consultada.
 * @returns Identificadores de los estudiantes asignados.
 */
export function assignedStudentIds(
  assignments: readonly PlazaAssignment[],
  plazaId: string,
): string[] {
  const assigned = assignments.find((item) => item.plazaId === plazaId);
  return assigned ? [...assigned.studentIds] : [];
}

/**
 * Lista los estudiantes candidatos a una plaza, ordenados por nombre.
 *
 * @param plaza Plaza que se quiere cubrir.
 * @returns Estudiantes del mismo taller en orden alfabético.
 */
export function candidateStudentsForPlaza(
  plaza: ResourceRow,
): ResourceRow[] {
  const taller = String(plaza.taller ?? '');
  return estudiantesRows
    .filter((student) => String(student.taller) === taller)
    .sort((left, right) =>
      String(left.nombreCompleto ?? '').localeCompare(
        String(right.nombreCompleto ?? ''),
        'es-MX',
      ),
    );
}

/**
 * Obtiene los nombres de estudiantes asignados a plazas de ciertos talleres.
 *
 * @param assignments Relación completa.
 * @param talleres Talleres visibles para el rol.
 * @returns Nombres completos que documentación y evaluación deben mostrar.
 */
export function assignedStudentNamesForTalleres(
  assignments: readonly PlazaAssignment[],
  talleres: readonly string[],
): string[] {
  const plazaIds = new Set(
    plazasRows
      .filter((row) => talleres.includes(String(row.taller)))
      .map((row) => row.id),
  );
  const studentIds = new Set(
    assignments
      .filter((item) => plazaIds.has(item.plazaId))
      .flatMap((item) => item.studentIds),
  );
  return estudiantesRows
    .filter((row) => studentIds.has(row.id))
    .map((row) => studentName(row));
}

/**
 * Mueve estudiantes a una plaza sin duplicarlos en otra.
 *
 * @param assignments Relación actual.
 * @param plazaId Plaza que recibe la selección.
 * @param studentIds Selección completa de la plaza.
 * @returns Nueva relación con la plaza actualizada.
 */
export function assignStudentsToPlaza(
  assignments: readonly PlazaAssignment[],
  plazaId: string,
  studentIds: readonly string[],
): PlazaAssignment[] {
  const selected = new Set(studentIds);
  const next = assignments.map((assignment) => {
    if (assignment.plazaId === plazaId) {
      return { ...assignment, studentIds: [...selected] };
    }
    return {
      ...assignment,
      studentIds: assignment.studentIds.filter((id) => !selected.has(id)),
    };
  });

  if (!next.some((assignment) => assignment.plazaId === plazaId)) {
    next.push({ plazaId, studentIds: [...selected] });
  }
  return next;
}

/**
 * Obtiene la plaza asignada a un estudiante.
 *
 * @param assignments Relación completa.
 * @param studentId Identificador del estudiante.
 * @returns La plaza (de plazasRows) o undefined si no tiene plaza asignada.
 */
export function plazaForStudent(
  assignments: readonly PlazaAssignment[],
  studentId: string,
): ResourceRow | undefined {
  const assignment = assignments.find((item) =>
    item.studentIds.includes(studentId),
  );
  if (!assignment) return undefined;
  return plazasRows.find((row) => row.id === assignment.plazaId);
}

/**
 * Relaciona a cada estudiante asignado con la plaza que lo recibe.
 *
 * Las filas de documentación y evaluación identifican al estudiante con su
 * nombre completo, mientras que la relación de asignaciones usa el
 * identificador del catálogo. Este mapa traduce entre ambos para que el
 * agrupamiento por plaza no dependa del formato del identificador.
 *
 * @param assignments Relación completa.
 * @param talleres Talleres visibles para el rol.
 * @returns Mapa nombre completo del estudiante -> identificador de plaza.
 */
export function assignedPlazaIdByStudentName(
  assignments: readonly PlazaAssignment[],
  talleres: readonly string[],
): Map<string, string> {
  const plazaIds = new Set(
    plazasRows
      .filter((row) => talleres.includes(String(row.taller)))
      .map((row) => row.id),
  );
  const plazaByStudentId = new Map<string, string>();
  for (const assignment of assignments) {
    if (!plazaIds.has(assignment.plazaId)) continue;
    for (const studentId of assignment.studentIds) {
      plazaByStudentId.set(studentId, assignment.plazaId);
    }
  }

  const result = new Map<string, string>();
  for (const row of estudiantesRows) {
    const plazaId = plazaByStudentId.get(row.id);
    if (plazaId) result.set(studentName(row), plazaId);
  }
  return result;
}

/**
 * Obtiene las plazas que tienen estudiantes asignados en ciertos talleres.
 *
 * @param assignments Relación completa.
 * @param talleres Talleres visibles para el rol.
 * @returns Plazas con al menos un estudiante asignado.
 */
export function plazasWithAssignmentsForTalleres(
  assignments: readonly PlazaAssignment[],
  talleres: readonly string[],
): ResourceRow[] {
  const plazaIds = new Set(
    plazasRows
      .filter((row) => talleres.includes(String(row.taller)))
      .map((row) => row.id),
  );
  const assignedPlazaIds = new Set(
    assignments
      .filter((item) => plazaIds.has(item.plazaId) && item.studentIds.length > 0)
      .map((item) => item.plazaId),
  );
  return plazasRows.filter((row) => assignedPlazaIds.has(row.id));
}

/**
 * Obtiene los nombres de estudiantes asignados a una plaza específica.
 *
 * @param assignments Relación completa.
 * @param plazaId Plaza consultada.
 * @returns Nombres completos de los estudiantes.
 */
export function assignedStudentNamesForPlaza(
  assignments: readonly PlazaAssignment[],
  plazaId: string,
): string[] {
  const assigned = assignments.find((item) => item.plazaId === plazaId);
  if (!assigned) return [];
  return assigned.studentIds
    .map((id) => estudiantesRows.find((row) => row.id === id))
    .filter((row): row is ResourceRow => row !== undefined)
    .map((row) => studentName(row));
}
