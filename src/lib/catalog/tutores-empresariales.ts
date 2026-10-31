/**
 * Catálogo de tutores empresariales.
 *
 * Capa: lib/catalog
 * El modelo relaciona a este tutor con un taller mediante `id_taller`; su
 * empresa se muestra como etiqueta derivada de la dirección o el dominio de
 * contacto para el filtro y no se edita en esta ficha.
 */

import { centrosTrabajoRows } from '@/lib/catalog/centros-trabajo-rows';
import { TALLER_NOMBRES } from '@/lib/catalog/options';
import { normalizePersonName, personFullName } from '@/lib/catalog/person-name';
import { todayIsoDate } from '@/lib/format/date';
import { registerDerivers } from '@/lib/catalog/deriver-registry';
import type { ResourceConfig, ResourceRow } from '@/types/resource';

registerDerivers('tutores-empresariales', {
  normalize: normalizeTutorEmpresarial,
  derive: deriveTutorEmpresarial,
});

export { tutoresEmpresarialesRows } from '@/lib/catalog/tutores-empresariales-rows';

const TUTOR_EMPRESARIAL_ESTADOS = ['Activo', 'Inactivo'] as const;

interface EmpresaTutor {
  nombre: string;
  direccion: string;
  dominio: string;
}

/** Normaliza texto para comparar direcciones y dominios sin distinguir mayúsculas. */
function normalizeText(value: string): string {
  return value.trim().toLocaleLowerCase('es-MX');
}

/** Obtiene el dominio de un correo; devuelve cadena vacía si no es válido. */
function emailDomain(value: string): string {
  return normalizeText(value).split('@')[1] ?? '';
}

/** Centros de trabajo que pueden resolver la empresa de un tutor. */
const EMPRESAS: readonly EmpresaTutor[] = centrosTrabajoRows.map((row) => ({
  nombre: String(row.nombre),
  direccion: normalizeText(String(row.direccion ?? '')),
  dominio: emailDomain(String(row.email_contacto ?? '')),
}));

/** Empresas disponibles para el filtro del catálogo. */
export const tutoresEmpresarialesEmpresas: readonly string[] = EMPRESAS.map(
  (empresa) => empresa.nombre,
).sort((a, b) => a.localeCompare(b, 'es-MX'));

/**
 * Resuelve el centro de trabajo por dominio de contacto y, si no coincide,
 * por dirección.
 *
 * @param record Fila o valores editables del tutor.
 * @returns Empresa encontrada o undefined cuando aún no hay coincidencia.
 */
function resolveEmpresa(record: Record<string, unknown>): EmpresaTutor | undefined {
  const direccion = normalizeText(String(record.direccion ?? ''));
  const dominio = emailDomain(String(record.email_contacto ?? ''));
  const byDomain = EMPRESAS.find(
    (empresa) => dominio !== '' && empresa.dominio === dominio,
  );
  if (byDomain) return byDomain;

  return EMPRESAS.find(
    (empresa) => direccion !== '' && empresa.direccion === direccion,
  );
}

/**
 * Agrega la empresa derivada a una fila del catálogo.
 *
 * @param row Fila del tutor empresarial.
 * @returns Copia con la empresa resuelta para el filtro y la tabla.
 */
export function withTutorEmpresarialEmpresa(row: ResourceRow): ResourceRow {
  const empresa = resolveEmpresa(row);
  return {
    ...row,
    empresa: empresa?.nombre ?? String(row.empresa ?? ''),
  };
}

/**
 * Ajusta filas anteriores que usaban `correo` y `empresa`.
 *
 * @param row Fila recuperada de almacenamiento local.
 * @returns Fila con las llaves actuales del modelo.
 */
function normalizeTutorEmpresarial(row: ResourceRow): ResourceRow {
  return withTutorEmpresarialEmpresa(
    normalizePersonName({
      ...row,
      email_contacto: String(row.email_contacto ?? row.correo ?? ''),
      taller: String(row.taller ?? TALLER_NOMBRES[0]),
      fecha_creacion: String(row.fecha_creacion ?? todayIsoDate()),
    }),
  );
}

/**
 * Calcula el nombre visible y la llave del taller.
 *
 * @param values Valores editables del formulario.
 * @param current Fila original cuando se edita.
 * @returns Atributos derivados listos para persistir.
 */
