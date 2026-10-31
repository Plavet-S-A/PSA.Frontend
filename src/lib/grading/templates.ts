/**
 * Plantillas, marcadores y validación de documentos de calificación.
 *
 * Capa: lib/grading
 * Funciones puras compartidas por el espacio de evaluación. El contenido del
 * usuario se trata siempre como texto; la interfaz y la descarga escapan la
 * salida para evitar inyección de HTML.
 */

import { formatDateInput } from '@/lib/format/date';
import type { GradeTemplate } from '@/types/grading';
import type { ResourceRow } from '@/types/resource';

/** Longitud máxima del nombre interno de una plantilla. */
export const TEMPLATE_NAME_MAX = 80;
/** Longitud máxima del título de un documento. */
export const DOCUMENT_HEADING_MAX = 160;
/** Longitud máxima del cuerpo de una plantilla o documento. */
export const DOCUMENT_BODY_MAX = 12000;
/** Longitud máxima del pie o firma. */
export const DOCUMENT_FOOTER_MAX = 2000;
/** Tamaño máximo del archivo que se importa como plantilla. */
export const TEMPLATE_FILE_MAX_BYTES = 2 * 1024 * 1024;

/** Marcadores disponibles en las plantillas. */
export const GRADE_PLACEHOLDERS = [
  { key: 'estudiante', label: 'Estudiante' },
  { key: 'taller', label: 'Taller' },
  { key: 'plaza', label: 'Plaza' },
  { key: 'calificacion', label: 'Calificación' },
  { key: 'estado', label: 'Estado' },
  { key: 'fecha', label: 'Fecha de emisión' },
] as const;

/** Claves válidas de marcador. */
export type GradePlaceholderKey = (typeof GRADE_PLACEHOLDERS)[number]['key'];

/** Valores que reemplazan los marcadores de una evaluación. */
export type GradeValues = Record<GradePlaceholderKey, string>;

/** Borrador editable de una plantilla. */
export interface GradeTemplateDraft {
  name: string;
  title: string;
  body: string;
  footer: string;
  source: 'custom' | 'uploaded';
  fileName?: string;
}

/** Borrador editable de un documento generado. */
export interface GradeDocumentDraft {
  heading: string;
  body: string;
  footer: string;
}

/**
 * Genera un identificador para plantillas y documentos.
 *
 * @param prefix Prefijo legible del tipo de registro.
 * @returns UUID cuando está disponible; si no, un identificador con marca de tiempo.
 */
export function createGradeId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now().toString(36)}`;
}

/**
 * Obtiene la fecha local en formato ISO corto.
 *
 * @param date Fecha de referencia.
 * @returns Texto YYYY-MM-DD.
 */
export function todayIsoDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Construye los valores de marcador a partir de una evaluación.
 *
 * @param row Fila de evaluación.
 * @param issuedAt Fecha de emisión del documento.
 * @returns Valores listos para reemplazar marcadores.
 */
export function gradeValuesFromRow(row: ResourceRow, issuedAt: string): GradeValues {
  return {
    estudiante: String(row.estudiante ?? ''),
    taller: String(row.taller ?? ''),
    plaza: String(row.plaza ?? ''),
    calificacion: String(row.calificacion ?? ''),
    estado: String(row.estado ?? ''),
    fecha: formatDateInput(issuedAt),
  };
}

/**
 * Reemplaza los marcadores conocidos y conserva los desconocidos.
 *
 * @param text Texto de la plantilla.
 * @param values Valores de la evaluación.
 * @returns Texto listo para mostrar.
 */
export function renderGradeTemplate(text: string, values: GradeValues): string {
  return text.replace(/\{\{([a-z]+)\}\}/g, (match, key: string) => {
    const value = values[key as GradePlaceholderKey];
    return value === undefined ? match : value;
  });
}

/**
 * Aplica una plantilla a los valores de una evaluación.
 *
 * @param template Plantilla elegida.
 * @param values Valores de la evaluación.
 * @returns Título, cuerpo y pie renderizados.
 */
export function applyGradeTemplate(
  template: GradeTemplate,
  values: GradeValues,
): GradeDocumentDraft {
  return {
    heading: renderGradeTemplate(template.title, values),
    body: renderGradeTemplate(template.body, values),
    footer: renderGradeTemplate(template.footer, values),
  };
}

/**
 * Valida los campos editables de una plantilla.
 *
 * @param draft Borrador de la plantilla.
 * @returns Errores indexados por campo; vacío si es válida.
 */
export function validateGradeTemplateDraft(
  draft: GradeTemplateDraft,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const name = draft.name.trim();
  const title = draft.title.trim();
  const body = draft.body.trim();

  if (name === '') errors.name = 'Escribe un nombre para la plantilla.';
  else if (name.length > TEMPLATE_NAME_MAX) {
    errors.name = `Usa como máximo ${TEMPLATE_NAME_MAX} caracteres.`;
  }

  if (title === '') errors.title = 'Escribe el título del documento.';
  else if (title.length > DOCUMENT_HEADING_MAX) {
    errors.title = `Usa como máximo ${DOCUMENT_HEADING_MAX} caracteres.`;
  }

  if (body === '') errors.body = 'Escribe el contenido de la plantilla.';
  else if (draft.body.length > DOCUMENT_BODY_MAX) {
    errors.body = `Usa como máximo ${DOCUMENT_BODY_MAX} caracteres.`;
  }

  if (draft.footer.length > DOCUMENT_FOOTER_MAX) {
    errors.footer = `Usa como máximo ${DOCUMENT_FOOTER_MAX} caracteres.`;
  }

  return errors;
}

/**
 * Valida el contenido editable antes de guardar un documento.
 *
 * @param draft Título, cuerpo y pie.
 * @returns Errores indexados por campo; vacío si es válido.
 */
export function validateGradeDocumentDraft(
  draft: GradeDocumentDraft,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (draft.heading.trim() === '') errors.heading = 'Escribe el título del documento.';
  else if (draft.heading.length > DOCUMENT_HEADING_MAX) {
    errors.heading = `Usa como máximo ${DOCUMENT_HEADING_MAX} caracteres.`;
  }
  if (draft.body.trim() === '') errors.body = 'El documento necesita contenido.';
  else if (draft.body.length > DOCUMENT_BODY_MAX) {
    errors.body = `Usa como máximo ${DOCUMENT_BODY_MAX} caracteres.`;
  }
  if (draft.footer.length > DOCUMENT_FOOTER_MAX) {
    errors.footer = `Usa como máximo ${DOCUMENT_FOOTER_MAX} caracteres.`;
  }
  return errors;
}

/**
 * Deriva un nombre legible a partir del archivo importado.
 *
 * @param fileName Nombre original del archivo.
 * @returns Nombre sin extensión, con espacios en lugar de guiones.
 */
export function templateNameFromFile(fileName: string): string {
  const base = fileName
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .trim();
  if (base === '') return 'Plantilla importada';
  return base.charAt(0).toLocaleUpperCase('es-MX') + base.slice(1);
}

/**
 * Construye un nombre de archivo seguro para la descarga.
 *
 * @param heading Título del documento.
 * @param student Estudiante del documento.
 * @returns Nombre terminado en .html.
 */
export function gradeDocumentFilename(heading: string, student: string): string {
  const raw = `${heading} - ${student}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLocaleLowerCase('en-US');
  return `${raw || 'documento-calificacion'}.html`;
}
