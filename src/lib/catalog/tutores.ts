/**
 * Catálogo de tutores académicos.
 *
 * Capa: lib/catalog
 * El tutor pertenece a un taller y conserva su usuario, puesto, dirección y
 * datos de contacto. La tabla usa una etiqueta compuesta nombre + apellido.
 */

import { TALLER_NOMBRES } from '@/lib/catalog/options';
import { normalizePersonName, personFullName } from '@/lib/catalog/person-name';
import { todayIsoDate } from '@/lib/format/date';
import { registerDerivers } from '@/lib/catalog/deriver-registry';
import type { ResourceConfig, ResourceRow } from '@/types/resource';

registerDerivers('tutores', {
  normalize: normalizeTutor,
  derive: deriveTutor,
});

export { tutoresRows } from '@/lib/catalog/tutores-rows';

const TUTOR_ESTADOS = ['Activo', 'Inactivo'] as const;

/**
 * Ajusta filas anteriores que usaban `correo` y `departamento`.
 *
 * @param row Fila recuperada de almacenamiento local.
 * @returns Fila con las llaves actuales del modelo.
 */
function normalizeTutor(row: ResourceRow): ResourceRow {
  return normalizePersonName({
    ...row,
    email_contacto: String(row.email_contacto ?? row.correo ?? ''),
    puesto: String(row.puesto ?? row.departamento ?? ''),
    taller: String(row.taller ?? TALLER_NOMBRES[0]),
    fecha_creacion: String(row.fecha_creacion ?? todayIsoDate()),
  });
}

/**
 * Calcula el nombre visible y las llaves de relación del tutor.
 *
 * @param values Valores editables del formulario.
 * @param current Fila original cuando se edita.
 * @returns Atributos derivados listos para persistir.
 */
function deriveTutor(
  values: Record<string, string | number>,
  current?: ResourceRow,
): Record<string, string | number> {
  const nombre = String(values.nombre ?? current?.nombre ?? '');
  const apellido = String(values.apellido ?? current?.apellido ?? '');
  const taller = String(values.taller ?? current?.taller ?? '');
  const index = TALLER_NOMBRES.indexOf(taller as (typeof TALLER_NOMBRES)[number]);
  return {
    nombreCompleto: personFullName(nombre, apellido),
    id_taller: index >= 0 ? index + 1 : current?.id_taller ?? '',
    id_usuario: current?.id_usuario ?? '',
    id_tenant: current?.id_tenant ?? 1,
    id_direccion: current?.id_direccion ?? '',
    fecha_creacion: String(values.fecha_creacion ?? current?.fecha_creacion ?? todayIsoDate()),
  };
}

export const tutoresConfig: ResourceConfig = {
  id: 'tutores',
  singular: 'tutor académico',
  plural: 'Tutores académicos',
  description:
    'Asigna tutores a los talleres y consulta su puesto, contacto y carga de relación.',
  primaryKey: 'nombreCompleto',
  searchKeys: ['nombreCompleto', 'nombre', 'apellido', 'email_contacto', 'puesto', 'taller'],
  searchPlaceholder: 'Buscar por nombre, correo, puesto o taller',
  columns: [
    { key: 'nombreCompleto', label: 'Tutor', secondaryKey: 'email_contacto' },
    { key: 'puesto', label: 'Puesto', optional: true },
    { key: 'taller', label: 'Taller' },
    { key: 'telefono', label: 'Teléfono', format: 'mono', optional: true },
    { key: 'estado', label: 'Estado', format: 'status' },
  ],
  fields: [
    { key: 'nombre', label: 'Nombre(s)', type: 'text', required: true, autocomplete: 'given-name', placeholder: 'Ej. Ricardo' },
    { key: 'apellido', label: 'Apellido(s)', type: 'text', required: true, autocomplete: 'family-name', placeholder: 'Ej. Salinas Méndez' },
    { key: 'email_contacto', label: 'Correo institucional', type: 'email', required: true, wide: true, autocomplete: 'email', placeholder: 'nombre@universidad.mx' },
    { key: 'telefono', label: 'Teléfono', type: 'tel', required: true, autocomplete: 'tel', placeholder: '55 1234 5678' },
    { key: 'puesto', label: 'Puesto', type: 'text', required: true, placeholder: 'Ej. Profesor de tiempo completo' },
    { key: 'taller', label: 'Taller asignado', type: 'select', required: true, options: TALLER_NOMBRES, defaultValue: TALLER_NOMBRES[0] },
    { key: 'direccion', label: 'Dirección', type: 'text', required: true, wide: true, placeholder: 'Calle, número, colonia, ciudad' },
    { key: 'estado', label: 'Estado', type: 'select', required: true, wide: true, options: TUTOR_ESTADOS, defaultValue: 'Activo' },
  ],
  detailFields: [
    { key: 'nombre', label: 'Nombre(s)', section: 'Identidad' },
    { key: 'apellido', label: 'Apellido(s)', section: 'Identidad' },
    { key: 'puesto', label: 'Puesto', section: 'Identidad' },
    { key: 'fecha_creacion', label: 'Fecha de creación', format: 'date', section: 'Identidad' },
    { key: 'email_contacto', label: 'Correo institucional', section: 'Contacto' },
    { key: 'telefono', label: 'Teléfono', section: 'Contacto' },
    { key: 'direccion', label: 'Dirección', section: 'Contacto' },
    { key: 'taller', label: 'Taller asignado', section: 'Relación académica' },
  ],
  normalizeRow: normalizeTutor,
  normalizeRowKey: 'tutores',
  deriveRow: deriveTutor,
  deriveRowKey: 'tutores',
  filters: [
    {
      key: 'taller',
      label: 'Taller',
      allLabel: 'Todos los talleres',
      options: TALLER_NOMBRES,
      type: 'multi',
      searchable: true,
    },
  ],
  statusKey: 'estado',
  statusOptions: TUTOR_ESTADOS,
  emptyTitle: 'Sin tutores académicos',
  emptyDescription: 'Agrega un tutor y relaciónalo con el taller que acompañará.',
  createLabel: 'Nuevo tutor académico',
};
