/**
 * Catálogo de estudiantes.
 *
 * Capa: lib/catalog
 * La tabla y la ficha de detalle reflejan los atributos de `estudiante` y las
 * relaciones con usuario, dirección, taller, ciclo escolar y póliza. Las
 * etiquetas de relación se derivan y no se capturan a mano.
 */

import { normalizePersonName, personFullName } from '@/lib/catalog/person-name';
import { CICLO_NOMBRES, TALLER_NOMBRES } from '@/lib/catalog/options';
import { todayIsoDate } from '@/lib/format/date';
import { registerDerivers } from '@/lib/catalog/deriver-registry';
import type { ResourceConfig, ResourceRow } from '@/types/resource';

registerDerivers('estudiantes', {
  normalize: normalizePersonName,
  derive: deriveEstudiante,
});

export { estudiantesRows } from '@/lib/catalog/estudiantes-rows';

const ESTUDIANTE_ESTADOS = [
  'Activo',
  'En práctica',
  'En búsqueda',
  'Egresado',
  'Inactivo',
] as const;

/**
 * Calcula las llaves y etiquetas derivadas de un estudiante.
 *
 * @param values Valores editables del formulario.
 * @param current Fila original cuando se edita.
 * @returns Atributos de relación listos para persistir.
 */
function deriveEstudiante(
  values: Record<string, string | number>,
  current?: ResourceRow,
): Record<string, string | number> {
  const nombre = String(values.nombre ?? current?.nombre ?? '');
  const apellido = String(values.apellido ?? current?.apellido ?? '');
  const taller = String(values.taller ?? current?.taller ?? '');
  const ciclo = String(values.ciclo ?? current?.ciclo ?? '');
  const email = String(values.email_contacto ?? current?.email_contacto ?? '');
  const tallerIndex = TALLER_NOMBRES.indexOf(taller as (typeof TALLER_NOMBRES)[number]);
  const cicloIndex = CICLO_NOMBRES.indexOf(ciclo as (typeof CICLO_NOMBRES)[number]);

  return {
    nombreCompleto: personFullName(nombre, apellido),
    usuario: current?.usuario ?? email.split('@')[0] ?? '',
    id_taller: tallerIndex >= 0 ? tallerIndex + 1 : current?.id_taller ?? '',
    id_ciclo: cicloIndex >= 0 ? cicloIndex + 1 : current?.id_ciclo ?? '',
    id_usuario: current?.id_usuario ?? '',
    id_direccion: current?.id_direccion ?? '',
    id_poliza: current?.id_poliza ?? '',
    id_tenant: current?.id_tenant ?? 1,
    fecha_creacion: String(values.fecha_creacion ?? current?.fecha_creacion ?? todayIsoDate()),
  };
}

