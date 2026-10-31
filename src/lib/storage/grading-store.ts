/**
 * Persistencia local de plantillas y documentos de calificación.
 *
 * Capa: lib/storage
 * Guarda contenido de demostración en el navegador. La validación de forma
 * evita que un JSON corrupto rompa la interfaz; la API real será la autoridad
 * sobre permisos y contenido.
 */

import { defaultGradeTemplates } from '@/lib/grading/defaults';
import type { GradeDocument, GradeTemplate } from '@/types/grading';

const TEMPLATES_KEY = 'psa:grading:templates';
const DOCUMENTS_KEY = 'psa:grading:documents';

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isTemplate(value: unknown): value is GradeTemplate {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return (
    isString(item.id) &&
    isString(item.name) &&
    isString(item.title) &&
    isString(item.body) &&
    isString(item.footer) &&
    (item.source === 'custom' || item.source === 'uploaded') &&
    (item.fileName === undefined || isString(item.fileName)) &&
    isString(item.updatedAt)
  );
}

function isDocument(value: unknown): value is GradeDocument {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return (
    isString(item.id) &&
    isString(item.evaluationId) &&
    isString(item.templateId) &&
    isString(item.heading) &&
    isString(item.body) &&
    isString(item.footer) &&
    isString(item.issuedAt) &&
    isString(item.updatedAt)
  );
}

/**
 * Carga las plantillas guardadas y siembra las iniciales la primera vez.
 *
 * @returns Plantillas válidas; vacío si el usuario eliminó todas.
 */
export function loadGradeTemplates(): GradeTemplate[] {
  if (typeof window === 'undefined') return defaultGradeTemplates();
  try {
    const raw = window.localStorage.getItem(TEMPLATES_KEY);
    if (raw === null) {
      const seeded = defaultGradeTemplates();
      saveGradeTemplates(seeded);
      return seeded;
    }
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isTemplate) : defaultGradeTemplates();
  } catch {
    return defaultGradeTemplates();
  }
}

/**
 * Guarda las plantillas completas.
 *
 * @param templates Plantillas que se quieren persistir.
 * @returns false si el navegador rechazó la escritura.
 */
export function saveGradeTemplates(templates: readonly GradeTemplate[]): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
    return true;
  } catch {
    return false;
  }
}

/**
 * Carga los documentos generados.
 *
 * @returns Documentos válidos; arreglo vacío si no hay o están corruptos.
 */
export function loadGradeDocuments(): GradeDocument[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(DOCUMENTS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isDocument) : [];
  } catch {
    return [];
  }
}

/**
 * Guarda los documentos generados.
 *
 * @param documents Documentos que se quieren persistir.
 * @returns false si el navegador rechazó la escritura.
 */
export function saveGradeDocuments(documents: readonly GradeDocument[]): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(documents));
    return true;
  } catch {
    return false;
  }
}
