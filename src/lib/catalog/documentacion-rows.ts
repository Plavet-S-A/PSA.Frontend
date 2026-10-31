/**
 * Filas de ejemplo de documentos de estudiantes.
 *
 * Capa: lib/catalog
 * Cada documento conserva `id_estudiante` y las etiquetas resueltas de
 * estudiante y taller. `bucket` y `storage_path` son metadatos de referencia
 * del almacenamiento; la interfaz nunca construye URLs firmadas con ellos.
 */

import type { ResourceRow } from '@/types/resource';

export const documentacionRows: readonly ResourceRow[] = [
  { id: 'doc-001', id_estudiante: 1, estudiante: 'Ana Lucía Herrera', id_taller: 1, taller: 'Taller de empleabilidad', tipo: 'Convenio de práctica', storage_path: 'estudiantes/est-001/convenio-practica.pdf', bucket: 'psa-documentos', estado: 'Validado', fecha_creacion: '2026-08-02' },
  { id: 'doc-002', id_estudiante: 1, estudiante: 'Ana Lucía Herrera', id_taller: 1, taller: 'Taller de empleabilidad', tipo: 'Carta de presentación', storage_path: 'estudiantes/est-001/carta-presentacion.pdf', bucket: 'psa-documentos', estado: 'Validado', fecha_creacion: '2026-08-05' },
  { id: 'doc-003', id_estudiante: 1, estudiante: 'Ana Lucía Herrera', id_taller: 1, taller: 'Taller de empleabilidad', tipo: 'Reporte parcial', storage_path: 'estudiantes/est-001/reporte-parcial-1.pdf', bucket: 'psa-documentos', estado: 'Recibido', fecha_creacion: '2026-10-01' },
  { id: 'doc-004', id_estudiante: 2, estudiante: 'Diego Ramírez Soto', id_taller: 2, taller: 'Inducción a la práctica profesional', tipo: 'Convenio de práctica', storage_path: 'estudiantes/est-002/convenio-practica.pdf', bucket: 'psa-documentos', estado: 'Validado', fecha_creacion: '2026-07-18' },
  { id: 'doc-005', id_estudiante: 2, estudiante: 'Diego Ramírez Soto', id_taller: 2, taller: 'Inducción a la práctica profesional', tipo: 'Reporte parcial', storage_path: 'estudiantes/est-002/reporte-parcial-1.pdf', bucket: 'psa-documentos', estado: 'Pendiente', fecha_creacion: '2026-10-10' },
  { id: 'doc-006', id_estudiante: 3, estudiante: 'Valeria Mendoza Cruz', id_taller: 3, taller: 'Comunicación efectiva en el trabajo', tipo: 'Carta de presentación', storage_path: 'estudiantes/est-003/carta-presentacion.pdf', bucket: 'psa-documentos', estado: 'Pendiente', fecha_creacion: '2026-09-20' },
  { id: 'doc-007', id_estudiante: 4, estudiante: 'Emiliano Torres Vega', id_taller: 4, taller: 'Herramientas de productividad', tipo: 'Convenio de práctica', storage_path: 'estudiantes/est-004/convenio-practica.pdf', bucket: 'psa-documentos', estado: 'Validado', fecha_creacion: '2026-08-16' },
  { id: 'doc-008', id_estudiante: 4, estudiante: 'Emiliano Torres Vega', id_taller: 4, taller: 'Herramientas de productividad', tipo: 'Evaluación de desempeño', storage_path: 'estudiantes/est-004/evaluacion-desempeno.pdf', bucket: 'psa-documentos', estado: 'Recibido', fecha_creacion: '2026-10-12' },
  { id: 'doc-009', id_estudiante: 5, estudiante: 'Sofía Castillo Ríos', id_taller: 5, taller: 'Portafolio profesional', tipo: 'Carta de presentación', storage_path: 'estudiantes/est-005/carta-presentacion.pdf', bucket: 'psa-documentos', estado: 'Pendiente', fecha_creacion: '2026-10-05' },
  { id: 'doc-010', id_estudiante: 6, estudiante: 'Mateo Aguilar Núñez', id_taller: 6, taller: 'Fundamentos contables para prácticas', tipo: 'Reporte final', storage_path: 'estudiantes/est-006/reporte-final.pdf', bucket: 'psa-documentos', estado: 'Validado', fecha_creacion: '2026-09-28' },
  { id: 'doc-011', id_estudiante: 6, estudiante: 'Mateo Aguilar Núñez', id_taller: 6, taller: 'Fundamentos contables para prácticas', tipo: 'Constancia de liberación', storage_path: 'estudiantes/est-006/constancia-liberacion.pdf', bucket: 'psa-documentos', estado: 'Validado', fecha_creacion: '2026-10-02' },
  { id: 'doc-012', id_estudiante: 7, estudiante: 'Regina Flores Ponce', id_taller: 7, taller: 'Seguridad y ética profesional', tipo: 'Convenio de práctica', storage_path: 'estudiantes/est-007/convenio-practica.pdf', bucket: 'psa-documentos', estado: 'Pendiente', fecha_creacion: '2026-10-11' },
  { id: 'doc-013', id_estudiante: 8, estudiante: 'Santiago Navarro Lara', id_taller: 4, taller: 'Herramientas de productividad', tipo: 'Reporte parcial', storage_path: 'estudiantes/est-008/reporte-parcial-1.pdf', bucket: 'psa-documentos', estado: 'Rechazado', fecha_creacion: '2026-10-08' },
  { id: 'doc-014', id_estudiante: 9, estudiante: 'Camila Ortega Salas', id_taller: 1, taller: 'Taller de empleabilidad', tipo: 'Reporte final', storage_path: 'estudiantes/est-009/reporte-final.pdf', bucket: 'psa-documentos', estado: 'Recibido', fecha_creacion: '2026-10-15' },
  { id: 'doc-015', id_estudiante: 2, estudiante: 'Diego Ramírez Soto', id_taller: 2, taller: 'Inducción a la práctica profesional', tipo: 'Evaluación de desempeño', storage_path: 'estudiantes/est-002/evaluacion-desempeno.pdf', bucket: 'psa-documentos', estado: 'Pendiente', fecha_creacion: '2026-10-20' },
];
