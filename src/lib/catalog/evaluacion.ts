/**
 * Catálogo de evaluaciones.
 *
 * Capa: lib/catalog
 * Cada fila reúne los criterios de `evaluacion_estudiante`, el promedio de
 * `calificacion_estudiante` y la evaluación de `evaluacion_centro_trabajo`.
 * El promedio y el alias `calificacion` se calculan desde los criterios para
 * que la generación de documentos siga usando un único valor.
 */

import { EVALUACION_ESTADOS, PLAZA_NOMBRES } from '@/lib/catalog/options';
import { todayIsoDate } from '@/lib/format/date';
import { registerDerivers } from '@/lib/catalog/deriver-registry';
import type { ResourceConfig, ResourceRow } from '@/types/resource';

registerDerivers('evaluacion', {
  normalize: normalizeEvaluacion,
  derive: deriveEvaluacion,
});

export { evaluacionRows } from '@/lib/catalog/evaluacion-rows';

const CRITERIOS = [
  'asistencia',
  'desempeno',
  'disponibilidad',
  'responsabilidad',
  'limpieza',
  'trabajo_equipo',
  'resolucion_problemas',
] as const;

/**
 * Ajusta filas anteriores que solo tenían `calificacion`.
 *
 * @param row Fila recuperada de almacenamiento local.
 * @returns Fila con criterios, promedio y evaluación de centro completos.
 */
function normalizeEvaluacion(row: ResourceRow): ResourceRow {
  const promedio = Number(row.promedio ?? row.calificacion ?? 0);
  return {
    ...row,
    ra: String(row.ra ?? 'RA1, RA2'),
    asistencia: Number(row.asistencia ?? promedio),
    desempeno: Number(row.desempeno ?? promedio),
    disponibilidad: Number(row.disponibilidad ?? promedio),
    responsabilidad: Number(row.responsabilidad ?? promedio),
    limpieza: Number(row.limpieza ?? promedio),
    trabajo_equipo: Number(row.trabajo_equipo ?? promedio),
    resolucion_problemas: Number(row.resolucion_problemas ?? promedio),
    promedio,
    calificacion: promedio,
    fecha: String(row.fecha ?? todayIsoDate()),
    observaciones: String(row.observaciones ?? 'Sin observaciones.'),
    estado: String(row.estado ?? 'Pendiente'),
    espacio_trabajo: Number(row.espacio_trabajo ?? promedio),
    asignacion_tareas: Number(row.asignacion_tareas ?? promedio),
    disponibilidad_centro: Number(row.disponibilidad_centro ?? promedio),
    observaciones_centro: String(row.observaciones_centro ?? 'Sin observaciones del centro.'),
    fecha_centro: String(row.fecha_centro ?? todayIsoDate()),
  };
}

/**
 * Calcula el promedio a partir de los criterios editables.
 *
 * @param values Valores editables del formulario.
 * @param current Fila original cuando se edita.
 * @returns Promedio, alias de calificación y fecha de evaluación.
 */
function deriveEvaluacion(
  values: Record<string, string | number>,
  current?: ResourceRow,
): Record<string, string | number> {
  const scores = CRITERIOS.map((key) =>
    Number(values[key] ?? current?.[key] ?? 0),
  );
  const total = scores.reduce((sum, score) => sum + score, 0);
  const promedio = Math.round(total / scores.length);
  return {
    promedio,
    calificacion: promedio,
    fecha: String(values.fecha ?? current?.fecha ?? todayIsoDate()),
    id_evaluacion: current?.id_evaluacion ?? '',
    id_calificacion: current?.id_calificacion ?? '',
    id_pasantia: current?.id_pasantia ?? '',
  };
}

