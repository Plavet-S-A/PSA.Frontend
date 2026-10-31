/**
 * Filas de ejemplo de plazas de práctica.
 *
 * Capa: lib/catalog
 * La plaza se define por su centro de trabajo, taller, cantidad de lugares y
 * restricciones. `plaza` es una etiqueta derivada para tablas y selectores; no
 * es una columna adicional del modelo.
 */

import type { ResourceRow } from '@/types/resource';

export const plazasRows: readonly ResourceRow[] = [
  { id: 'pla-001', id_centro_trabajo: 2, centroTrabajo: 'Tecnologías del Bajío', id_taller: 4, taller: 'Herramientas de productividad', plaza: 'Tecnologías del Bajío · Herramientas de productividad', cantidad: 3, fecha_creacion: '2026-09-01', estado: 'Abierta', edad_minima: 18, genero: 'Indistinto', observacion: 'Modalidad híbrida; tres días en sitio y dos remotos.' },
  { id: 'pla-002', id_centro_trabajo: 1, centroTrabajo: 'Grupo Aurora', id_taller: 1, taller: 'Taller de empleabilidad', plaza: 'Grupo Aurora · Taller de empleabilidad', cantidad: 2, fecha_creacion: '2026-08-20', estado: 'Abierta', edad_minima: 18, genero: 'Indistinto', observacion: 'Jornada matutina con acompañamiento de recursos humanos.' },
  { id: 'pla-003', id_centro_trabajo: 3, centroTrabajo: 'Logística del Norte', id_taller: 2, taller: 'Inducción a la práctica profesional', plaza: 'Logística del Norte · Inducción a la práctica profesional', cantidad: 4, fecha_creacion: '2026-09-10', estado: 'En revisión', edad_minima: 20, genero: 'Indistinto', observacion: 'Requiere disponibilidad para visitas al almacén.' },
  { id: 'pla-004', id_centro_trabajo: 6, centroTrabajo: 'Estudio Punto', id_taller: 5, taller: 'Portafolio profesional', plaza: 'Estudio Punto · Portafolio profesional', cantidad: 1, fecha_creacion: '2026-09-15', estado: 'Cubierta', edad_minima: 18, genero: 'Indistinto', observacion: 'Portafolio con proyectos de diseño y comunicación visual.' },
  { id: 'pla-005', id_centro_trabajo: 1, centroTrabajo: 'Grupo Aurora', id_taller: 6, taller: 'Fundamentos contables para prácticas', plaza: 'Grupo Aurora · Fundamentos contables para prácticas', cantidad: 2, fecha_creacion: '2026-08-28', estado: 'Abierta', edad_minima: 18, genero: 'Indistinto', observacion: 'Apoyo en conciliaciones y control de gastos.' },
  { id: 'pla-006', id_centro_trabajo: 4, centroTrabajo: 'Constructora Rivera', id_taller: 7, taller: 'Seguridad y ética profesional', plaza: 'Constructora Rivera · Seguridad y ética profesional', cantidad: 2, fecha_creacion: '2026-09-05', estado: 'Cerrada', edad_minima: 21, genero: 'Indistinto', observacion: 'Inducción en seguridad industrial y ética de obra.' },
  { id: 'pla-007', id_centro_trabajo: 5, centroTrabajo: 'Clínica San Ángel', id_taller: 3, taller: 'Comunicación efectiva en el trabajo', plaza: 'Clínica San Ángel · Comunicación efectiva en el trabajo', cantidad: 1, fecha_creacion: '2026-09-18', estado: 'En revisión', edad_minima: 18, genero: 'Indistinto', observacion: 'Atención a pacientes y comunicación con familiares.' },
  { id: 'pla-008', id_centro_trabajo: 7, centroTrabajo: 'Alimentos del Centro', id_taller: 6, taller: 'Fundamentos contables para prácticas', plaza: 'Alimentos del Centro · Fundamentos contables para prácticas', cantidad: 2, fecha_creacion: '2026-09-22', estado: 'Abierta', edad_minima: 18, genero: 'Indistinto', observacion: 'Control de inventarios y registros de producción.' },
];
