/**
 * Catálogo de supervisores.
 *
 * Capa: lib/catalog
 * El supervisor pertenece a un centro de trabajo. La pantalla es de consulta
 * para el rol supervisor; las acciones de escritura las habilita el permiso.
 */

import { CENTRO_TRABAJO_NOMBRES } from '@/lib/catalog/options';
import { normalizePersonName, personFullName } from '@/lib/catalog/person-name';
import { todayIsoDate } from '@/lib/format/date';
import { registerDerivers } from '@/lib/catalog/deriver-registry';
import type { ResourceConfig, ResourceRow } from '@/types/resource';

registerDerivers('supervisores', {
  normalize: normalizeSupervisor,
  derive: deriveSupervisor,
});

export { supervisoresRows } from '@/lib/catalog/supervisores-rows';

const SUPERVISOR_ESTADOS = ['Activo', 'Inactivo'] as const;

/**
 * Ajusta filas anteriores que usaban `correo` y `empresa`.
 *
 * @param row Fila recuperada de almacenamiento local.
 * @returns Fila con las llaves actuales del modelo.
 */
function normalizeSupervisor(row: ResourceRow): ResourceRow {
  return normalizePersonName({
    ...row,
    email_contacto: String(row.email_contacto ?? row.correo ?? ''),
    centroTrabajo: String(row.centroTrabajo ?? row.empresa ?? CENTRO_TRABAJO_NOMBRES[0]),
    fecha_creacion: String(row.fecha_creacion ?? todayIsoDate()),
  });
}

/**
 * Calcula el nombre visible y el centro de trabajo relacionado.
 *
 * @param values Valores editables del formulario.
 * @param current Fila original cuando se edita.
 * @returns Atributos derivados listos para persistir.
 */
function deriveSupervisor(
  values: Record<string, string | number>,
  current?: ResourceRow,
): Record<string, string | number> {
  const nombre = String(values.nombre ?? current?.nombre ?? '');
  const apellido = String(values.apellido ?? current?.apellido ?? '');
  const centro = String(values.centroTrabajo ?? current?.centroTrabajo ?? '');
  const index = CENTRO_TRABAJO_NOMBRES.indexOf(
    centro as (typeof CENTRO_TRABAJO_NOMBRES)[number],
  );
  return {
    nombreCompleto: personFullName(nombre, apellido),
    id_centro_trabajo: index >= 0 ? index + 1 : current?.id_centro_trabajo ?? '',
    fecha_creacion: String(values.fecha_creacion ?? current?.fecha_creacion ?? todayIsoDate()),
  };
}

export const supervisoresConfig: ResourceConfig = {
  id: 'supervisores',
  singular: 'supervisor',
  plural: 'Supervisores',
  description:
    'Consulta a los responsables de centro de trabajo y su relación institucional.',
  primaryKey: 'nombreCompleto',
  searchKeys: ['nombreCompleto', 'nombre', 'apellido', 'email_contacto', 'centroTrabajo'],
  searchPlaceholder: 'Buscar por nombre, correo o centro de trabajo',
  columns: [
    { key: 'nombreCompleto', label: 'Supervisor', secondaryKey: 'email_contacto' },
    { key: 'centroTrabajo', label: 'Centro de trabajo' },
    { key: 'telefono', label: 'Teléfono', format: 'mono', optional: true },
    { key: 'estado', label: 'Estado', format: 'status' },
  ],
  fields: [
    { key: 'nombre', label: 'Nombre(s)', type: 'text', required: true, autocomplete: 'given-name', placeholder: 'Ej. Mariana' },
    { key: 'apellido', label: 'Apellido(s)', type: 'text', required: true, autocomplete: 'family-name', placeholder: 'Ej. Cortés Vidal' },
    { key: 'email_contacto', label: 'Correo de contacto', type: 'email', required: true, wide: true, autocomplete: 'email', placeholder: 'nombre@empresa.mx' },
    { key: 'telefono', label: 'Teléfono', type: 'tel', required: true, autocomplete: 'tel', placeholder: '55 1234 5678' },
    { key: 'centroTrabajo', label: 'Centro de trabajo', type: 'select', required: true, options: CENTRO_TRABAJO_NOMBRES, defaultValue: CENTRO_TRABAJO_NOMBRES[0] },
    { key: 'estado', label: 'Estado', type: 'select', required: true, wide: true, options: SUPERVISOR_ESTADOS, defaultValue: 'Activo' },
  ],
  detailFields: [
    { key: 'nombre', label: 'Nombre(s)', section: 'Identidad' },
    { key: 'apellido', label: 'Apellido(s)', section: 'Identidad' },
    { key: 'fecha_creacion', label: 'Fecha de creación', format: 'date', section: 'Identidad' },
    { key: 'email_contacto', label: 'Correo de contacto', section: 'Contacto' },
    { key: 'telefono', label: 'Teléfono', section: 'Contacto' },
    { key: 'centroTrabajo', label: 'Centro de trabajo', section: 'Relación institucional' },
  ],
  normalizeRow: normalizeSupervisor,
  normalizeRowKey: 'supervisores',
  deriveRow: deriveSupervisor,
  deriveRowKey: 'supervisores',
  filters: [
    {
      key: 'centroTrabajo',
      label: 'Centro de trabajo',
      allLabel: 'Todos los centros',
      options: CENTRO_TRABAJO_NOMBRES,
      type: 'multi',
      searchable: true,
    },
  ],
  statusKey: 'estado',
  statusOptions: SUPERVISOR_ESTADOS,
  emptyTitle: 'Sin supervisores',
  emptyDescription: 'Registra al responsable del centro de trabajo para dar seguimiento.',
  createLabel: 'Nuevo supervisor',
};
