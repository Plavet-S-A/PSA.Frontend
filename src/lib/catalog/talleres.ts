/**
 * Catálogo de talleres.
 *
 * Capa: lib/catalog
 * Cada taller declara su familia profesional, código de título y horas de
 * práctica. `id_familia` se calcula a partir de la etiqueta visible.
 */

import { FAMILIA_NOMBRES } from '@/lib/catalog/options';
import { registerDerivers } from '@/lib/catalog/deriver-registry';
import type { ResourceConfig, ResourceRow } from '@/types/resource';

registerDerivers('talleres', {
  normalize: normalizeTaller,
  derive: deriveTaller,
});

export { talleresRows } from '@/lib/catalog/talleres-rows';

const TALLER_ESTADOS = ['Activo', 'En planeación', 'Cerrado'] as const;

/**
 * Ajusta filas anteriores que usaban `carrera` y `duracionHoras`.
 *
 * @param row Fila recuperada de almacenamiento local.
 * @returns Fila con las llaves actuales del modelo.
 */
function normalizeTaller(row: ResourceRow): ResourceRow {
  return {
    ...row,
    familia: String(row.familia ?? row.carrera ?? ''),
    codigo_titulo: String(row.codigo_titulo ?? row.modalidad ?? ''),
    horas_pasantia: Number(row.horas_pasantia ?? row.duracionHoras ?? 0),
  };
}

/**
 * Calcula la llave de familia profesional.
 *
 * @param values Valores editables del formulario.
 * @param current Fila original cuando se edita.
 * @returns `id_familia` sincronizado con la etiqueta.
 */
function deriveTaller(
  values: Record<string, string | number>,
  current?: ResourceRow,
): Record<string, string | number> {
  const familia = String(values.familia ?? current?.familia ?? '');
  const index = FAMILIA_NOMBRES.indexOf(familia as (typeof FAMILIA_NOMBRES)[number]);
  return {
    id_familia: index >= 0 ? index + 1 : current?.id_familia ?? '',
  };
}

export const talleresConfig: ResourceConfig = {
  id: 'talleres',
  singular: 'taller',
  plural: 'Talleres',
  description:
    'Administra las familias profesionales, los códigos de título y las horas de práctica.',
  primaryKey: 'nombre',
  searchKeys: ['nombre', 'familia', 'codigo_titulo'],
  searchPlaceholder: 'Buscar por taller, familia o código de título',
  columns: [
    { key: 'nombre', label: 'Taller', secondaryKey: 'familia' },
    { key: 'codigo_titulo', label: 'Código de título', format: 'mono' },
    { key: 'horas_pasantia', label: 'Horas requeridas', format: 'number', align: 'right' },
    { key: 'estado', label: 'Estado', format: 'status' },
  ],
  fields: [
    { key: 'nombre', label: 'Nombre del taller', type: 'text', required: true, wide: true, placeholder: 'Ej. Taller de empleabilidad' },
    { key: 'familia', label: 'Familia profesional', type: 'select', required: true, options: FAMILIA_NOMBRES, defaultValue: FAMILIA_NOMBRES[0] },
    { key: 'codigo_titulo', label: 'Código de título', type: 'text', required: true, placeholder: 'TSU-ADM-EMP' },
    { key: 'horas_pasantia', label: 'Horas de práctica requeridas', type: 'number', required: true, min: 1, max: 2000, defaultValue: '240' },
    { key: 'estado', label: 'Estado', type: 'select', required: true, wide: true, options: TALLER_ESTADOS, defaultValue: 'Activo' },
  ],
  detailFields: [
    { key: 'nombre', label: 'Nombre del taller', section: 'Taller' },
    { key: 'familia', label: 'Familia profesional', section: 'Taller' },
    { key: 'codigo_titulo', label: 'Código de título', format: 'mono', section: 'Taller' },
    { key: 'horas_pasantia', label: 'Horas de práctica requeridas', format: 'number', section: 'Taller' },
  ],
  normalizeRow: normalizeTaller,
  normalizeRowKey: 'talleres',
  deriveRow: deriveTaller,
  deriveRowKey: 'talleres',
  filters: [
    {
      key: 'familia',
      label: 'Familia profesional',
      allLabel: 'Todas las familias',
      options: FAMILIA_NOMBRES,
      type: 'multi',
    },
  ],
  statusKey: 'estado',
  statusOptions: TALLER_ESTADOS,
  emptyTitle: 'Sin talleres registrados',
  emptyDescription: 'Crea el primer taller para organizar estudiantes, plazas y evaluaciones.',
  createLabel: 'Nuevo taller',
};
