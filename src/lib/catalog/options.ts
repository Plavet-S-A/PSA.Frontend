/**
 * Vocabulario compartido de los módulos de pasantía.
 *
 * Capa: lib/catalog
 * Estudiantes, talleres, plazas y estados se declaran una sola vez para que
 * documentación, evaluación y proceso de pasantía hablen del mismo catálogo.
 * Las listas reflejan los atributos del modelo de datos de referencia.
 */

/** Nombres completos de estudiantes usados en los módulos operativos. */
export const ESTUDIANTE_NOMBRES = [
  'Ana Lucía Herrera',
  'Diego Ramírez Soto',
  'Valeria Mendoza Cruz',
  'Emiliano Torres Vega',
  'Sofía Castillo Ríos',
  'Mateo Aguilar Núñez',
  'Regina Flores Ponce',
  'Santiago Navarro Lara',
  'Camila Ortega Salas',
] as const;

/** Talleres disponibles, en el orden en que se agrupan las pantallas. */
export const TALLER_NOMBRES = [
  'Taller de empleabilidad',
  'Inducción a la práctica profesional',
  'Comunicación efectiva en el trabajo',
  'Herramientas de productividad',
  'Portafolio profesional',
  'Fundamentos contables para prácticas',
  'Seguridad y ética profesional',
] as const;

/** Centros de trabajo que reciben practicantes. */
export const CENTRO_TRABAJO_NOMBRES = [
  'Grupo Aurora',
  'Tecnologías del Bajío',
  'Logística del Norte',
  'Constructora Rivera',
  'Clínica San Ángel',
  'Estudio Punto',
  'Alimentos del Centro',
] as const;

/** Familias profesionales de `familia_profesional`. */
export const FAMILIA_NOMBRES = [
  'Tecnología',
  'Ingeniería',
  'Administración',
  'Ciencias Sociales',
  'Diseño',
  'Salud',
] as const;

/** Ciclos escolares de referencia. */
export const CICLO_NOMBRES = ['2025-2026', '2026-2027'] as const;

/** Géneros admitidos por la restricción de una plaza. */
export const GENERO_OPCIONES = [
  'Indistinto',
  'Femenino',
  'Masculino',
  'No binario',
] as const;

/** Estados de validación de un centro de trabajo. */
export const VALIDACION_OPCIONES = [
  'Pendiente',
  'Validado',
  'Rechazado',
] as const;

/** Roles visibles en el catálogo de usuarios. */
export const USUARIO_ROLES = [
  'Coordinación',
  'Vinculador',
  'Tutor académico',
  'Tutor empresarial',
  'Supervisor',
  'Estudiante',
] as const;

/** Valores legibles para la bandera `cuenta_bloqueada`. */
export const CUENTA_BLOQUEADA_OPCIONES = ['No', 'Sí'] as const;

/** Nombres de supervisores usados en el proceso de pasantía. */
export const SUPERVISOR_NOMBRES = [
  'Mariana Cortés Vidal',
  'Luis Enrique Pacheco',
  'Diana Robles Ibarra',
  'Fernando Rivera Cano',
  'Cecilia Nava Arroyo',
  'Tomás Esquivel Ríos',
  'Alejandra Vega Soto',
] as const;

/**
 * Compone la etiqueta visible de una plaza a partir de sus relaciones.
 *
 * @param centroTrabajo Nombre del centro de trabajo.
 * @param taller Nombre del taller.
 * @returns Etiqueta como `Grupo Aurora · Taller de empleabilidad`.
 */
export function plazaLabel(centroTrabajo: string, taller: string): string {
  const parts = [centroTrabajo.trim(), taller.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : 'Plaza sin asignar';
}

/** Plazas de práctica ofrecidas por los centros de trabajo. */
export const PLAZA_NOMBRES = [
  'Tecnologías del Bajío · Herramientas de productividad',
  'Grupo Aurora · Taller de empleabilidad',
  'Logística del Norte · Inducción a la práctica profesional',
  'Estudio Punto · Portafolio profesional',
  'Grupo Aurora · Fundamentos contables para prácticas',
  'Constructora Rivera · Seguridad y ética profesional',
  'Clínica San Ángel · Comunicación efectiva en el trabajo',
  'Alimentos del Centro · Fundamentos contables para prácticas',
] as const;

/** Tipos de documento que entrega el estudiante. */
export const TIPO_DOCUMENTO_OPCIONES = [
  'Convenio de práctica',
  'Carta de presentación',
  'Reporte parcial',
  'Reporte final',
  'Evaluación de desempeño',
  'Constancia de liberación',
] as const;

/** Estados de un documento entregado. */
export const DOCUMENTO_ESTADOS = ['Pendiente', 'Recibido', 'Validado', 'Rechazado'] as const;

/** Estados de una evaluación. */
export const EVALUACION_ESTADOS = ['Pendiente', 'Aprobada', 'Reprobada'] as const;

/** Etapas del proceso de pasantía. */
export const PROCESO_ETAPAS = [
  'Registro',
  'Documentación',
  'Asignación',
  'En curso',
  'Evaluación',
  'Cierre',
] as const;

/** Estados del proceso de pasantía. */
export const PROCESO_ESTADOS = ['En tiempo', 'En riesgo', 'Concluido'] as const;

/** Estados de cierre de pasantía. */
export const CIERRE_ESTADOS = ['Pendiente', 'En revisión', 'Concluido'] as const;

/** Tipos de excusa que puede enviar un estudiante. */
export const TIPO_EXCUSA_OPCIONES = [
  'Ausencia justificada',
  'Retraso',
  'Problema de documentación',
  'Cita médica',
  'Asunto familiar',
  'Otro',
] as const;

/** Estados de una excusa. */
export const ESTADO_EXCUSA_OPCIONES = ['Pendiente', 'Aceptada', 'Rechazada'] as const;
