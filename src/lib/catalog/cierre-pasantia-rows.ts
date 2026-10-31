/**
 * Filas de ejemplo del catálogo de cierre de pasantía.
 *
 * Capa: lib/catalog
 * Cada cierre vincula a un estudiante con su taller, centro de trabajo y
 * el estado del proceso de cierre.
 */

import type { ResourceRow } from '@/types/resource';

export const cierrePasantiaRows: readonly ResourceRow[] = [
  {
    id: 'cie-001',
    estudiante: 'Ana Lucía Herrera',
    taller: 'Taller de empleabilidad',
    centroTrabajo: 'Grupo Aurora',
    fecha_inicio: '2026-08-01',
    fecha_fin: '2027-02-01',
    horas_completadas: 240,
    documentos_entregados: 'Sí',
    evaluacion_final: 94,
    constancia_liberacion: 'Pendiente',
    observaciones: 'Cumplió con todos los entregables del taller.',
    estado: 'En revisión',
    fecha_creacion: '2026-10-15',
  },
  {
    id: 'cie-002',
    estudiante: 'Diego Ramírez Soto',
    taller: 'Inducción a la práctica profesional',
    centroTrabajo: 'Tecnologías del Bajío',
    fecha_inicio: '2026-07-15',
    fecha_fin: '2027-01-15',
    horas_completadas: 320,
    documentos_entregados: 'Sí',
    evaluacion_final: 88,
    constancia_liberacion: 'Emitida',
    observaciones: 'Buen desempeño, se recomienda para futuras vacantes.',
    estado: 'Concluido',
    fecha_cierre: '2026-10-10',
    fecha_creacion: '2026-09-01',
  },
  {
    id: 'cie-003',
    estudiante: 'Valeria Mendoza Cruz',
    taller: 'Comunicación efectiva en el trabajo',
    centroTrabajo: 'Clínica San Ángel',
    fecha_inicio: '2026-10-01',
    fecha_fin: '2027-04-01',
    horas_completadas: 0,
    documentos_entregados: 'Parcial',
    evaluacion_final: 0,
    constancia_liberacion: 'Pendiente',
    observaciones: 'Pendiente de entrega de reporte final.',
    estado: 'Pendiente',
    fecha_creacion: '2026-10-01',
  },
  {
    id: 'cie-004',
    estudiante: 'Emiliano Torres Vega',
    taller: 'Herramientas de productividad',
    centroTrabajo: 'Logística del Norte',
    fecha_inicio: '2026-08-15',
    fecha_fin: '2027-02-15',
    horas_completadas: 180,
    documentos_entregados: 'Sí',
    evaluacion_final: 91,
    constancia_liberacion: 'Pendiente',
    observaciones: 'Aplicó las herramientas del taller con autonomía.',
    estado: 'En revisión',
    fecha_creacion: '2026-10-12',
  },
  {
    id: 'cie-005',
    estudiante: 'Mateo Aguilar Núñez',
    taller: 'Fundamentos contables para prácticas',
    centroTrabajo: 'Constructora Rivera',
    fecha_inicio: '2026-03-01',
    fecha_fin: '2026-09-30',
    horas_completadas: 480,
    documentos_entregados: 'Sí',
    evaluacion_final: 96,
    constancia_liberacion: 'Emitida',
    observaciones: 'Cerró con evidencia completa y observaciones positivas.',
    estado: 'Concluido',
    fecha_cierre: '2026-09-30',
    fecha_creacion: '2026-09-05',
  },
];