function deriveTutorEmpresarial(
  values: Record<string, string | number>,
  current?: ResourceRow,
): Record<string, string | number> {
  const nombre = String(values.nombre ?? current?.nombre ?? '');
  const apellido = String(values.apellido ?? current?.apellido ?? '');
  const taller = String(values.taller ?? current?.taller ?? '');
  const index = TALLER_NOMBRES.indexOf(taller as (typeof TALLER_NOMBRES)[number]);
  const empresa = resolveEmpresa({ ...current, ...values });
  return {
    nombreCompleto: personFullName(nombre, apellido),
    id_taller: index >= 0 ? index + 1 : current?.id_taller ?? '',
    id_usuario: current?.id_usuario ?? '',
    id_tenant: current?.id_tenant ?? 1,
    id_direccion: current?.id_direccion ?? '',
    empresa: empresa?.nombre ?? current?.empresa ?? '',
    fecha_creacion: String(values.fecha_creacion ?? current?.fecha_creacion ?? todayIsoDate()),
  };
}

export const tutoresEmpresarialesConfig: ResourceConfig = {
  id: 'tutores-empresariales',
  singular: 'tutor empresarial',
  plural: 'Tutores empresariales',
  description:
    'Da seguimiento a los tutores del taller que acompañan la práctica desde la empresa.',
  primaryKey: 'nombreCompleto',
  searchKeys: ['nombreCompleto', 'nombre', 'apellido', 'email_contacto', 'empresa', 'taller'],
  searchPlaceholder: 'Buscar por nombre, correo, empresa o taller',
  columns: [
    { key: 'nombreCompleto', label: 'Tutor empresarial', secondaryKey: 'email_contacto' },
    { key: 'empresa', label: 'Empresa' },
    { key: 'taller', label: 'Taller' },
    { key: 'telefono', label: 'Teléfono', format: 'mono', optional: true },
    { key: 'estado', label: 'Estado', format: 'status' },
  ],
  fields: [
    { key: 'nombre', label: 'Nombre(s)', type: 'text', required: true, autocomplete: 'given-name', placeholder: 'Ej. Mariana' },
    { key: 'apellido', label: 'Apellido(s)', type: 'text', required: true, autocomplete: 'family-name', placeholder: 'Ej. Cortés Vidal' },
    { key: 'email_contacto', label: 'Correo de contacto', type: 'email', required: true, wide: true, autocomplete: 'email', placeholder: 'nombre@empresa.mx' },
    { key: 'telefono', label: 'Teléfono', type: 'tel', required: true, autocomplete: 'tel', placeholder: '55 1234 5678' },
    { key: 'taller', label: 'Taller asignado', type: 'select', required: true, options: TALLER_NOMBRES, defaultValue: TALLER_NOMBRES[0] },
    { key: 'direccion', label: 'Dirección', type: 'text', required: true, wide: true, placeholder: 'Calle, número, colonia, ciudad' },
    { key: 'estado', label: 'Estado', type: 'select', required: true, wide: true, options: TUTOR_EMPRESARIAL_ESTADOS, defaultValue: 'Activo' },
  ],
  detailFields: [
    { key: 'nombre', label: 'Nombre(s)', section: 'Identidad' },
    { key: 'apellido', label: 'Apellido(s)', section: 'Identidad' },
    { key: 'fecha_creacion', label: 'Fecha de creación', format: 'date', section: 'Identidad' },
    { key: 'email_contacto', label: 'Correo de contacto', section: 'Contacto' },
    { key: 'telefono', label: 'Teléfono', section: 'Contacto' },
    { key: 'direccion', label: 'Dirección', section: 'Contacto' },
    { key: 'empresa', label: 'Empresa', section: 'Relación académica' },
    { key: 'taller', label: 'Taller asignado', section: 'Relación académica' },
  ],
  normalizeRow: normalizeTutorEmpresarial,
  normalizeRowKey: 'tutores-empresariales',
  deriveRow: deriveTutorEmpresarial,
  deriveRowKey: 'tutores-empresariales',
  filters: [
    {
      key: 'empresa',
      label: 'Empresa',
      allLabel: 'Todas las empresas',
      options: tutoresEmpresarialesEmpresas,
      type: 'multi',
      searchable: true,
    },
  ],
  statusKey: 'estado',
  statusOptions: TUTOR_EMPRESARIAL_ESTADOS,
  emptyTitle: 'Sin tutores empresariales',
  emptyDescription: 'Agrega al tutor que acompañará la práctica desde la empresa.',
  createLabel: 'Nuevo tutor empresarial',
};
