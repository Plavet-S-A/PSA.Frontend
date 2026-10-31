/**
 * Filas de ejemplo de supervisores de centro de trabajo.
 *
 * Capa: lib/catalog
 * El supervisor pertenece a un `centro_trabajo`; no captura calificaciones en
 * esta interfaz, solo consulta la operación de su centro.
 */

import type { ResourceRow } from '@/types/resource';

export const supervisoresRows: readonly ResourceRow[] = [
  { id: 'sup-001', nombre: 'Mariana', apellido: 'Cortés Vidal', nombreCompleto: 'Mariana Cortés Vidal', fecha_creacion: '2026-01-18', id_centro_trabajo: 1, centroTrabajo: 'Grupo Aurora', estado: 'Activo', telefono: '55 4400 5101', email_contacto: 'mariana.cortes@grupoaurora.mx' },
  { id: 'sup-002', nombre: 'Luis Enrique', apellido: 'Pacheco', nombreCompleto: 'Luis Enrique Pacheco', fecha_creacion: '2026-01-25', id_centro_trabajo: 2, centroTrabajo: 'Tecnologías del Bajío', estado: 'Activo', telefono: '55 4400 5102', email_contacto: 'luis.pacheco@tecnologiasbajio.mx' },
  { id: 'sup-003', nombre: 'Diana', apellido: 'Robles Ibarra', nombreCompleto: 'Diana Robles Ibarra', fecha_creacion: '2026-02-09', id_centro_trabajo: 3, centroTrabajo: 'Logística del Norte', estado: 'Activo', telefono: '55 4400 5103', email_contacto: 'diana.robles@logisticanorte.mx' },
  { id: 'sup-004', nombre: 'Fernando', apellido: 'Rivera Cano', nombreCompleto: 'Fernando Rivera Cano', fecha_creacion: '2026-02-26', id_centro_trabajo: 4, centroTrabajo: 'Constructora Rivera', estado: 'Activo', telefono: '55 4400 5104', email_contacto: 'fernando.rivera@constructorarivera.mx' },
  { id: 'sup-005', nombre: 'Cecilia', apellido: 'Nava Arroyo', nombreCompleto: 'Cecilia Nava Arroyo', fecha_creacion: '2026-03-14', id_centro_trabajo: 5, centroTrabajo: 'Clínica San Ángel', estado: 'Activo', telefono: '55 4400 5105', email_contacto: 'cecilia.nava@clinicasanangel.mx' },
  { id: 'sup-006', nombre: 'Tomás', apellido: 'Esquivel Ríos', nombreCompleto: 'Tomás Esquivel Ríos', fecha_creacion: '2026-03-29', id_centro_trabajo: 6, centroTrabajo: 'Estudio Punto', estado: 'Inactivo', telefono: '55 4400 5106', email_contacto: 'tomas.esquivel@estudiopunto.mx' },
  { id: 'sup-007', nombre: 'Alejandra', apellido: 'Vega Soto', nombreCompleto: 'Alejandra Vega Soto', fecha_creacion: '2026-04-12', id_centro_trabajo: 7, centroTrabajo: 'Alimentos del Centro', estado: 'Activo', telefono: '55 4400 5107', email_contacto: 'alejandra.vega@alimentoscentro.mx' },
];
