/**
 * Filas de ejemplo de centros de trabajo.
 *
 * Capa: lib/catalog
 * Reflejan `centro_trabajo` con su dirección y usuario responsable resueltos.
 * `validacion`, `restriccion_edad` y `estado` son atributos de consulta: la
 * aprobación real pertenece al servidor.
 */

import type { ResourceRow } from '@/types/resource';

export const centrosTrabajoRows: readonly ResourceRow[] = [
  { id: 'cen-001', nombre: 'Grupo Aurora', id_direccion: 1, direccion: 'Av. Reforma 410, Cuauhtémoc, CDMX', estado: 'Activo', fecha_creacion: '2025-11-08', id_usuario: 201, usuario: 'aurora.vinculacion', validacion: 'Validado', restriccion_edad: 18, telefono: '55 4000 1101', email_contacto: 'vinculacion@grupoaurora.mx', id_tenant: 1 },
  { id: 'cen-002', nombre: 'Tecnologías del Bajío', id_direccion: 2, direccion: 'Blvd. Bernardo Quintana 220, Querétaro', estado: 'Activo', fecha_creacion: '2025-12-02', id_usuario: 202, usuario: 'bajio.talento', validacion: 'Validado', restriccion_edad: 18, telefono: '55 4000 1102', email_contacto: 'talento@tecnologiasbajio.mx', id_tenant: 1 },
  { id: 'cen-003', nombre: 'Logística del Norte', id_direccion: 3, direccion: 'Av. Constitución 850, Centro, Monterrey', estado: 'Activo', fecha_creacion: '2026-01-14', id_usuario: 203, usuario: 'logistica.norte', validacion: 'Validado', restriccion_edad: 20, telefono: '55 4000 1103', email_contacto: 'practicas@logisticanorte.mx', id_tenant: 1 },
  { id: 'cen-004', nombre: 'Constructora Rivera', id_direccion: 4, direccion: 'Calle Obreros 120, Guadalajara', estado: 'Prospecto', fecha_creacion: '2026-02-20', id_usuario: 204, usuario: 'rivera.obras', validacion: 'Pendiente', restriccion_edad: 21, telefono: '55 4000 1104', email_contacto: 'obras@constructorarivera.mx', id_tenant: 1 },
  { id: 'cen-005', nombre: 'Clínica San Ángel', id_direccion: 5, direccion: 'Av. Revolución 980, Álvaro Obregón, CDMX', estado: 'Activo', fecha_creacion: '2026-03-05', id_usuario: 205, usuario: 'sanangel.rrhh', validacion: 'Validado', restriccion_edad: 18, telefono: '55 4000 1105', email_contacto: 'rrhh@clinicasanangel.mx', id_tenant: 1 },
  { id: 'cen-006', nombre: 'Estudio Punto', id_direccion: 6, direccion: 'Calle Colima 55, Roma Norte, CDMX', estado: 'Activo', fecha_creacion: '2026-03-28', id_usuario: 206, usuario: 'punto.estudio', validacion: 'Validado', restriccion_edad: 0, telefono: '55 4000 1106', email_contacto: 'talento@estudiopunto.mx', id_tenant: 1 },
  { id: 'cen-007', nombre: 'Alimentos del Centro', id_direccion: 7, direccion: 'Calle 5 de Mayo 210, Centro, Puebla', estado: 'Inactivo', fecha_creacion: '2026-04-11', id_usuario: 207, usuario: 'alimentos.centro', validacion: 'Rechazado', restriccion_edad: 18, telefono: '55 4000 1107', email_contacto: 'contacto@alimentoscentro.mx', id_tenant: 1 },
];