export const evaluacionConfig: ResourceConfig = {
  id: 'evaluacion',
  singular: 'evaluación',
  plural: 'Evaluación',
  description:
    'Consulta y captura los criterios, el promedio y la evaluación del centro de trabajo.',
  primaryKey: 'estudiante',
  searchKeys: ['estudiante', 'taller', 'plaza', 'fecha', 'estado'],
  searchPlaceholder: 'Buscar por estudiante, taller, plaza, fecha o estado',
  columns: [
    { key: 'estudiante', label: 'Estudiante', secondaryKey: 'taller' },
    { key: 'plaza', label: 'Plaza', optional: true },
    { key: 'promedio', label: 'Promedio', format: 'number', align: 'right' },
    { key: 'fecha', label: 'Fecha', format: 'mono', optional: true },
    { key: 'estado', label: 'Estado', format: 'status' },
  ],
  fields: [
    { key: 'plaza', label: 'Plaza', type: 'select', required: true, wide: true, options: PLAZA_NOMBRES, defaultValue: PLAZA_NOMBRES[0] },
    { key: 'ra', label: 'Resultados de aprendizaje', type: 'text', required: true, wide: true, placeholder: 'RA1, RA2, RA3' },
    { key: 'asistencia', label: 'Asistencia (0 a 100)', type: 'number', required: true, min: 0, max: 100, defaultValue: '80' },
    { key: 'desempeno', label: 'Desempeño (0 a 100)', type: 'number', required: true, min: 0, max: 100, defaultValue: '80' },
    { key: 'disponibilidad', label: 'Disponibilidad (0 a 100)', type: 'number', required: true, min: 0, max: 100, defaultValue: '80' },
    { key: 'responsabilidad', label: 'Responsabilidad (0 a 100)', type: 'number', required: true, min: 0, max: 100, defaultValue: '80' },
    { key: 'limpieza', label: 'Limpieza (0 a 100)', type: 'number', required: true, min: 0, max: 100, defaultValue: '80' },
    { key: 'trabajo_equipo', label: 'Trabajo en equipo (0 a 100)', type: 'number', required: true, min: 0, max: 100, defaultValue: '80' },
    { key: 'resolucion_problemas', label: 'Resolución de problemas (0 a 100)', type: 'number', required: true, min: 0, max: 100, defaultValue: '80' },
    { key: 'fecha', label: 'Fecha de evaluación', type: 'date', required: true },
    { key: 'observaciones', label: 'Observaciones del tutor', type: 'textarea', required: false, wide: true, rows: 3, placeholder: 'Fortalezas, áreas de mejora y acuerdos.' },
    { key: 'estado', label: 'Estado', type: 'select', required: true, wide: true, options: EVALUACION_ESTADOS, defaultValue: 'Pendiente' },
  ],
  detailFields: [
    { key: 'promedio', label: 'Promedio', format: 'number', section: 'Resultado' },
    { key: 'ra', label: 'Resultados de aprendizaje', section: 'Resultado' },
    { key: 'fecha', label: 'Fecha de evaluación', format: 'date', section: 'Resultado' },
    { key: 'observaciones', label: 'Observaciones del tutor', section: 'Resultado', hideWhenEmpty: true },
    { key: 'asistencia', label: 'Asistencia', format: 'number', section: 'Criterios' },
    { key: 'desempeno', label: 'Desempeño', format: 'number', section: 'Criterios' },
    { key: 'disponibilidad', label: 'Disponibilidad', format: 'number', section: 'Criterios' },
    { key: 'responsabilidad', label: 'Responsabilidad', format: 'number', section: 'Criterios' },
    { key: 'limpieza', label: 'Limpieza', format: 'number', section: 'Criterios' },
    { key: 'trabajo_equipo', label: 'Trabajo en equipo', format: 'number', section: 'Criterios' },
    { key: 'resolucion_problemas', label: 'Resolución de problemas', format: 'number', section: 'Criterios' },
    { key: 'espacio_trabajo', label: 'Espacio de trabajo', format: 'number', section: 'Evaluación del centro' },
    { key: 'asignacion_tareas', label: 'Asignación de tareas', format: 'number', section: 'Evaluación del centro' },
    { key: 'disponibilidad_centro', label: 'Disponibilidad del centro', format: 'number', section: 'Evaluación del centro' },
    { key: 'observaciones_centro', label: 'Observaciones del centro', section: 'Evaluación del centro', hideWhenEmpty: true },
    { key: 'fecha_centro', label: 'Fecha de evaluación del centro', format: 'date', section: 'Evaluación del centro' },
    { key: 'estudiante', label: 'Estudiante', section: 'Relaciones' },
    { key: 'taller', label: 'Taller', section: 'Relaciones' },
    { key: 'plaza', label: 'Plaza', section: 'Relaciones' },
  ],
  normalizeRow: normalizeEvaluacion,
  normalizeRowKey: 'evaluacion',
  deriveRow: deriveEvaluacion,
  deriveRowKey: 'evaluacion',
  statusKey: 'estado',
  statusOptions: EVALUACION_ESTADOS,
  emptyTitle: 'Sin evaluaciones',
  emptyDescription: 'Captura la primera evaluación de este taller.',
  createLabel: 'Nueva evaluación',
};
