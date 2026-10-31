/**
 * Filas de ejemplo del catálogo de usuarios.
 *
 * Capa: lib/catalog
 * Solo expone atributos de consulta de `usuario`: nunca contraseña, tokens,
 * hashes ni fechas de expiración de restablecimiento.
 */

import type { ResourceRow } from '@/types/resource';

export const usuariosRows: readonly ResourceRow[] = [
  { id: 'usr-001', nombre: 'Ana Lucía Herrera', username: '20260001', email: 'coordinador@psa.mx', id_rol: 1, rol: 'Coordinación', estado: 'Activo', fecha_creacion: '2026-01-05', id_tenant: 1, intentos_fallidos: 0, cuenta_bloqueada: 'No', ultimaActividad: '2026-10-27' },
  { id: 'usr-002', nombre: 'Ricardo Salinas', username: '20260002', email: 'tutor@psa.mx', id_rol: 3, rol: 'Tutor académico', estado: 'Activo', fecha_creacion: '2026-01-05', id_tenant: 1, intentos_fallidos: 0, cuenta_bloqueada: 'No', ultimaActividad: '2026-10-26' },
  { id: 'usr-003', nombre: 'Mariana Cortés', username: '20260003', email: 'supervisor@psa.mx', id_rol: 5, rol: 'Supervisor', estado: 'Activo', fecha_creacion: '2026-01-05', id_tenant: 1, intentos_fallidos: 0, cuenta_bloqueada: 'No', ultimaActividad: '2026-10-25' },
  { id: 'usr-004', nombre: 'Laura Medina', username: '20260004', email: 'vinculador@psa.mx', id_rol: 2, rol: 'Vinculador', estado: 'Activo', fecha_creacion: '2026-01-05', id_tenant: 1, intentos_fallidos: 0, cuenta_bloqueada: 'No', ultimaActividad: '2026-10-24' },
  { id: 'usr-005', nombre: 'Luis Enrique Pacheco', username: '20260005', email: 'tutor.empresarial@psa.mx', id_rol: 4, rol: 'Tutor empresarial', estado: 'Activo', fecha_creacion: '2026-01-05', id_tenant: 1, intentos_fallidos: 0, cuenta_bloqueada: 'No', ultimaActividad: '2026-10-23' },
  { id: 'usr-006', nombre: 'Natalia Fuentes', username: '20260006', email: 'natalia.fuentes@universidad.mx', id_rol: 3, rol: 'Tutor académico', estado: 'Suspendido', fecha_creacion: '2026-03-21', id_tenant: 1, intentos_fallidos: 5, cuenta_bloqueada: 'Sí', ultimaActividad: '2026-09-30' },
  { id: 'usr-007', nombre: 'Tomás Esquivel', username: '20260007', email: 'tomas.esquivel@alimentoscentro.mx', id_rol: 4, rol: 'Tutor empresarial', estado: 'Inactivo', fecha_creacion: '2026-03-27', id_tenant: 1, intentos_fallidos: 0, cuenta_bloqueada: 'No', ultimaActividad: '2026-09-18' },
  { id: 'usr-008', nombre: 'Claudia Fuentes', username: '20260008', email: 'claudia.fuentes@universidad.mx', id_rol: 2, rol: 'Vinculador', estado: 'Inactivo', fecha_creacion: '2026-03-10', id_tenant: 1, intentos_fallidos: 1, cuenta_bloqueada: 'No', ultimaActividad: '2026-08-12' },
  { id: 'usr-009', nombre: 'Alejandra Vega', username: '20260009', email: 'alejandra.vega@alimentoscentro.mx', id_rol: 5, rol: 'Supervisor', estado: 'Activo', fecha_creacion: '2026-04-12', id_tenant: 1, intentos_fallidos: 0, cuenta_bloqueada: 'No', ultimaActividad: '2026-10-20' },
  { id: 'usr-010', nombre: 'Camila Ortega Salas', username: '20260010', email: 'camila.ortega@universidad.mx', id_rol: 6, rol: 'Estudiante', estado: 'Activo', fecha_creacion: '2026-05-06', id_tenant: 1, intentos_fallidos: 0, cuenta_bloqueada: 'No', ultimaActividad: '2026-10-27' },
  { id: 'usr-011', nombre: 'Patricia Solís Márquez', username: '20260011', email: 'patricia.solis@tecnologiasbajio.mx', id_rol: 4, rol: 'Tutor empresarial', estado: 'Activo', fecha_creacion: '2026-10-28', id_tenant: 1, intentos_fallidos: 0, cuenta_bloqueada: 'No', ultimaActividad: '2026-10-29' },
];
