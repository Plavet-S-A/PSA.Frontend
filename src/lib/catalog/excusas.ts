/**
 * Catálogo de excusas de pasantía.
 *
 * Capa: lib/catalog
 * Permite a los estudiantes enviar excusas (ausencias, retrasos,
 * problemas de documentación) dirigidas al tutor académico y al tutor
 * empresarial. Los tutores pueden consultar y dar seguimiento a las
 * excusas recibidas.
 */

import { TIPO_EXCUSA_OPCIONES } from '@/lib/catalog/options';
import { todayIsoDate } from '@/lib/format/date';
import { registerDerivers } from '@/lib/catalog/deriver-registry';
import type { ResourceConfig, ResourceRow } from '@/types/resource';

registerDerivers('excusas', {
  derive: deriveExcusa,
});

export { excusasRows } from '@/lib/catalog/excusas-rows';

/** Estados por los que pasa una excusa. */
export const EXCUSA_ESTADOS = ['Pendiente', 'Aceptada', 'Rechazada'] as const;

/**
 * Calcula las etiquetas derivadas de una excusa.
 *
 * @param values Valores editables del formulario.
 * @param current Fila original cuando se edita.
 * @returns Atributos derivados listos para persistir.
 */
function deriveExcusa(
  values: Record<string, string | number>,
  current?: ResourceRow,
): Record<string, string | number> {
  return {
    fecha_creacion: String(values.fecha_creacion ?? current?.fecha_creacion ?? todayIsoDate()),
    estado: String(values.estado ?? current?.estado ?? 'Pendiente'),
  };
}

export const excusasConfig: ResourceConfig = {
  id: 'excusas',
  singular: 'excusa',
  plural: 'Excusas',
  description:
    'Envía y consulta excusas de pasantía dirigidas a tutores académicos y empresariales.',
  primaryKey: 'estudiante',
  searchKeys: ['estudiante', 'tutor', 'tipo', 'estado'],
  searchPlaceholder: 'Buscar por estudiante, tutor o tipo de excusa',
  columns: [
    { key: 'estudiante', label: 'Estudiante', secondaryKey: 'tutor' },
    { key: 'tipo', label: 'Tipo', optional: true },
    { key: 'fecha', label: 'Fecha', format: 'mono', optional: true },
    { key: 'estado', label: 'Estado', format: 'status' },
  ],
  fields: [
    { key: 'estudiante', label: 'Estudiante', type: 'text', required: true, wide: true, placeholder: 'Nombre completo del estudiante' },
    { key: 'tutor', label: 'Tutor destino', type: 'select', required: true, options: ['Tutor académico', 'Tutor empresarial'], placeholder: 'Selecciona el tutor' },
    { key: 'tipo', label: 'Tipo de excusa', type: 'select', required: true, options: TIPO_EXCUSA_OPCIONES, placeholder: 'Selecciona el tipo' },
    { key: 'fecha', label: 'Fecha del hecho', type: 'date', required: true },
    { key: 'descripcion', label: 'Descripción', type: 'textarea', required: true, wide: true, rows: 4, placeholder: 'Explica los motivos de la excusa' },
    { key: 'estado', label: 'Estado', type: 'select', required: true, options: EXCUSA_ESTADOS, defaultValue: 'Pendiente', wide: true },
  ],
  detailFields: [
    { key: 'estudiante', label: 'Estudiante', section: 'Identidad' },
    { key: 'tutor', label: 'Tutor destino', section: 'Identidad' },
    { key: 'tipo', label: 'Tipo de excusa', section: 'Identidad' },
    { key: 'fecha', label: 'Fecha del hecho', format: 'date', section: 'Identidad' },
    { key: 'descripcion', label: 'Descripción', section: 'Detalle', hideWhenEmpty: true },
    { key: 'estado', label: 'Estado', format: 'status', section: 'Registro' },
    { key: 'fecha_creacion', label: 'Fecha de creación', format: 'date', section: 'Registro' },
    { key: 'revisado_por', label: 'Revisado por', section: 'Registro', hideWhenEmpty: true },
    { key: 'fecha_revision', label: 'Fecha de revisión', format: 'date', section: 'Registro', hideWhenEmpty: true },
  ],
  normalizeRow: undefined,
  normalizeRowKey: 'excusas',
  deriveRow: deriveExcusa,
  deriveRowKey: 'excusas',
  statusKey: 'estado',
  statusOptions: EXCUSA_ESTADOS,
  emptyTitle: 'Sin excusas registradas',
  emptyDescription: 'Envía la primera excusa para dar seguimiento a ausencias o incidencias.',
  createLabel: 'Nueva excusa',
};

/**
 * Formulario del estudiante: solo captura el motivo, no el estado.
 *
 * Comparte el identificador de persistencia con `excusasConfig` para que la
 * revisión del tutor vea de inmediato las excusas enviadas.
 */
export const excusasEstudianteConfig: ResourceConfig = {
  id: 'excusas',
  singular: 'excusa',
  plural: 'Excusas',
  description:
    'Envía una excusa a tu tutor académico o empresarial y consulta su respuesta.',
  primaryKey: 'tipo',
  searchKeys: ['tipo', 'tutor', 'estado'],
  searchPlaceholder: 'Buscar por tipo o tutor',
  columns: [
    { key: 'tipo', label: 'Tipo', secondaryKey: 'tutor' },
    { key: 'fecha', label: 'Fecha', format: 'mono' },
    { key: 'estado', label: 'Estado', format: 'status' },
  ],
  fields: [
    {
      key: 'tutor',
      label: 'Dirigida a',
      type: 'select',
      required: true,
      options: ['Tutor académico', 'Tutor empresarial'],
    },
    {
      key: 'tipo',
      label: 'Tipo de excusa',
      type: 'select',
      required: true,
      options: TIPO_EXCUSA_OPCIONES,
    },
    {
      key: 'fecha',
      label: 'Fecha del hecho',
      type: 'date',
      required: true,
      defaultValue: todayIsoDate(),
    },
    {
      key: 'descripcion',
      label: 'Descripción',
      type: 'textarea',
      required: true,
      wide: true,
      rows: 4,
      placeholder: 'Explica los motivos. Si aplica, menciona el comprobante que entregarás.',
      hint: 'Tu tutor recibirá la excusa y podrá aceptarla o rechazarla.',
    },
  ],
  detailFields: [
    { key: 'tipo', label: 'Tipo de excusa', section: 'Detalle' },
    { key: 'tutor', label: 'Dirigida a', section: 'Detalle' },
    { key: 'fecha', label: 'Fecha del hecho', format: 'date', section: 'Detalle' },
    { key: 'descripcion', label: 'Descripción', section: 'Detalle' },
    { key: 'estado', label: 'Estado', format: 'status', section: 'Registro' },
    { key: 'fecha_creacion', label: 'Fecha de envío', format: 'date', section: 'Registro' },
    { key: 'revisado_por', label: 'Revisado por', section: 'Registro', hideWhenEmpty: true },
    { key: 'fecha_revision', label: 'Fecha de respuesta', format: 'date', section: 'Registro', hideWhenEmpty: true },
  ],
  deriveRow: deriveExcusa,
  deriveRowKey: 'excusas',
  statusKey: 'estado',
  statusOptions: EXCUSA_ESTADOS,
  emptyTitle: 'Aún no has enviado excusas',
  emptyDescription:
    'Cuando tengas una ausencia, retraso o incidencia, envíala aquí para que tu tutor la revise.',
  createLabel: 'Enviar excusa',
};
