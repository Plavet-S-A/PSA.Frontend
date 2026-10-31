/**
 * Catálogo de documentación de estudiantes.
 *
 * Capa: lib/catalog
 * Modela `documento` con `id_estudiante`, tipo, estado y metadatos de
 * almacenamiento. La vista por estudiante reutiliza la misma configuración con
 * columnas más compactas.
 */

import {
  DOCUMENTO_ESTADOS,
  ESTUDIANTE_NOMBRES,
  TALLER_NOMBRES,
  TIPO_DOCUMENTO_OPCIONES,
} from '@/lib/catalog/options';
import { todayIsoDate } from '@/lib/format/date';
import { registerDerivers } from '@/lib/catalog/deriver-registry';
import type {
  ResourceConfig,
  ResourceDetailField,
  ResourceField,
  ResourceRow,
} from '@/types/resource';

registerDerivers('documentacion', {
  normalize: normalizeDocumento,
  derive: deriveDocumento,
});

export { documentacionRows } from '@/lib/catalog/documentacion-rows';

/**
 * Ajusta filas anteriores que usaban `fecha` y no tenían llaves de relación.
 *
 * @param row Fila recuperada de almacenamiento local.
 * @returns Fila con las llaves actuales del modelo.
 */
function normalizeDocumento(row: ResourceRow): ResourceRow {
  const estudiante = String(row.estudiante ?? '');
  const taller = String(row.taller ?? '');
  const studentIndex = ESTUDIANTE_NOMBRES.indexOf(
    estudiante as (typeof ESTUDIANTE_NOMBRES)[number],
  );
  const tallerIndex = TALLER_NOMBRES.indexOf(taller as (typeof TALLER_NOMBRES)[number]);
  return {
    ...row,
    id_estudiante: Number(row.id_estudiante ?? (studentIndex >= 0 ? studentIndex + 1 : 0)),
    id_taller: Number(row.id_taller ?? (tallerIndex >= 0 ? tallerIndex + 1 : 0)),
    fecha_creacion: String(row.fecha_creacion ?? row.fecha ?? todayIsoDate()),
    bucket: String(row.bucket ?? 'psa-documentos'),
    storage_path: String(row.storage_path ?? ''),
  };
}

/**
 * Calcula las relaciones y la fecha de registro del documento.
 *
 * @param values Valores editables del formulario.
 * @param current Fila original cuando se edita.
 * @returns Atributos derivados listos para persistir.
 */
function deriveDocumento(
  values: Record<string, string | number>,
  current?: ResourceRow,
): Record<string, string | number> {
  const estudiante = String(values.estudiante ?? current?.estudiante ?? '');
  const taller = String(values.taller ?? current?.taller ?? '');
  const studentIndex = ESTUDIANTE_NOMBRES.indexOf(
    estudiante as (typeof ESTUDIANTE_NOMBRES)[number],
  );
  const tallerIndex = TALLER_NOMBRES.indexOf(taller as (typeof TALLER_NOMBRES)[number]);
  return {
    id_estudiante: studentIndex >= 0 ? studentIndex + 1 : current?.id_estudiante ?? '',
    id_taller: tallerIndex >= 0 ? tallerIndex + 1 : current?.id_taller ?? '',
    fecha_creacion: String(values.fecha_creacion ?? current?.fecha_creacion ?? todayIsoDate()),
    bucket: current?.bucket ?? 'psa-documentos',
    storage_path: current?.storage_path ?? '',
  };
}

const documentacionFields: readonly ResourceField[] = [
  { key: 'tipo', label: 'Tipo de documento', type: 'select', required: true, wide: true, options: TIPO_DOCUMENTO_OPCIONES, defaultValue: TIPO_DOCUMENTO_OPCIONES[0] },
  { key: 'fecha_creacion', label: 'Fecha de registro', type: 'date', required: true },
  { key: 'estado', label: 'Estado', type: 'select', required: true, wide: true, options: DOCUMENTO_ESTADOS, defaultValue: 'Pendiente' },
];

const documentacionDetailFields: readonly ResourceDetailField[] = [
  { key: 'tipo', label: 'Tipo de documento', section: 'Documento' },
  { key: 'fecha_creacion', label: 'Fecha de registro', format: 'date', section: 'Documento' },
  { key: 'estado', label: 'Estado', format: 'status', section: 'Documento' },
  { key: 'revisor', label: 'Revisado por', section: 'Revisión', hideWhenEmpty: true },
  { key: 'fecha_revision', label: 'Fecha de revisión', format: 'date', section: 'Revisión', hideWhenEmpty: true },
  { key: 'bucket', label: 'Bucket de almacenamiento', format: 'mono', section: 'Almacenamiento', hideWhenEmpty: true },
  { key: 'storage_path', label: 'Ruta de referencia', format: 'mono', section: 'Almacenamiento', hideWhenEmpty: true },
  { key: 'estudiante', label: 'Estudiante', section: 'Relaciones' },
  { key: 'taller', label: 'Taller', section: 'Relaciones' },
];

export const documentacionConfig: ResourceConfig = {
  id: 'documentacion',
  singular: 'documento',
  plural: 'Documentación',
  description:
    'Organiza expedientes por taller y estudiante; consulta el tipo, estado y referencia de cada archivo.',
  primaryKey: 'tipo',
  searchKeys: ['estudiante', 'taller', 'tipo', 'estado', 'bucket'],
  searchPlaceholder: 'Buscar por estudiante, taller, tipo o estado',
  columns: [
    { key: 'tipo', label: 'Documento', secondaryKey: 'estudiante' },
    { key: 'taller', label: 'Taller', optional: true },
    { key: 'fecha_creacion', label: 'Registro', format: 'mono' },
    { key: 'estado', label: 'Estado', format: 'status' },
  ],
  fields: documentacionFields,
  detailFields: documentacionDetailFields,
  normalizeRow: normalizeDocumento,
  normalizeRowKey: 'documentacion',
  deriveRow: deriveDocumento,
  deriveRowKey: 'documentacion',
  statusKey: 'estado',
  statusOptions: DOCUMENTO_ESTADOS,
  emptyTitle: 'Sin documentos registrados',
  emptyDescription: 'El estudiante aún no tiene documentos en su expediente.',
  createLabel: 'Nuevo documento',
};

export const documentacionStudentConfig: ResourceConfig = {
  ...documentacionConfig,
  id: 'documentacion-estudiante',
  singular: 'documento',
  plural: 'Documentos del estudiante',
  description: 'Expediente documental del estudiante, con su estado y referencia de archivo.',
  primaryKey: 'tipo',
  searchKeys: ['tipo', 'estado'],
  searchPlaceholder: 'Buscar por tipo o estado',
  columns: [
    { key: 'tipo', label: 'Documento' },
    { key: 'fecha_creacion', label: 'Registro', format: 'mono' },
    { key: 'estado', label: 'Estado', format: 'status' },
  ],
  detailFields: documentacionDetailFields.filter(
    (field) => field.key !== 'estudiante' && field.key !== 'taller',
  ),
  emptyTitle: 'Sin documentos en el expediente',
  emptyDescription: 'El estudiante aún no tiene documentos en su expediente.',
  createLabel: 'Nuevo documento',
};
