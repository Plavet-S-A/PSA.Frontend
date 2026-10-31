/**
 * Filas de ejemplo de vinculadores.
 *
 * Capa: lib/catalog
 * Personal administrativo de `administrador` con su usuario y datos de
 * contacto. El estado se proyecta desde `usuario.estado`.
 */

import type { ResourceRow } from '@/types/resource';

export const vinculadoresRows: readonly ResourceRow[] = [
  { id: 'vin-001', id_usuario: 501, nombre: 'Laura', apellido: 'Medina Soto', nombreCompleto: 'Laura Medina Soto', puesto: 'Coordinadora de vinculación', fecha_creacion: '2026-01-05', telefono: '55 5500 6101', email_contacto: 'laura.medina@universidad.mx', id_tenant: 1, estado: 'Activo' },
  { id: 'vin-002', id_usuario: 502, nombre: 'Rodrigo', apellido: 'Álvarez Peña', nombreCompleto: 'Rodrigo Álvarez Peña', puesto: 'Gestor de convenios', fecha_creacion: '2026-01-19', telefono: '55 5500 6102', email_contacto: 'rodrigo.alvarez@universidad.mx', id_tenant: 1, estado: 'Activo' },
  { id: 'vin-003', id_usuario: 503, nombre: 'Ximena', apellido: 'Rojas Lara', nombreCompleto: 'Ximena Rojas Lara', puesto: 'Enlace empresarial', fecha_creacion: '2026-02-07', telefono: '55 5500 6103', email_contacto: 'ximena.rojas@universidad.mx', id_tenant: 1, estado: 'Activo' },
  { id: 'vin-004', id_usuario: 504, nombre: 'Bruno', apellido: 'Estrada Nava', nombreCompleto: 'Bruno Estrada Nava', puesto: 'Analista de vinculación', fecha_creacion: '2026-02-23', telefono: '55 5500 6104', email_contacto: 'bruno.estrada@universidad.mx', id_tenant: 1, estado: 'Activo' },
  { id: 'vin-005', id_usuario: 505, nombre: 'Claudia', apellido: 'Fuentes Río', nombreCompleto: 'Claudia Fuentes Río', puesto: 'Gestora de prácticas', fecha_creacion: '2026-03-10', telefono: '55 5500 6105', email_contacto: 'claudia.fuentes@universidad.mx', id_tenant: 1, estado: 'Inactivo' },
  { id: 'vin-006', id_usuario: 506, nombre: 'Iván', apellido: 'Serrano Cano', nombreCompleto: 'Iván Serrano Cano', puesto: 'Enlace institucional', fecha_creacion: '2026-03-26', telefono: '55 5500 6106', email_contacto: 'ivan.serrano@universidad.mx', id_tenant: 1, estado: 'Activo' },
];
