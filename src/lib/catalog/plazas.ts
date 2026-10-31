/**
 * Catálogo de plazas de práctica.
 *
 * Capa: lib/catalog
 * La plaza se define por `centro_trabajo`, `taller`, cantidad de lugares y
 * restricciones. La etiqueta `plaza` y las llaves foráneas se derivan de esas
 * relaciones para no duplicarlas en el formulario.
 */

import {
  CENTRO_TRABAJO_NOMBRES,
  GENERO_OPCIONES,
  TALLER_NOMBRES,
  plazaLabel,
} from '@/lib/catalog/options';
import {
  assignedStudentsForPlaza,
  type PlazaAssignment,
} from '@/lib/catalog/plaza-assignments';
import { todayIsoDate } from '@/lib/format/date';
import { registerDerivers } from '@/lib/catalog/deriver-registry';
import type { ResourceConfig, ResourceRow } from '@/types/resource';

registerDerivers('plazas', {
  derive: derivePlaza,
});

export { plazasRows } from '@/lib/catalog/plazas-rows';

const PLAZA_ESTADOS = ['Abierta', 'En revisión', 'Cubierta', 'Cerrada'] as const;

/**
 * Convierte una fila antigua o incompleta a la forma actual de plaza.
 *
 * @param row Fila guardada o de ejemplo.
 * @param fallbackTaller Taller activo de la vista cuando falta el dato.
 * @returns Fila con etiqueta, cupos y restricciones normalizadas.
 */
export function withPlazaTaller(
  rows: readonly ResourceRow[],
  fallbackTaller: string,
): ResourceRow[] {
  return rows.map((row) => {
    const taller = String(row.taller ?? '') || fallbackTaller;
    const centroTrabajo = String(row.centroTrabajo ?? row.empresa ?? '');
    const centroIndex = CENTRO_TRABAJO_NOMBRES.indexOf(
      centroTrabajo as (typeof CENTRO_TRABAJO_NOMBRES)[number],
    );
    const tallerIndex = TALLER_NOMBRES.indexOf(taller as (typeof TALLER_NOMBRES)[number]);
    return {
      ...row,
      taller,
      centroTrabajo,
      plaza: String(row.plaza ?? '') || plazaLabel(centroTrabajo, taller),
      cantidad: Number(row.cantidad ?? row.vacantes ?? 0),
      edad_minima: Number(row.edad_minima ?? 18),
      genero: String(row.genero ?? 'Indistinto'),
      observacion: String(row.observacion ?? row.modalidad ?? ''),
      fecha_creacion: String(row.fecha_creacion ?? todayIsoDate()),
      id_centro_trabajo:
        row.id_centro_trabajo ?? (centroIndex >= 0 ? centroIndex + 1 : ''),
      id_taller: row.id_taller ?? (tallerIndex >= 0 ? tallerIndex + 1 : ''),
    };
  });
}

/**
 * Calcula la etiqueta de la plaza y sus llaves foráneas.
 *
 * @param values Valores editables del formulario.
 * @param current Fila original cuando se edita.
 * @returns Atributos derivados listos para persistir.
 */
function derivePlaza(
  values: Record<string, string | number>,
  current?: ResourceRow,
): Record<string, string | number> {
  const centroTrabajo = String(values.centroTrabajo ?? current?.centroTrabajo ?? '');
  const taller = String(values.taller ?? current?.taller ?? '');
  const centroIndex = CENTRO_TRABAJO_NOMBRES.indexOf(
    centroTrabajo as (typeof CENTRO_TRABAJO_NOMBRES)[number],
  );
  const tallerIndex = TALLER_NOMBRES.indexOf(taller as (typeof TALLER_NOMBRES)[number]);
  return {
    centroTrabajo,
    taller,
    plaza: plazaLabel(centroTrabajo, taller),
    cantidad: Number(values.cantidad ?? current?.cantidad ?? 0),
    edad_minima: Number(values.edad_minima ?? current?.edad_minima ?? 18),
    genero: String(values.genero ?? current?.genero ?? 'Indistinto'),
    observacion: String(values.observacion ?? current?.observacion ?? ''),
    fecha_creacion: String(values.fecha_creacion ?? current?.fecha_creacion ?? todayIsoDate()),
    id_centro_trabajo:
      centroIndex >= 0 ? centroIndex + 1 : current?.id_centro_trabajo ?? '',
    id_taller: tallerIndex >= 0 ? tallerIndex + 1 : current?.id_taller ?? '',
  };
}

/**
 * Resumen de plazas de un taller para la cabecera del detalle.
 *
 * @param rows Plazas visibles para el rol.
 * @param assignments Relación vigente entre plazas y estudiantes.
 * @param taller Taller seleccionado.
 * @returns Totales de plazas, cupos, asignados y plazas abiertas.
 */
