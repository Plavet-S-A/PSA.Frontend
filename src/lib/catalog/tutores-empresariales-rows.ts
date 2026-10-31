/**
 * Filas de ejemplo de tutores empresariales.
 *
 * Capa: lib/catalog
 * El modelo de referencia relaciona a este tutor con un `id_taller` y su
 * usuario; el centro de trabajo se deriva de la pasantía, no de la fila.
 */

import type { ResourceRow } from '@/types/resource';

export const tutoresEmpresarialesRows: readonly ResourceRow[] = [
  { id: 'tem-001', id_usuario: 401, id_tenant: 1, nombre: 'Mariana', apellido: 'Cortés Vidal', nombreCompleto: 'Mariana Cortés Vidal', id_taller: 1, taller: 'Taller de empleabilidad', fecha_creacion: '2026-01-20', id_direccion: 20, direccion: 'Av. Reforma 410, Cuauhtémoc, CDMX', telefono: '55 3300 4101', email_contacto: 'mariana.cortes@grupoaurora.mx', estado: 'Activo' },
  { id: 'tem-002', id_usuario: 402, id_tenant: 1, nombre: 'Luis Enrique', apellido: 'Pacheco', nombreCompleto: 'Luis Enrique Pacheco', id_taller: 4, taller: 'Herramientas de productividad', fecha_creacion: '2026-01-22', id_direccion: 21, direccion: 'Blvd. Bernardo Quintana 220, Querétaro', telefono: '55 3300 4102', email_contacto: 'luis.pacheco@tecnologiasbajio.mx', estado: 'Activo' },
  { id: 'tem-003', id_usuario: 403, id_tenant: 1, nombre: 'Diana', apellido: 'Robles Ibarra', nombreCompleto: 'Diana Robles Ibarra', id_taller: 3, taller: 'Comunicación efectiva en el trabajo', fecha_creacion: '2026-02-06', id_direccion: 22, direccion: 'Av. Constitución 850, Centro, Monterrey', telefono: '55 3300 4103', email_contacto: 'diana.robles@logisticanorte.mx', estado: 'Activo' },
  { id: 'tem-004', id_usuario: 404, id_tenant: 1, nombre: 'Fernando', apellido: 'Rivera Cano', nombreCompleto: 'Fernando Rivera Cano', id_taller: 7, taller: 'Seguridad y ética profesional', fecha_creacion: '2026-02-24', id_direccion: 23, direccion: 'Calle Obreros 120, Guadalajara', telefono: '55 3300 4104', email_contacto: 'fernando.rivera@constructorarivera.mx', estado: 'Activo' },
  { id: 'tem-005', id_usuario: 405, id_tenant: 1, nombre: 'Cecilia', apellido: 'Nava Arroyo', nombreCompleto: 'Cecilia Nava Arroyo', id_taller: 5, taller: 'Portafolio profesional', fecha_creacion: '2026-03-11', id_direccion: 24, direccion: 'Calle Colima 55, Roma Norte, CDMX', telefono: '55 3300 4105', email_contacto: 'cecilia.nava@estudiopunto.mx', estado: 'Activo' },
  { id: 'tem-006', id_usuario: 406, id_tenant: 1, nombre: 'Tomás', apellido: 'Esquivel Ríos', nombreCompleto: 'Tomás Esquivel Ríos', id_taller: 6, taller: 'Fundamentos contables para prácticas', fecha_creacion: '2026-03-27', id_direccion: 25, direccion: 'Calle 5 de Mayo 210, Centro, Puebla', telefono: '55 3300 4106', email_contacto: 'tomas.esquivel@alimentoscentro.mx', estado: 'Inactivo' },
  { id: 'tem-007', id_usuario: 407, id_tenant: 1, nombre: 'Alejandra', apellido: 'Vega Soto', nombreCompleto: 'Alejandra Vega Soto', id_taller: 2, taller: 'Inducción a la práctica profesional', fecha_creacion: '2026-04-09', id_direccion: 26, direccion: 'Av. Revolución 980, Álvaro Obregón, CDMX', telefono: '55 3300 4107', email_contacto: 'alejandra.vega@clinicasanangel.mx', estado: 'Activo' },
  { id: 'tem-008', id_usuario: 408, id_tenant: 1, nombre: 'Patricia', apellido: 'Solís Márquez', nombreCompleto: 'Patricia Solís Márquez', id_taller: 4, taller: 'Herramientas de productividad', fecha_creacion: '2026-10-28', id_direccion: 27, direccion: 'Blvd. Bernardo Quintana 220, Querétaro', telefono: '55 3300 4108', email_contacto: 'patricia.solis@tecnologiasbajio.mx', estado: 'Activo' },
];
