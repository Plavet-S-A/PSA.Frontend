/**
 * Catálogo de usuarios.
 *
 * Capa: lib/catalog
 * Expone únicamente atributos de consulta de `usuario`: credencial, correo,
 * rol, estado y controles de acceso. Nunca incluye contraseña, tokens, hashes
 * ni fechas de expiración de restablecimiento.
 */

import { CUENTA_BLOQUEADA_OPCIONES, USUARIO_ROLES } from '@/lib/catalog/options';
import { todayIsoDate } from '@/lib/format/date';
import { registerDerivers } from '@/lib/catalog/deriver-registry';
import type { ResourceConfig, ResourceRow } from '@/types/resource';

registerDerivers('usuarios', {
  normalize: normalizeUsuario,
  derive: deriveUsuario,
});

export { usuariosRows } from '@/lib/catalog/usuarios-rows';

const USUARIO_ESTADOS = ['Activo', 'Invitación pendiente', 'Suspendido', 'Inactivo'] as const;

/**
 * Ajusta filas anteriores que usaban `correo` y `ultimoAcceso`.
 *
 * @param row Fila recuperada de almacenamiento local.
 * @returns Fila con las llaves actuales del modelo.
 */
function normalizeUsuario(row: ResourceRow): ResourceRow {
  const email = String(row.email ?? row.correo ?? '');
  const rol = String(row.rol ?? 'Coordinación');
  const index = USUARIO_ROLES.indexOf(rol as (typeof USUARIO_ROLES)[number]);
  const nombre = String(row.nombre ?? '').trim();
  return {
    ...row,
    nombre: nombre || email.split('@')[0] || String(row.username ?? ''),
    username: String(row.username ?? email.split('@')[0] ?? ''),
    email,
    rol,
    id_rol: Number(row.id_rol ?? (index >= 0 ? index + 1 : 1)),
    estado: String(row.estado ?? 'Activo'),
    cuenta_bloqueada: String(
      row.cuenta_bloqueada ?? (row.estado === 'Suspendido' ? 'Sí' : 'No'),
    ),
    intentos_fallidos: Number(row.intentos_fallidos ?? 0),
    fecha_creacion: String(row.fecha_creacion ?? todayIsoDate()),
    ultimaActividad: String(row.ultimaActividad ?? row.ultimoAcceso ?? ''),
    id_tenant: Number(row.id_tenant ?? 1),
  };
}

/**
 * Calcula el rol y la fecha de creación del usuario.
 *
 * @param values Valores editables del formulario.
 * @param current Fila original cuando se edita.
 * @returns Atributos derivados listos para persistir.
 */
function deriveUsuario(
  values: Record<string, string | number>,
  current?: ResourceRow,
): Record<string, string | number> {
  const rol = String(values.rol ?? current?.rol ?? '');
  const index = USUARIO_ROLES.indexOf(rol as (typeof USUARIO_ROLES)[number]);
  return {
    id_rol: index >= 0 ? index + 1 : current?.id_rol ?? '',
    id_tenant: current?.id_tenant ?? 1,
    fecha_creacion: String(values.fecha_creacion ?? current?.fecha_creacion ?? todayIsoDate()),
    ultimaActividad: current?.ultimaActividad ?? '',
  };
}

export const usuariosConfig: ResourceConfig = {
  id: 'usuarios',
  singular: 'usuario',
  plural: 'Usuarios',
  description:
    'Consulta credenciales, roles y estado de acceso sin exponer secretos de autenticación.',
  primaryKey: 'username',
  searchKeys: ['nombre', 'username', 'email', 'rol', 'estado'],
  searchPlaceholder: 'Buscar por nombre, credencial, correo, rol o estado',
  columns: [
    { key: 'nombre', label: 'Nombre', secondaryKey: 'username' },
    { key: 'email', label: 'Correo', optional: true },
    { key: 'rol', label: 'Rol', optional: true },
    { key: 'estado', label: 'Estado', format: 'status' },
    { key: 'cuenta_bloqueada', label: 'Bloqueada', optional: true },
    { key: 'intentos_fallidos', label: 'Intentos', format: 'number', align: 'right', optional: true },
  ],
  fields: [
    { key: 'nombre', label: 'Nombre completo', type: 'text', required: true, wide: true, autocomplete: 'name', placeholder: 'Ana Lucía Herrera' },
    { key: 'username', label: 'Credencial numérica', type: 'text', required: true, autocomplete: 'username', placeholder: '20260001' },
    { key: 'email', label: 'Correo', type: 'email', required: true, wide: true, autocomplete: 'email', placeholder: 'usuario@psa.mx' },
    { key: 'rol', label: 'Rol', type: 'select', required: true, options: USUARIO_ROLES, defaultValue: USUARIO_ROLES[0] },
    { key: 'estado', label: 'Estado', type: 'select', required: true, options: USUARIO_ESTADOS, defaultValue: 'Activo' },
    { key: 'cuenta_bloqueada', label: 'Cuenta bloqueada', type: 'select', required: true, options: CUENTA_BLOQUEADA_OPCIONES, defaultValue: 'No' },
    { key: 'intentos_fallidos', label: 'Intentos fallidos', type: 'number', required: true, min: 0, max: 20, defaultValue: '0' },
  ],
  detailFields: [
    { key: 'nombre', label: 'Nombre completo', section: 'Cuenta' },
    { key: 'username', label: 'Credencial numérica', format: 'mono', section: 'Cuenta' },
    { key: 'email', label: 'Correo', section: 'Cuenta' },
    { key: 'rol', label: 'Rol', section: 'Cuenta' },
    { key: 'estado', label: 'Estado', format: 'status', section: 'Seguridad' },
    { key: 'cuenta_bloqueada', label: 'Cuenta bloqueada', section: 'Seguridad' },
    { key: 'intentos_fallidos', label: 'Intentos fallidos', format: 'number', section: 'Seguridad' },
    { key: 'fecha_creacion', label: 'Fecha de creación', format: 'date', section: 'Registro' },
    { key: 'ultimaActividad', label: 'Última actividad', format: 'date', section: 'Registro', hideWhenEmpty: true },
  ],
  normalizeRow: normalizeUsuario,
  normalizeRowKey: 'usuarios',
  deriveRow: deriveUsuario,
  deriveRowKey: 'usuarios',
  filters: [
    {
      key: 'rol',
      label: 'Rol',
      allLabel: 'Todos los roles',
      options: USUARIO_ROLES,
      type: 'multi',
    },
    {
      key: 'cuenta_bloqueada',
      label: 'Cuenta bloqueada',
      allLabel: 'Bloqueadas y desbloqueadas',
      options: ['Sí', 'No'],
      type: 'boolean',
    },
  ],
  statusKey: 'estado',
  statusOptions: USUARIO_ESTADOS,
  emptyTitle: 'Sin usuarios',
  emptyDescription: 'Crea la primera cuenta operativa para acceder a la plataforma.',
  createLabel: 'Nuevo usuario',
};
