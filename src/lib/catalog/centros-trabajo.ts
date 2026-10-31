/**
 * Catálogo de centros de trabajo.
 *
 * Capa: lib/catalog
 * Expone `centro_trabajo`, su dirección, usuario responsable, validación y
 * restricción de edad. La aprobación del centro se representa como dato de
 * consulta; la interfaz no la ejecuta.
 */

import { VALIDACION_OPCIONES } from '@/lib/catalog/options';
import { todayIsoDate } from '@/lib/format/date';
import { registerDerivers } from '@/lib/catalog/deriver-registry';
import type { ResourceConfig, ResourceRow } from '@/types/resource';

registerDerivers('centros-trabajo', {
  normalize: normalizeCentro,
  derive: deriveCentro,
});

export { centrosTrabajoRows } from '@/lib/catalog/centros-trabajo-rows';

const CENTRO_ESTADOS = ['Activo', 'Prospecto', 'Inactivo'] as const;

/**
 * Ajusta filas anteriores que usaban `razonSocial` y `correo`.
 *
 * @param row Fila recuperada de almacenamiento local.
 * @returns Fila con las llaves actuales del modelo.
 */
function normalizeCentro(row: ResourceRow): ResourceRow {
  return {
    ...row,
    nombre: String(row.nombre ?? row.razonSocial ?? ''),
    email_contacto: String(row.email_contacto ?? row.correo ?? ''),
    validacion: String(
      row.validacion ?? (row.estado === 'Activo' ? 'Validado' : 'Pendiente'),
    ),
    restriccion_edad: Number(row.restriccion_edad ?? 18),
    fecha_creacion: String(row.fecha_creacion ?? todayIsoDate()),
  };
}

/**
 * Calcula referencias y fecha de creación de un centro.
 *
 * @param values Valores editables del formulario.
 * @param current Fila original cuando se edita.
 * @returns Atributos de relación listos para persistir.
 */
function deriveCentro(
  values: Record<string, string | number>,
  current?: ResourceRow,
): Record<string, string | number> {
  return {
    id_direccion: current?.id_direccion ?? '',
    id_usuario: current?.id_usuario ?? '',
    id_tenant: current?.id_tenant ?? 1,
    fecha_creacion: String(values.fecha_creacion ?? current?.fecha_creacion ?? todayIsoDate()),
  };
}

export const centrosTrabajoConfig: ResourceConfig = {
  id: 'centros-trabajo',
  singular: 'centro de trabajo',
  plural: 'Centros de trabajo',
  description:
    'Consulta la validación, las restricciones de edad y el contacto de cada empresa.',
  primaryKey: 'nombre',
  searchKeys: ['nombre', 'email_contacto', 'telefono', 'validacion', 'direccion'],
  searchPlaceholder: 'Buscar por empresa, correo, teléfono o validación',
  columns: [
    { key: 'nombre', label: 'Centro de trabajo', secondaryKey: 'email_contacto' },
    { key: 'validacion', label: 'Validación', format: 'status' },
    { key: 'restriccion_edad', label: 'Edad mínima', format: 'number', align: 'right' },
    { key: 'telefono', label: 'Teléfono', format: 'mono', optional: true },
    { key: 'estado', label: 'Estado', format: 'status' },
  ],
  fields: [
    { key: 'nombre', label: 'Nombre del centro', type: 'text', required: true, wide: true, placeholder: 'Ej. Grupo Aurora' },
    { key: 'email_contacto', label: 'Correo de contacto', type: 'email', required: true, wide: true, autocomplete: 'email', placeholder: 'contacto@empresa.mx' },
    { key: 'telefono', label: 'Teléfono', type: 'tel', required: true, autocomplete: 'tel', placeholder: '55 1234 5678' },
    { key: 'direccion', label: 'Dirección', type: 'text', required: true, wide: true, placeholder: 'Calle, número, colonia, ciudad' },
    { key: 'validacion', label: 'Validación', type: 'select', required: true, options: VALIDACION_OPCIONES, defaultValue: 'Pendiente' },
    { key: 'restriccion_edad', label: 'Edad mínima permitida', type: 'number', required: true, min: 0, max: 99, defaultValue: '18', hint: 'Usa 0 cuando el centro no exige mayoría de edad.' },
    { key: 'estado', label: 'Estado', type: 'select', required: true, wide: true, options: CENTRO_ESTADOS, defaultValue: 'Activo' },
  ],
  detailFields: [
    { key: 'nombre', label: 'Nombre del centro', section: 'Identificación' },
    { key: 'validacion', label: 'Validación', format: 'status', section: 'Identificación' },
    { key: 'restriccion_edad', label: 'Edad mínima permitida', format: 'number', section: 'Identificación' },
    { key: 'fecha_creacion', label: 'Fecha de creación', format: 'date', section: 'Identificación' },
    { key: 'email_contacto', label: 'Correo de contacto', section: 'Contacto' },
    { key: 'telefono', label: 'Teléfono', section: 'Contacto' },
    { key: 'direccion', label: 'Dirección', section: 'Contacto' },
    { key: 'usuario', label: 'Usuario responsable', format: 'mono', section: 'Contacto', hideWhenEmpty: true },
  ],
  normalizeRow: normalizeCentro,
  normalizeRowKey: 'centros-trabajo',
  deriveRow: deriveCentro,
  deriveRowKey: 'centros-trabajo',
  filters: [
    {
      key: 'restriccion_edad',
      label: 'Restricción de edad',
      allLabel: 'Con y sin restricción',
      options: ['Sí', 'No'],
      type: 'boolean',
    },
  ],
  statusKey: 'estado',
  statusOptions: CENTRO_ESTADOS,
  emptyTitle: 'Sin centros de trabajo',
  emptyDescription: 'Registra la primera empresa para abrir plazas de práctica.',
  createLabel: 'Nuevo centro de trabajo',
};
