/**
 * Catálogo del proceso de pasantía.
 *
 * Capa: lib/catalog
 * La fila principal representa `pasantia`; las tarjetas y la tabla proyectan
 * etapa, avance, horas acumuladas y resúmenes de asistencia y visitas.
 */

import {
  CENTRO_TRABAJO_NOMBRES,
  ESTUDIANTE_NOMBRES,
  PLAZA_NOMBRES,
  PROCESO_ESTADOS,
  PROCESO_ETAPAS,
  SUPERVISOR_NOMBRES,
  TALLER_NOMBRES,
} from '@/lib/catalog/options';
import { todayIsoDate } from '@/lib/format/date';
import { registerDerivers } from '@/lib/catalog/deriver-registry';
import type { ResourceConfig, ResourceRow } from '@/types/resource';

registerDerivers('proceso-pasantia', {
  normalize: normalizeProceso,
  derive: deriveProceso,
});

export { procesoPasantiaRows } from '@/lib/catalog/proceso-pasantia-rows';

/**
 * Ajusta filas anteriores que no tenían horas ni resúmenes de seguimiento.
 *
 * @param row Fila recuperada de almacenamiento local.
 * @returns Fila con las llaves actuales del modelo.
 */
function normalizeProceso(row: ResourceRow): ResourceRow {
  const avance = Number(row.avance ?? 0);
  return {
    ...row,
    fecha_creacion: String(row.fecha_creacion ?? todayIsoDate()),
    horas_acumuladas: Number(row.horas_acumuladas ?? Math.round((avance / 100) * 480)),
    asistencias: Number(row.asistencias ?? 0),
    faltas: Number(row.faltas ?? 0),
    visitas: Number(row.visitas ?? 0),
    ultima_visita: String(row.ultima_visita ?? ''),
    poliza: String(row.poliza ?? ''),
    supervisor: String(row.supervisor ?? SUPERVISOR_NOMBRES[0]),
    centroTrabajo: String(row.centroTrabajo ?? ''),
  };
}

/**
 * Calcula llaves foráneas y campos de seguimiento del proceso.
 *
 * @param values Valores editables del formulario.
 * @param current Fila original cuando se edita.
 * @returns Atributos derivados listos para persistir.
 */
function deriveProceso(
  values: Record<string, string | number>,
  current?: ResourceRow,
): Record<string, string | number> {
  const estudiante = String(values.estudiante ?? current?.estudiante ?? '');
  const plaza = String(values.plaza ?? current?.plaza ?? '');
  const centroTrabajo = String(values.centroTrabajo ?? current?.centroTrabajo ?? '');
  const supervisor = String(values.supervisor ?? current?.supervisor ?? '');
  const estudianteIndex = ESTUDIANTE_NOMBRES.indexOf(
    estudiante as (typeof ESTUDIANTE_NOMBRES)[number],
  );
  const plazaIndex = PLAZA_NOMBRES.indexOf(plaza as (typeof PLAZA_NOMBRES)[number]);
  const centroIndex = CENTRO_TRABAJO_NOMBRES.indexOf(
    centroTrabajo as (typeof CENTRO_TRABAJO_NOMBRES)[number],
  );
  const supervisorIndex = SUPERVISOR_NOMBRES.indexOf(
    supervisor as (typeof SUPERVISOR_NOMBRES)[number],
  );
  return {
    horas_acumuladas: Number(values.horas_acumuladas ?? current?.horas_acumuladas ?? 0),
    avance: Number(values.avance ?? current?.avance ?? 0),
    asistencias: Number(current?.asistencias ?? 0),
    faltas: Number(current?.faltas ?? 0),
    visitas: Number(current?.visitas ?? 0),
    ultima_visita: current?.ultima_visita ?? '',
    poliza: current?.poliza ?? '',
    fecha_creacion: String(values.fecha_creacion ?? current?.fecha_creacion ?? todayIsoDate()),
    id_pasantia: current?.id_pasantia ?? '',
    id_estudiante:
      estudianteIndex >= 0 ? estudianteIndex + 1 : current?.id_estudiante ?? '',
    id_plaza: plazaIndex >= 0 ? plazaIndex + 1 : current?.id_plaza ?? '',
    id_centro_trabajo:
      centroIndex >= 0 ? centroIndex + 1 : current?.id_centro_trabajo ?? '',
    id_supervisor:
      supervisorIndex >= 0 ? supervisorIndex + 1 : current?.id_supervisor ?? '',
  };
}

