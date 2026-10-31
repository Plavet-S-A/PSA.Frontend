/**
 * Filas de ejemplo del catálogo de excusas.
 *
 * Capa: lib/catalog
 * Las excusas vinculan a un estudiante con un tutor destino y un estado.
 */

import type { ResourceRow } from '@/types/resource';

export const excusasRows: readonly ResourceRow[] = [
  {
    id: 'exc-001',
    estudiante: 'Ana Lucía Herrera',
    tutor: 'Tutor académico',
    tipo: 'Ausencia justificada',
    fecha: '2026-10-20',
    descripcion: 'Ausencia por motivo de enfermedad con certificado médico adjunto.',
    estado: 'Pendiente',
    fecha_creacion: '2026-10-20',
  },
  {
    id: 'exc-002',
    estudiante: 'Diego Ramírez Soto',
    tutor: 'Tutor empresarial',
    tipo: 'Retraso',
    fecha: '2026-10-21',
    descripcion: 'Llegada tardía al centro de trabajo por problema de transporte público.',
    estado: 'Aceptada',
    fecha_creacion: '2026-10-21',
  },
  {
    id: 'exc-003',
    estudiante: 'Valeria Mendoza Cruz',
    tutor: 'Tutor académico',
    tipo: 'Problema de documentación',
    fecha: '2026-10-22',
    descripcion: 'Falta de convenio firmado por el centro de trabajo.',
    estado: 'Rechazada',
    fecha_creacion: '2026-10-22',
  },
  {
    id: 'exc-004',
    estudiante: 'Emiliano Torres Vega',
    tutor: 'Tutor empresarial',
    tipo: 'Cita médica',
    fecha: '2026-10-23',
    descripcion: 'Cita médica programada con antelación, se presenta comprobante.',
    estado: 'Pendiente',
    fecha_creacion: '2026-10-23',
  },
  {
    id: 'exc-005',
    estudiante: 'Sofía Castillo Ríos',
    tutor: 'Tutor académico',
    tipo: 'Asunto familiar',
    fecha: '2026-10-24',
    descripcion: 'Emergencia familiar, se justifica la ausencia del día.',
    estado: 'Pendiente',
    fecha_creacion: '2026-10-24',
  },
];
