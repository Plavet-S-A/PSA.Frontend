/**
 * Catálogo de cierre de pasantía.
 *
 * Capa: lib/catalog
 * Permite preparar y seguir el cierre de una pasantía: revisión de documentos
 * pendientes, evaluación final, constancia de liberación y firma de tutores.
 */

import { CIERRE_ESTADOS } from '@/lib/catalog/options';
import { cierrePasantiaRows } from '@/lib/catalog/cierre-pasantia-rows';
import { todayIsoDate } from '@/lib/format/date';
import { registerDerivers } from '@/lib/catalog/deriver-registry';
import type { ResourceConfig, ResourceRow } from '@/types/resource';

registerDerivers('cierre-pasantia', {
  derive: deriveCierre,
});

export { cierrePasantiaRows } from '@/lib/catalog/cierre-pasantia-rows';

/** Talleres presentes en las filas de cierre, ordenados alfabéticamente. */
const CIERRE_TALLERES: readonly string[] = [
  ...new Set(cierrePasantiaRows.map((row) => String(row.taller ?? '').trim())),
]
  .filter((taller) => taller !== '')
  .sort((left, right) => left.localeCompare(right, 'es-MX'));

/**
 * Calcula las etiquetas derivadas de un cierre de pasantía.
 *
 * @param values Valores editables del formulario.
 * @param current Fila original cuando se edita.
 * @returns Atributos derivados listos para persistir.
 */
function deriveCierre(
  values: Record<string, string | number>,
  current?: ResourceRow,
): Record<string, string | number> {
  return {
    fecha_creacion: String(values.fecha_creacion ?? current?.fecha_creacion ?? todayIsoDate()),
    estado: String(values.estado ?? current?.estado ?? 'Pendiente'),
  };
}

export const cierrePasantiaConfig: ResourceConfig = {
  id: 'cierre-pasantia',
  singular: 'cierre de pasantía',
  plural: 'Cierres de pasantía',
  description:
    'Prepara y realiza el seguimiento del cierre de pasantías: documentos, evaluación final y constancias.',
  primaryKey: 'estudiante',
  searchKeys: ['estudiante', 'taller', 'centroTrabajo', 'estado'],
  searchPlaceholder: 'Buscar por estudiante, taller o centro de trabajo',
  columns: [
    { key: 'estudiante', label: 'Estudiante', secondaryKey: 'taller' },
    { key: 'centroTrabajo', label: 'Centro de trabajo', optional: true },
    { key: 'estado', label: 'Estado', format: 'status' },
    { key: 'fecha_cierre', label: 'Fecha de cierre', format: 'mono', optional: true },
  ],
  fields: [
    { key: 'estudiante', label: 'Estudiante', type: 'text', required: true, wide: true, placeholder: 'Nombre completo del estudiante' },
    { key: 'taller', label: 'Taller', type: 'text', required: true, placeholder: 'Nombre del taller' },
    { key: 'centroTrabajo', label: 'Centro de trabajo', type: 'text', required: true, wide: true, placeholder: 'Empresa u organización' },
    { key: 'fecha_inicio', label: 'Fecha de inicio', type: 'date', required: true },
    { key: 'fecha_fin', label: 'Fecha de fin prevista', type: 'date', required: true },
    { key: 'horas_completadas', label: 'Horas completadas', type: 'number', required: true, min: 0, max: 2000, defaultValue: '0' },
    { key: 'documentos_entregados', label: 'Documentos entregados', type: 'select', required: true, options: ['Sí', 'Parcial', 'No'], defaultValue: 'No' },
    { key: 'evaluacion_final', label: 'Evaluación final', type: 'number', required: true, min: 0, max: 100, defaultValue: '0' },
    { key: 'constancia_liberacion', label: 'Constancia de liberación', type: 'select', required: true, options: ['Pendiente', 'Emitida', 'No aplica'], defaultValue: 'Pendiente' },
    { key: 'observaciones', label: 'Observaciones de cierre', type: 'textarea', required: false, wide: true, rows: 4, placeholder: 'Notas sobre el cierre de la pasantía' },
    { key: 'estado', label: 'Estado', type: 'select', required: true, options: CIERRE_ESTADOS, defaultValue: 'Pendiente', wide: true },
    { key: 'fecha_cierre', label: 'Fecha de cierre real', type: 'date', required: false },
  ],
  detailFields: [
    { key: 'estudiante', label: 'Estudiante', section: 'Identidad' },
    { key: 'taller', label: 'Taller', section: 'Identidad' },
    { key: 'centroTrabajo', label: 'Centro de trabajo', section: 'Identidad' },
    { key: 'fecha_inicio', label: 'Fecha de inicio', format: 'date', section: 'Fechas' },
    { key: 'fecha_fin', label: 'Fecha de fin prevista', format: 'date', section: 'Fechas' },
    { key: 'horas_completadas', label: 'Horas completadas', format: 'number', section: 'Progreso' },
    { key: 'documentos_entregados', label: 'Documentos entregados', section: 'Progreso' },
    { key: 'evaluacion_final', label: 'Evaluación final', format: 'number', section: 'Progreso' },
    { key: 'constancia_liberacion', label: 'Constancia de liberación', section: 'Progreso' },
    { key: 'observaciones', label: 'Observaciones', section: 'Notas', hideWhenEmpty: true },
    { key: 'estado', label: 'Estado', format: 'status', section: 'Registro' },
    { key: 'fecha_cierre', label: 'Fecha de cierre real', format: 'date', section: 'Registro', hideWhenEmpty: true },
    { key: 'fecha_creacion', label: 'Fecha de creación', format: 'date', section: 'Registro' },
  ],
  normalizeRow: undefined,
  normalizeRowKey: 'cierre-pasantia',
  deriveRow: deriveCierre,
  deriveRowKey: 'cierre-pasantia',
  filters: [
    {
      key: 'taller',
      label: 'Taller',
      allLabel: 'Todos los talleres',
      options: CIERRE_TALLERES,
      type: 'multi',
      searchable: true,
    },
    {
      key: 'documentos_entregados',
      label: 'Documentos entregados',
      allLabel: 'Cualquier entrega',
      options: ['Sí', 'Parcial', 'No'],
      type: 'multi',
    },
  ],
  statusKey: 'estado',
  statusOptions: CIERRE_ESTADOS,
  emptyTitle: 'Sin cierres de pasantía',
  emptyDescription: 'Registra el primer cierre de pasantía para dar seguimiento al egreso del estudiante.',
  createLabel: 'Nuevo cierre de pasantía',
};