export function summarizePlazas(
  rows: readonly ResourceRow[],
  assignments: readonly PlazaAssignment[],
  taller: string,
): { plazas: number; cupos: number; asignados: number; abiertas: number } {
  const items = rows.filter((row) => String(row.taller) === taller);

  return {
    plazas: items.length,
    cupos: items.reduce((total, row) => total + Number(row.cantidad ?? 0), 0),
    asignados: items.reduce(
      (total, row) =>
        total + assignedStudentsForPlaza(assignments, row.id).length,
      0,
    ),
    abiertas: items.filter((row) => String(row.estado) === 'Abierta').length,
  };
}

export const plazasConfig: ResourceConfig = {
  id: 'plazas',
  singular: 'plaza',
  plural: 'Plazas',
  description:
    'Administra los lugares disponibles por centro de trabajo, taller y restricciones de elegibilidad.',
  primaryKey: 'plaza',
  searchKeys: ['plaza', 'centroTrabajo', 'taller', 'genero', 'estado', 'solicitadoPor'],
  searchPlaceholder: 'Buscar por centro, taller, género o estado',
  columns: [
    { key: 'plaza', label: 'Plaza' },
    { key: 'cantidad', label: 'Cupos', format: 'number', align: 'right' },
    { key: 'edad_minima', label: 'Edad mínima', format: 'number', align: 'right', optional: true },
    { key: 'genero', label: 'Género', optional: true },
    { key: 'estado', label: 'Estado', format: 'status' },
  ],
  fields: [
    { key: 'centroTrabajo', label: 'Centro de trabajo', type: 'select', required: true, wide: true, options: CENTRO_TRABAJO_NOMBRES, defaultValue: CENTRO_TRABAJO_NOMBRES[0] },
    { key: 'cantidad', label: 'Cupos disponibles', type: 'number', required: true, min: 0, max: 100, defaultValue: '1' },
    { key: 'edad_minima', label: 'Edad mínima', type: 'number', required: true, min: 0, max: 99, defaultValue: '18' },
    { key: 'genero', label: 'Género admitido', type: 'select', required: true, options: GENERO_OPCIONES, defaultValue: 'Indistinto' },
    { key: 'observacion', label: 'Observaciones de la plaza', type: 'textarea', required: false, wide: true, rows: 3, placeholder: 'Horario, modalidad o requisitos adicionales.' },
    { key: 'estado', label: 'Estado', type: 'select', required: true, wide: true, options: PLAZA_ESTADOS, defaultValue: 'Abierta' },
  ],
  detailFields: [
    { key: 'centroTrabajo', label: 'Centro de trabajo', section: 'Plaza' },
    { key: 'taller', label: 'Taller', section: 'Plaza' },
    { key: 'cantidad', label: 'Cupos disponibles', format: 'number', section: 'Plaza' },
    { key: 'edad_minima', label: 'Edad mínima', format: 'number', section: 'Requisitos' },
    { key: 'genero', label: 'Género admitido', section: 'Requisitos' },
    { key: 'observacion', label: 'Observaciones', section: 'Requisitos', hideWhenEmpty: true },
    { key: 'fecha_creacion', label: 'Fecha de creación', format: 'date', section: 'Registro' },
    { key: 'solicitadoPor', label: 'Solicitada por', section: 'Solicitud', hideWhenEmpty: true },
    { key: 'fecha_solicitud', label: 'Fecha de solicitud', format: 'date', section: 'Solicitud', hideWhenEmpty: true },
  ],
  deriveRow: derivePlaza,
  deriveRowKey: 'plazas',
  statusKey: 'estado',
  statusOptions: PLAZA_ESTADOS,
  emptyTitle: 'Sin plazas registradas',
  emptyDescription: 'Crea la primera plaza para vincular un taller con un centro de trabajo.',
  createLabel: 'Nueva plaza',
};

/**
 * Configuración de la tabla de plazas una vez elegido el taller.
 *
 * Añade la columna calculada `asignados` y omite el campo `taller` del
 * formulario porque lo resuelve la vista.
 */
export const plazaDetailConfig: ResourceConfig = {
  ...plazasConfig,
  plural: 'Plazas del taller',
  filters: [
    {
      key: 'estado',
      label: 'Estado',
      allLabel: 'Todos los estados',
      options: PLAZA_ESTADOS,
      type: 'multi',
    },
  ],
  columns: [
    { key: 'plaza', label: 'Plaza' },
    { key: 'cantidad', label: 'Cupos', format: 'number', align: 'right' },
    { key: 'asignados', label: 'Asignados', format: 'number', align: 'right' },
    {
      key: 'edad_minima',
      label: 'Edad mínima',
      format: 'number',
      align: 'right',
      optional: true,
    },
    { key: 'genero', label: 'Género', optional: true },
    { key: 'estado', label: 'Estado', format: 'status' },
  ],
  fields: plazasConfig.fields.filter((field) => field.key !== 'taller'),
};