export const estudiantesConfig: ResourceConfig = {
  id: 'estudiantes',
  singular: 'estudiante',
  plural: 'Estudiantes',
  description:
    'Consulta la ficha académica, las horas de práctica y los vínculos de cada estudiante.',
  primaryKey: 'nombreCompleto',
  searchKeys: [
    'nombreCompleto',
    'nombre',
    'apellido',
    'email_contacto',
    'pasaporte',
    'taller',
    'ciclo',
  ],
  searchPlaceholder: 'Buscar por nombre, correo, pasaporte, taller o ciclo',
  columns: [
    { key: 'nombreCompleto', label: 'Estudiante', secondaryKey: 'email_contacto' },
    { key: 'taller', label: 'Taller', optional: true },
    {
      key: 'horas_pasantia_realizadas',
      label: 'Horas realizadas',
      format: 'number',
      align: 'right',
    },
    { key: 'fecha_inicio_pasantia', label: 'Inicio', format: 'mono', optional: true },
    { key: 'estado', label: 'Estado', format: 'status' },
  ],
  fields: [
    { key: 'nombre', label: 'Nombre(s)', type: 'text', required: true, autocomplete: 'given-name', placeholder: 'Ej. Ana Lucía' },
    { key: 'apellido', label: 'Apellido(s)', type: 'text', required: true, autocomplete: 'family-name', placeholder: 'Ej. Herrera' },
    { key: 'email_contacto', label: 'Correo de contacto', type: 'email', required: true, wide: true, autocomplete: 'email', placeholder: 'nombre@universidad.mx' },
    { key: 'telefono', label: 'Teléfono', type: 'tel', required: true, autocomplete: 'tel', placeholder: '55 1234 5678' },
    { key: 'fecha_nacimiento', label: 'Fecha de nacimiento', type: 'date', required: true },
    { key: 'nacionalidad', label: 'Nacionalidad', type: 'text', required: true, placeholder: 'Mexicana' },
    { key: 'sexo', label: 'Sexo', type: 'select', required: true, options: ['Femenino', 'Masculino', 'No binario', 'Prefiero no decir'], defaultValue: 'Femenino' },
    { key: 'pasaporte', label: 'Pasaporte o documento', type: 'text', required: true, placeholder: 'MEX-000000' },
    { key: 'direccion', label: 'Dirección', type: 'text', required: true, wide: true, placeholder: 'Calle, número, colonia, ciudad' },
    { key: 'taller', label: 'Taller asignado', type: 'select', required: true, options: TALLER_NOMBRES, defaultValue: TALLER_NOMBRES[0] },
    { key: 'ciclo', label: 'Ciclo escolar', type: 'select', required: true, options: CICLO_NOMBRES, defaultValue: CICLO_NOMBRES[1] },
    { key: 'poliza', label: 'Póliza', type: 'text', required: true, placeholder: 'PSA-2026-000' },
    { key: 'horas_pasantia_realizadas', label: 'Horas realizadas', type: 'number', required: true, min: 0, max: 2000, defaultValue: '0' },
    { key: 'fecha_inicio_pasantia', label: 'Inicio de práctica', type: 'date', required: true },
    { key: 'fecha_fin_pasantia', label: 'Fin de práctica', type: 'date', required: true },
    { key: 'estado', label: 'Estado', type: 'select', required: true, wide: true, options: ESTUDIANTE_ESTADOS, defaultValue: 'Activo' },
  ],
  detailFields: [
    { key: 'nombre', label: 'Nombre(s)', section: 'Identidad' },
    { key: 'apellido', label: 'Apellido(s)', section: 'Identidad' },
    { key: 'fecha_nacimiento', label: 'Fecha de nacimiento', format: 'date', section: 'Identidad' },
    { key: 'nacionalidad', label: 'Nacionalidad', section: 'Identidad' },
    { key: 'sexo', label: 'Sexo', section: 'Identidad' },
    { key: 'pasaporte', label: 'Pasaporte o documento', format: 'mono', section: 'Identidad' },
    { key: 'usuario', label: 'Usuario relacionado', format: 'mono', section: 'Identidad' },
    { key: 'email_contacto', label: 'Correo de contacto', section: 'Contacto' },
    { key: 'telefono', label: 'Teléfono', section: 'Contacto' },
    { key: 'direccion', label: 'Dirección', section: 'Contacto' },
    { key: 'taller', label: 'Taller', section: 'Práctica' },
    { key: 'ciclo', label: 'Ciclo escolar', section: 'Práctica' },
    { key: 'poliza', label: 'Póliza', format: 'mono', section: 'Práctica' },
    { key: 'horas_pasantia_realizadas', label: 'Horas realizadas', format: 'number', section: 'Práctica' },
    { key: 'fecha_inicio_pasantia', label: 'Inicio de práctica', format: 'date', section: 'Práctica' },
    { key: 'fecha_fin_pasantia', label: 'Fin de práctica', format: 'date', section: 'Práctica' },
    { key: 'fecha_creacion', label: 'Fecha de creación', format: 'date', section: 'Registro' },
  ],
  importConfig: {
    acceptedExtensions: ['csv', 'xlsx'],
    templateName: 'plantilla-estudiantes.csv',
    buttonLabel: 'Importar estudiantes',
    maxRows: 1000,
    uniqueKeys: ['email_contacto'],
    aliases: {
      nombre: ['nombres', 'primer nombre'],
      apellido: ['apellidos', 'apellido s'],
      email_contacto: ['correo', 'correo electrónico', 'email', 'e-mail'],
      telefono: ['celular', 'teléfono de contacto'],
      fecha_nacimiento: ['nacimiento', 'fecha de nacimiento'],
      sexo: ['género'],
      pasaporte: ['documento', 'número de documento', 'pasaporte o documento'],
      direccion: ['domicilio', 'dirección completa'],
      taller: ['taller asignado'],
      ciclo: ['ciclo escolar'],
      poliza: ['póliza de seguro', 'número de póliza'],
      horas_pasantia_realizadas: ['horas realizadas', 'horas de práctica'],
      fecha_inicio_pasantia: ['inicio de práctica', 'fecha de inicio', 'inicio'],
      fecha_fin_pasantia: ['fin de práctica', 'fecha de fin', 'fin'],
      estado: ['estatus'],
    },
  },
  normalizeRow: normalizePersonName,
  deriveRow: deriveEstudiante,
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
  statusOptions: ESTUDIANTE_ESTADOS,
  emptyTitle: 'Sin estudiantes registrados',
  emptyDescription: 'Agrega el primer estudiante para comenzar a dar seguimiento a sus prácticas.',
  createLabel: 'Nuevo estudiante',
};
