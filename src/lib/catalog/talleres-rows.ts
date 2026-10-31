/**
 * Filas de ejemplo del catálogo de talleres.
 *
 * Capa: lib/catalog
 * Incluye la familia profesional, el código de título y las horas de práctica
 * que exige el plan de estudios. `id_familia` es una referencia de consulta.
 */

import type { ResourceRow } from '@/types/resource';

export const talleresRows: readonly ResourceRow[] = [
  { id: 'tal-001', nombre: 'Taller de empleabilidad', id_familia: 3, familia: 'Administración', codigo_titulo: 'TSU-ADM-EMP', horas_pasantia: 480, estado: 'Activo' },
  { id: 'tal-002', nombre: 'Inducción a la práctica profesional', id_familia: 4, familia: 'Ciencias Sociales', codigo_titulo: 'TSU-GEN-IND', horas_pasantia: 240, estado: 'Activo' },
  { id: 'tal-003', nombre: 'Comunicación efectiva en el trabajo', id_familia: 4, familia: 'Ciencias Sociales', codigo_titulo: 'TSU-COM-EFE', horas_pasantia: 240, estado: 'Activo' },
  { id: 'tal-004', nombre: 'Herramientas de productividad', id_familia: 1, familia: 'Tecnología', codigo_titulo: 'TSU-TEC-HER', horas_pasantia: 320, estado: 'Activo' },
  { id: 'tal-005', nombre: 'Portafolio profesional', id_familia: 5, familia: 'Diseño', codigo_titulo: 'TSU-DIS-POR', horas_pasantia: 240, estado: 'En planeación' },
  { id: 'tal-006', nombre: 'Fundamentos contables para prácticas', id_familia: 3, familia: 'Administración', codigo_titulo: 'TSU-CON-FUN', horas_pasantia: 480, estado: 'Activo' },
  { id: 'tal-007', nombre: 'Seguridad y ética profesional', id_familia: 2, familia: 'Ingeniería', codigo_titulo: 'TSU-ING-SEG', horas_pasantia: 240, estado: 'Cerrado' },
];