export const procesoPasantiaConfig: ResourceConfig = {
  id: 'proceso-pasantia',
  singular: 'pasantía',
  plural: 'Proceso de pasantía',
  description:
    'Da seguimiento a la plaza, el centro, el supervisor, las horas y las visitas de cada estudiante.',
  primaryKey: 'estudiante',
  searchKeys: [
    'estudiante',
    'taller',
    'plaza',
    'centroTrabajo',
    'supervisor',
    'etapa',
    'estado',
  ],
  searchPlaceholder: 'Buscar por estudiante, centro, supervisor, etapa o estado',
  columns: [
    { key: 'estudiante', label: 'Estudiante', secondaryKey: 'taller' },
    { key: 'centroTrabajo', label: 'Centro de trabajo', optional: true },
    { key: 'etapa', label: 'Etapa', optional: true },
    { key: 'horas_acumuladas', label: 'Horas acumuladas', format: 'number', align: 'right' },
    { key: 'estado', label: 'Estado', format: 'status' },
  ],
  fields: [
    { key: 'estudiante', label: 'Estudiante', type: 'select', required: true, wide: true, options: ESTUDIANTE_NOMBRES, defaultValue: ESTUDIANTE_NOMBRES[0] },
    { key: 'taller', label: 'Taller', type: 'select', required: true, options: TALLER_NOMBRES, defaultValue: TALLER_NOMBRES[0] },
    { key: 'plaza', label: 'Plaza', type: 'select', required: true, options: PLAZA_NOMBRES, defaultValue: PLAZA_NOMBRES[0] },
    { key: 'centroTrabajo', label: 'Centro de trabajo', type: 'select', required: true, options: CENTRO_TRABAJO_NOMBRES, defaultValue: CENTRO_TRABAJO_NOMBRES[0] },
    { key: 'supervisor', label: 'Supervisor', type: 'select', required: true, options: SUPERVISOR_NOMBRES, defaultValue: SUPERVISOR_NOMBRES[0] },
    { key: 'etapa', label: 'Etapa', type: 'select', required: true, options: PROCESO_ETAPAS, defaultValue: PROCESO_ETAPAS[0] },
    { key: 'avance', label: 'Avance (%)', type: 'number', required: true, min: 0, max: 100, defaultValue: '0' },
    { key: 'horas_acumuladas', label: 'Horas acumuladas', type: 'number', required: true, min: 0, max: 2000, defaultValue: '0' },
    { key: 'estado', label: 'Estado', type: 'select', required: true, wide: true, options: PROCESO_ESTADOS, defaultValue: 'En tiempo' },
  ],
  detailFields: [
    { key: 'etapa', label: 'Etapa', section: 'Pasantía' },
    { key: 'avance', label: 'Avance', format: 'number', section: 'Pasantía' },
    { key: 'horas_acumuladas', label: 'Horas acumuladas', format: 'number', section: 'Pasantía' },
    { key: 'fecha_creacion', label: 'Fecha de creación', format: 'date', section: 'Pasantía' },
    { key: 'estudiante', label: 'Estudiante', section: 'Relaciones' },
    { key: 'taller', label: 'Taller', section: 'Relaciones' },
    { key: 'plaza', label: 'Plaza', section: 'Relaciones' },
    { key: 'centroTrabajo', label: 'Centro de trabajo', section: 'Relaciones' },
    { key: 'supervisor', label: 'Supervisor', section: 'Relaciones' },
    { key: 'asistencias', label: 'Asistencias registradas', format: 'number', section: 'Seguimiento' },
    { key: 'faltas', label: 'Faltas', format: 'number', section: 'Seguimiento' },
    { key: 'visitas', label: 'Visitas realizadas', format: 'number', section: 'Seguimiento' },
    { key: 'ultima_visita', label: 'Última visita', format: 'date', section: 'Seguimiento', hideWhenEmpty: true },
    { key: 'poliza', label: 'Póliza', format: 'mono', section: 'Seguimiento', hideWhenEmpty: true },
  ],
  normalizeRow: normalizeProceso,
  normalizeRowKey: 'proceso-pasantia',
  deriveRow: deriveProceso,
  deriveRowKey: 'proceso-pasantia',
  filters: [
    {
      key: 'taller',
      label: 'Taller',
      allLabel: 'Todos los talleres',
      options: TALLER_NOMBRES,
      type: 'multi',
      searchable: true,
    },
    {
      key: 'etapa',
      label: 'Etapa',
      allLabel: 'Todas las etapas',
      options: PROCESO_ETAPAS,
      type: 'multi',
    },
  ],
  statusKey: 'estado',
  statusOptions: PROCESO_ESTADOS,
  emptyTitle: 'Sin pasantías registradas',
  emptyDescription: 'Crea la primera pasantía para dar seguimiento a un estudiante.',
  createLabel: 'Nueva pasantía',
};
