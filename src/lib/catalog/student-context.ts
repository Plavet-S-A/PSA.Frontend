/**
 * Contexto personal del estudiante autenticado.
 *
 * Capa: lib/catalog
 * Reúne en un solo lugar la pasantía, el tutor empresarial, las evaluaciones,
 * los documentos y las excusas de una persona. Las páginas del rol estudiante
 * usan este módulo para no repetir búsquedas ni exponer datos de otros.
 */

import { documentacionRows } from '@/lib/catalog/documentacion-rows';
import { estudiantesRows } from '@/lib/catalog/estudiantes-rows';
import { evaluacionRows } from '@/lib/catalog/evaluacion-rows';
import { excusasRows } from '@/lib/catalog/excusas-rows';
import { procesoPasantiaRows } from '@/lib/catalog/proceso-pasantia-rows';
import { tutoresEmpresarialesRows } from '@/lib/catalog/tutores-empresariales-rows';
import { ESTUDIANTE_NOMBRES, TALLER_NOMBRES } from '@/lib/catalog/options';
import type { ResourceRow } from '@/types/resource';

/** Datos personales y de práctica de un estudiante. */
export interface StudentProfile {
  /** Identificador de la sesión, cuando existe. */
  studentId?: string;
  /** Llave numérica que usan los módulos operativos. */
  idEstudiante: number;
  /** Llave numérica del taller. */
  idTaller: number;
  /** Nombre completo que coincide con los módulos operativos. */
  nombre: string;
  /** Taller al que pertenece. */
  taller: string;
  /** Ficha académica. */
  estudiante?: ResourceRow;
  /** Pasantía asignada, si ya inició el proceso. */
  pasantia?: ResourceRow;
  /** Tutor empresarial del taller. */
  tutorEmpresarial?: ResourceRow;
  /** Evaluación más reciente. */
  evaluacion?: ResourceRow;
  /** Documentos del expediente propio. */
  documentos: ResourceRow[];
  /** Excusas enviadas por la persona. */
  excusas: ResourceRow[];
}

/**
 * Localiza la ficha del estudiante por identificador y, si falta, por nombre.
 *
 * @param studentId Identificador de la sesión.
 * @param name Nombre completo de la sesión.
 * @returns Fila del estudiante o undefined.
 */
function findStudent(studentId: string | undefined, name: string): ResourceRow | undefined {
  const byId = studentId
    ? estudiantesRows.find((row) => row.id === studentId)
    : undefined;
  return byId ?? estudiantesRows.find((row) => row.nombreCompleto === name);
}

/**
 * Construye el contexto personal del estudiante autenticado.
 *
 * @param studentId Identificador de la sesión.
 * @param name Nombre completo de la sesión.
 * @returns Datos de práctica, relaciones y expediente propio.
 */
export function studentProfile(
  studentId: string | undefined,
  name: string,
): StudentProfile {
  const estudiante = findStudent(studentId, name);
  const nombre = String(estudiante?.nombreCompleto ?? name);
  const pasantia = procesoPasantiaRows.find((row) => String(row.estudiante) === nombre);
  const taller = String(estudiante?.taller ?? pasantia?.taller ?? '');
  const tutorEmpresarial =
    tutoresEmpresarialesRows.find(
      (row) => String(row.taller) === taller && String(row.estado) === 'Activo',
    ) ?? tutoresEmpresarialesRows.find((row) => String(row.taller) === taller);
  const evaluacion = evaluacionRows.find((row) => String(row.estudiante) === nombre);

  const idEstudiante = ESTUDIANTE_NOMBRES.indexOf(
    nombre as (typeof ESTUDIANTE_NOMBRES)[number],
  ) + 1;
  const idTaller = TALLER_NOMBRES.indexOf(
    taller as (typeof TALLER_NOMBRES)[number],
  ) + 1;

  return {
    ...(estudiante ? { studentId: String(estudiante.id) } : {}),
    idEstudiante: idEstudiante > 0 ? idEstudiante : 0,
    idTaller: idTaller > 0 ? idTaller : 0,
    nombre,
    taller,
    ...(estudiante ? { estudiante } : {}),
    ...(pasantia ? { pasantia } : {}),
    ...(tutorEmpresarial ? { tutorEmpresarial } : {}),
    ...(evaluacion ? { evaluacion } : {}),
    documentos: documentsOf(nombre),
    excusas: excusesOf(nombre),
  };
}

/**
 * Documentos propios del estudiante.
 *
 * @param nombre Nombre completo.
 * @returns Filas de documentación del estudiante.
 */
export function documentsOf(nombre: string): ResourceRow[] {
  return documentacionRows.filter((row) => String(row.estudiante) === nombre);
}

/**
 * Excusas enviadas por el estudiante.
 *
 * @param nombre Nombre completo.
 * @returns Filas de excusas propias.
 */
export function excusesOf(nombre: string): ResourceRow[] {
  return excusasRows.filter((row) => String(row.estudiante) === nombre);
}
