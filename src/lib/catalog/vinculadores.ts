/**
 * Catálogo de vinculadores.
 *
 * Capa: lib/catalog
 * Personal administrativo de `administrador`: conecta a la universidad con
 * empresas y conserva usuario, puesto y datos de contacto. `estado` se
 * proyecta desde `usuario.estado`.
 */

import { normalizePersonName, personFullName } from '@/lib/catalog/person-name';
import { todayIsoDate } from '@/lib/format/date';
import { registerDerivers } from '@/lib/catalog/deriver-registry';
import type { ResourceConfig, ResourceRow } from '@/types/resource';

registerDerivers('vinculadores', {
  normalize: normalizeVinculador,
  derive: deriveVinculador,
});

export { vinculadoresRows } from '@/lib/catalog/vinculadores-rows';

const VINCULADOR_ESTADOS = ['Activo', 'Inactivo'] as const;

/**
 * Ajusta filas anteriores que usaban `correo` e `institucion`.
 *
 * @param row Fila recuperada de almacenamiento local.
 * @returns Fila con las llaves actuales del modelo.
 */
function normalizeVinculador(row: ResourceRow): ResourceRow {
  return normalizePersonName({
    ...row,
    email_contacto: String(row.email_contacto ?? row.correo ?? ''),
    puesto: String(row.puesto ?? 'Vinculador institucional'),
    fecha_creacion: String(row.fecha_creacion ?? todayIsoDate()),
  });
}

/**
 * Calcula el nombre visible y las llaves de administrador.
 *
 * @param values Valores editables del formulario.
 * @param current Fila original cuando se edita.
 * @returns Atributos derivados listos para persistir.
 */
function deriveVinculador(
  values: Record<string, string | number>,
  current?: ResourceRow,
): Record<string, string | number> {
  const nombre = String(values.nombre ?? current?.nombre ?? '');
  const apellido = String(values.apellido ?? current?.apellido ?? '');
  return {
    nombreCompleto: personFullName(nombre, apellido),
    id_usuario: current?.id_usuario ?? '',
    id_tenant: current?.id_tenant ?? 1,
    fecha_creacion: String(values.fecha_creacion ?? current?.fecha_creacion ?? todayIsoDate()),
  };
}

export const vinculadoresConfig: ResourceConfig = {
  id: 'vinculadores',
  singular: 'vinculador',
  plural: 'Vinculadores',
  description:
    'Gestiona a quienes conectan a la universidad con empresas e instituciones.',
  primaryKey: 'nombreCompleto',
  searchKeys: ['nombreCompleto', 'nombre', 'apellido', 'email_contacto', 'puesto'],
  searchPlaceholder: 'Buscar por nombre, correo o puesto',
  columns: [
    { key: 'nombreCompleto', label: 'Vinculador', secondaryKey: 'email_contacto' },
    { key: 'puesto', label: 'Puesto', optional: true },
    { key: 'telefono', label: 'Teléfono', format: 'mono', optional: true },
    { key: 'estado', label: 'Estado', format: 'status' },
  ],
  fields: [
    { key: 'nombre', label: 'Nombre(s)', type: 'text', required: true, autocomplete: 'given-name', placeholder: 'Ej. Laura' },
    { key: 'apellido', label: 'Apellido(s)', type: 'text', required: true, autocomplete: 'family-name', placeholder: 'Ej. Medina Soto' },
    { key: 'email_contacto', label: 'Correo institucional', type: 'email', required: true, wide: true, autocomplete: 'email', placeholder: 'nombre@universidad.mx' },
    { key: 'telefono', label: 'Teléfono', type: 'tel', required: true, autocomplete: 'tel', placeholder: '55 1234 5678' },
    { key: 'puesto', label: 'Puesto', type: 'text', required: true, placeholder: 'Ej. Coordinadora de vinculación' },
    { key: 'estado', label: 'Estado', type: 'select', required: true, wide: true, options: VINCULADOR_ESTADOS, defaultValue: 'Activo' },
  ],
  detailFields: [
    { key: 'nombre', label: 'Nombre(s)', section: 'Identidad' },
    { key: 'apellido', label: 'Apellido(s)', section: 'Identidad' },
    { key: 'puesto', label: 'Puesto', section: 'Identidad' },
    { key: 'fecha_creacion', label: 'Fecha de creación', format: 'date', section: 'Identidad' },
    { key: 'email_contacto', label: 'Correo institucional', section: 'Contacto' },
    { key: 'telefono', label: 'Teléfono', section: 'Contacto' },
  ],
  normalizeRow: normalizeVinculador,
  normalizeRowKey: 'vinculadores',
  deriveRow: deriveVinculador,
  deriveRowKey: 'vinculadores',
  statusKey: 'estado',
  statusOptions: VINCULADOR_ESTADOS,
  emptyTitle: 'Sin vinculadores',
  emptyDescription: 'Agrega a la persona que dará seguimiento a convenios y empresas.',
  createLabel: 'Nuevo vinculador',
};
