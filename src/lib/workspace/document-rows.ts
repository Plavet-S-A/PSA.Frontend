/**
 * Filas y grupos de documentos por taller o plaza.
 *
 * Capa: lib/workspace
 * Lógica pura del alcance documental: no depende de Astro ni de Solid, así que
 * la comparten la vista del espacio de trabajo y sus pruebas.
 */
import { applyResourceValues } from '@/lib/resource/row-values';
import { createResourceId } from '@/lib/storage/resource-store';
import type { ResourceConfig, ResourceRow } from '@/types/resource';

/** Resumen de un grupo de alcance: plaza o taller. */
export interface ScopeGroupSummary {
  /** Nombre legible del grupo. */
  nombre: string;
  /** Clave estable del grupo. */
  key: string;
  /** Estudiantes con al menos un documento. */
  estudiantes: number;
  /** Documentos registrados en el grupo. */
  documentos: number;
  /** Documentos que aún no están validados. */
  pendientes: number;
}

/** Estudiante del grupo con el conteo de sus documentos. */
export interface ScopeStudentSummary {
  /** Nombre del estudiante. */
  nombre: string;
  /** Documentos registrados del estudiante. */
  documentos: number;
  /** Documentos sin validar del estudiante. */
  pendientes: number;
}

/** Datos que definen cómo se agrupan las filas. */
export interface ScopeGroupOptions {
  /** true cuando el alcance agrupa por plaza en lugar de por taller. */
  byPlaza: boolean;
  /** Plaza asignada por estudiante; vacío cuando agrupa por taller. */
  plazaByStudent: ReadonlyMap<string, string>;
  /** Nombres de plaza por identificador; vacío cuando agrupa por taller. */
  plazaNames: ReadonlyMap<string, string>;
}

/** Datos de una entrega antes de guardarla. */
export interface DocumentDraft {
  /** Valores del formulario. */
  values: Record<string, string>;
  /** Fila en edición; undefined cuando es un alta. */
  current?: ResourceRow;
  /** Estudiante al que pertenece el documento. */
  estudiante: string;
  /** Taller al que pertenece el documento. */
  taller: string;
}

/**
 * Devuelve la clave de agrupación de una fila.
 *
 * @param row Fila del documento.
 * @param options Reglas de agrupación del alcance.
 * @returns Identificador de plaza o nombre de taller.
 */
export function scopeGroupKey(row: ResourceRow, options: ScopeGroupOptions): string {
  if (options.byPlaza) {
    return options.plazaByStudent.get(String(row.estudiante)) ?? String(row.taller);
  }
  return String(row.taller);
}

/**
 * Devuelve el nombre legible de una clave de agrupación.
 *
 * @param key Clave del grupo.
 * @param options Reglas de agrupación del alcance.
 * @returns Nombre de la plaza o del taller.
 */
export function scopeGroupName(key: string, options: ScopeGroupOptions): string {
  if (options.byPlaza) {
    return options.plazaNames.get(key) ?? key;
  }
  return key;
}

/**
 * Resume los grupos visibles del alcance.
 *
 * @param rows Filas visibles del alcance.
 * @param options Reglas de agrupación del alcance.
 * @returns Un resumen por grupo, en el orden de aparición.
 */
export function summarizeScopeGroups(
  rows: readonly ResourceRow[],
  options: ScopeGroupOptions,
): ScopeGroupSummary[] {
  const keys = [...new Set(rows.map((row) => scopeGroupKey(row, options)))];

  return keys.map((key) => {
    const documents = rows.filter((row) => scopeGroupKey(row, options) === key);
    const students = new Set(documents.map((row) => String(row.estudiante)));
    return {
      nombre: scopeGroupName(key, options),
      key,
      estudiantes: students.size,
      documentos: documents.length,
      pendientes: pendingDocuments(documents),
    };
  });
}

/**
 * Lista los estudiantes de un grupo con el conteo de sus documentos.
 *
 * @param rows Filas visibles del alcance.
 * @param key Clave del grupo seleccionado.
 * @param options Reglas de agrupación del alcance.
 * @returns Estudiantes del grupo con sus totales.
 */
export function scopeStudents(
  rows: readonly ResourceRow[],
  key: string,
  options: ScopeGroupOptions,
): ScopeStudentSummary[] {
  const documents = rows.filter((row) => scopeGroupKey(row, options) === key);
  const names = [...new Set(documents.map((row) => String(row.estudiante)))];

  return names.map((nombre) => {
    const own = documents.filter((row) => String(row.estudiante) === nombre);
    return {
      nombre,
      documentos: own.length,
      pendientes: pendingDocuments(own),
    };
  });
}

/**
 * Devuelve los documentos de un estudiante dentro de un grupo.
 *
 * @param rows Filas visibles del alcance.
 * @param key Clave del grupo seleccionado.
 * @param estudiante Estudiante seleccionado.
 * @param options Reglas de agrupación del alcance.
 * @returns Documentos del estudiante en el grupo.
 */
export function documentsOfStudent(
  rows: readonly ResourceRow[],
  key: string,
  estudiante: string,
  options: ScopeGroupOptions,
): ResourceRow[] {
  return rows.filter(
    (row) =>
      scopeGroupKey(row, options) === key && String(row.estudiante) === estudiante,
  );
}

/**
 * Cuenta los documentos que aún no están validados.
 *
 * @param rows Filas a contar.
 * @returns Número de documentos pendientes.
 */
export function pendingDocuments(rows: readonly ResourceRow[]): number {
  return rows.filter((row) => String(row.estado) !== 'Validado').length;
}

/**
 * Compone la fila de un documento a partir del formulario.
 *
 * @param config Catálogo del módulo documental.
 * @param draft Datos de la entrega.
 * @returns Fila lista para guardarse.
 */
export function composeDocumentRow(
  config: ResourceConfig,
  draft: DocumentDraft,
): ResourceRow {
  const base = {
    ...draft.values,
    estudiante: draft.estudiante,
    taller: draft.taller,
  };
  const composed = applyResourceValues(config, base, draft.current);
  return draft.current ? composed : { ...composed, id: createResourceId(config.id) };
}

/**
 * Inserta o reemplaza un documento dentro del conjunto de filas.
 *
 * @param rows Filas actuales.
 * @param composed Fila del documento ya compuesta.
 * @param current Fila en edición; undefined cuando es un alta.
 * @returns Filas con el documento guardado.
 */
export function upsertDocumentRow(
  rows: readonly ResourceRow[],
  composed: ResourceRow,
  current?: ResourceRow,
): ResourceRow[] {
  if (!current) return [composed, ...rows];
  return rows.map((row) => (row.id === current.id ? composed : row));
}

/**
 * Elimina una fila del conjunto de documentos.
 *
 * @param rows Filas actuales.
 * @param id Identificador de la fila a eliminar.
 * @returns Filas sin el documento indicado.
 */
export function removeDocumentRow(
  rows: readonly ResourceRow[],
  id: string,
): ResourceRow[] {
  return rows.filter((row) => row.id !== id);
}

/**
 * Aplica una revisión a un documento.
 *
 * @param row Documento a revisar.
 * @param estado Nuevo estado del documento.
 * @param revisor Persona que firma la revisión.
 * @param fecha Fecha de la revisión en formato ISO.
 * @returns Fila con el estado actualizado.
 */
export function reviewedDocumentRow(
  row: ResourceRow,
  estado: 'Validado' | 'Rechazado',
  revisor: string,
  fecha: string,
): ResourceRow {
  return { ...row, estado, revisor, fecha_revision: fecha };
}
