/**
 * Filas de ejemplo de tutores académicos.
 *
 * Capa: lib/catalog
 * Cada tutor se relaciona con un taller mediante `id_taller`; el nombre del
 * taller, el puesto y la dirección se muestran resueltos para la interfaz.
 */

import type { ResourceRow } from '@/types/resource';

export const tutoresRows: readonly ResourceRow[] = [
  { id: 'tut-001', id_usuario: 301, id_tenant: 1, nombre: 'Ricardo', apellido: 'Salinas Méndez', nombreCompleto: 'Ricardo Salinas Méndez', puesto: 'Profesor de tiempo completo', id_taller: 1, taller: 'Taller de empleabilidad', telefono: '55 2200 3101', email_contacto: 'ricardo.salinas@universidad.mx', id_direccion: 10, direccion: 'Av. Universidad 1200, Coyoacán, CDMX', estado: 'Activo', fecha_creacion: '2026-01-08' },
  { id: 'tut-002', id_usuario: 302, id_tenant: 1, nombre: 'Paola', apellido: 'Ríos Valdez', nombreCompleto: 'Paola Ríos Valdez', puesto: 'Coordinadora académica', id_taller: 2, taller: 'Inducción a la práctica profesional', telefono: '55 2200 3102', email_contacto: 'paola.rios@universidad.mx', id_direccion: 11, direccion: 'Calle Hidalgo 45, Centro, Querétaro', estado: 'Activo', fecha_creacion: '2026-01-12' },
  { id: 'tut-003', id_usuario: 303, id_tenant: 1, nombre: 'Héctor', apellido: 'Cárdenas Lozano', nombreCompleto: 'Héctor Cárdenas Lozano', puesto: 'Profesor asociado', id_taller: 3, taller: 'Comunicación efectiva en el trabajo', telefono: '55 2200 3103', email_contacto: 'hector.cardenas@universidad.mx', id_direccion: 12, direccion: 'Av. Juárez 810, Americana, Guadalajara', estado: 'Activo', fecha_creacion: '2026-02-03' },
  { id: 'tut-004', id_usuario: 304, id_tenant: 1, nombre: 'Elisa', apellido: 'Montoya Reyes', nombreCompleto: 'Elisa Montoya Reyes', puesto: 'Tutora de prácticas', id_taller: 4, taller: 'Herramientas de productividad', telefono: '55 2200 3104', email_contacto: 'elisa.montoya@universidad.mx', id_direccion: 13, direccion: 'Calle Reforma 222, Cuauhtémoc, CDMX', estado: 'Activo', fecha_creacion: '2026-02-19' },
  { id: 'tut-005', id_usuario: 305, id_tenant: 1, nombre: 'Mauricio', apellido: 'Ibarra Cano', nombreCompleto: 'Mauricio Ibarra Cano', puesto: 'Profesor de asignatura', id_taller: 5, taller: 'Portafolio profesional', telefono: '55 2200 3105', email_contacto: 'mauricio.ibarra@universidad.mx', id_direccion: 14, direccion: 'Av. Chapultepec 560, Americana, Guadalajara', estado: 'Activo', fecha_creacion: '2026-03-07' },
  { id: 'tut-006', id_usuario: 306, id_tenant: 1, nombre: 'Natalia', apellido: 'Fuentes Bravo', nombreCompleto: 'Natalia Fuentes Bravo', puesto: 'Coordinadora de vinculación', id_taller: 6, taller: 'Fundamentos contables para prácticas', telefono: '55 2200 3106', email_contacto: 'natalia.fuentes@universidad.mx', id_direccion: 15, direccion: 'Calle Zaragoza 90, Centro, Puebla', estado: 'Inactivo', fecha_creacion: '2026-03-21' },
  { id: 'tut-007', id_usuario: 307, id_tenant: 1, nombre: 'Óscar', apellido: 'Solís Paredes', nombreCompleto: 'Óscar Solís Paredes', puesto: 'Profesor de tiempo completo', id_taller: 7, taller: 'Seguridad y ética profesional', telefono: '55 2200 3107', email_contacto: 'oscar.solis@universidad.mx', id_direccion: 16, direccion: 'Av. Constitución 300, Centro, Monterrey', estado: 'Activo', fecha_creacion: '2026-04-04' },
];
