/**
 * Plantillas iniciales de documentos de calificación.
 *
 * Capa: lib/grading
 * Datos de demostración separados del motor de marcadores y validación.
 */

import type { GradeTemplate } from '@/types/grading';

const DEFAULT_UPDATED_AT = '2026-10-27T12:00:00.000Z';

const DEFAULT_TEMPLATES: readonly GradeTemplate[] = [
  {
    id: 'tpl-constancia',
    name: 'Constancia de calificación',
    title: 'Constancia de calificación',
    body: `Se hace constar que {{estudiante}} participó en el taller "{{taller}}" y obtuvo una calificación de {{calificacion}} puntos sobre 100.

La plaza vinculada fue {{plaza}} y el estado de la evaluación es {{estado}}.`,
    footer: `Expedida el {{fecha}}.

______________________________
Firma del tutor`,
    source: 'custom',
    updatedAt: DEFAULT_UPDATED_AT,
  },
  {
    id: 'tpl-reporte',
    name: 'Reporte de desempeño',
    title: 'Reporte de desempeño',
    body: `El presente reporte resume el desempeño de {{estudiante}} en el taller {{taller}}, vinculado a la plaza {{plaza}}.

Calificación final: {{calificacion}}/100
Estado: {{estado}}

Observaciones:
`,
    footer: `Fecha de emisión: {{fecha}}

______________________________
Tutor responsable`,
    source: 'custom',
    updatedAt: DEFAULT_UPDATED_AT,
  },
];

/**
 * Devuelve una copia de las plantillas iniciales.
 *
 * @returns Plantillas semilla listas para editar.
 */
export function defaultGradeTemplates(): GradeTemplate[] {
  return DEFAULT_TEMPLATES.map((template) => ({ ...template }));
}
