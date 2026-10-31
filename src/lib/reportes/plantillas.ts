/**
 * Plantillas de reporte para el módulo de reportes de pasantía.
 *
 * Capa: lib/reportes
 * Cada plantilla define qué secciones y subsecciones se muestran en el
 * reporte. Se usan para filtrar el contenido según el interés del usuario.
 */

/** Subsección de un reporte (métrica o gráfico). */
export interface ReporteSubseccion {
  /** Identificador estable de la subsección. */
  id: string;
  /** Etiqueta visible. */
  titulo: string;
  /** Tipo de contenido: tarjeta métrica o gráfico de barras. */
  tipo: 'metrica' | 'grafico';
  /** Clave del memorizado a renderizar (para métricas). */
  clave?: string;
}

/** Sección de un reporte (agrupa subsecciones). */
export interface ReporteSeccion {
  /** Identificador estable de la sección. */
  id: string;
  /** Etiqueta visible de la sección. */
  titulo: string;
  /** Subsecciones dentro de esta sección. */
  subsecciones: ReporteSubseccion[];
}

/** Plantilla completa de reporte. */
export interface ReportePlantilla {
  /** Identificador estable de la plantilla. */
  id: string;
  /** Nombre visible de la plantilla. */
  nombre: string;
  /** Descripción breve de qué contiene. */
  descripcion: string;
  /** Secciones que incluye la plantilla. */
  secciones: ReporteSeccion[];
}

/** Llave de memorizado para una métrica de reporte. */
export type ReporteMetricaClave =
  | 'totalEstudiantes'
  | 'totalPlazas'
  | 'totalCupos'
  | 'totalEvaluaciones'
  | 'promedioGeneral'
  | 'totalDocumentos'
  | 'totalProcesos';

export const PLANTILLAS: ReportePlantilla[] = [
  {
    id: 'ejecutivo',
    nombre: 'Resumen ejecutivo',
    descripcion:
      'Vista rápida del estado del proceso de pasantía: métricas clave y gráficos de distribución.',
    secciones: [
      {
        id: 'resumen',
        titulo: 'Resumen general',
        subsecciones: [
          { id: 'estudiantes', titulo: 'Estudiantes totales', tipo: 'metrica', clave: 'totalEstudiantes' },
          { id: 'plazas', titulo: 'Plazas registradas', tipo: 'metrica', clave: 'totalPlazas' },
          { id: 'cupos', titulo: 'Cupos totales', tipo: 'metrica', clave: 'totalCupos' },
          { id: 'evaluaciones', titulo: 'Evaluaciones capturadas', tipo: 'metrica', clave: 'totalEvaluaciones' },
          { id: 'promedio', titulo: 'Promedio general', tipo: 'metrica', clave: 'promedioGeneral' },
          { id: 'documentos', titulo: 'Documentos entregados', tipo: 'metrica', clave: 'totalDocumentos' },
          { id: 'grafico-estados-estudiantes', titulo: 'Estudiantes por estado', tipo: 'grafico', clave: 'estudiantesPorEstado' },
          { id: 'grafico-estados-evaluaciones', titulo: 'Evaluaciones por estado', tipo: 'grafico', clave: 'evaluacionesPorEstado' },
        ],
      },
    ],
  },
  {
    id: 'detallado',
    nombre: 'Detallado completo',
    descripcion:
      'Todas las secciones con sus gráficos y métricas por estado, taller, centro y tipo.',
    secciones: [
      { id: 'estudiantes', titulo: 'Estudiantes', subsecciones: [] },
      { id: 'plazas', titulo: 'Plazas de práctica', subsecciones: [] },
      { id: 'evaluaciones', titulo: 'Evaluaciones', subsecciones: [] },
      { id: 'documentacion', titulo: 'Documentación de estudiantes', subsecciones: [] },
      { id: 'proceso', titulo: 'Proceso de pasantía', subsecciones: [] },
    ],
  },
  {
    id: 'academico',
    nombre: 'Vista académica',
    descripcion:
      'Enfoque en estudiantes y evaluaciones: estados, talleres y promedios.',
    secciones: [
      { id: 'estudiantes', titulo: 'Estudiantes', subsecciones: [] },
      { id: 'evaluaciones', titulo: 'Evaluaciones', subsecciones: [] },
    ],
  },
  {
    id: 'empresas',
    nombre: 'Vista de empresas y plazas',
    descripcion:
      'Enfoque en plazas, centros de trabajo y cupos disponibles.',
    secciones: [
      { id: 'plazas', titulo: 'Plazas de práctica', subsecciones: [] },
      { id: 'documentacion', titulo: 'Documentación de estudiantes', subsecciones: [] },
    ],
  },
];

/**
 * Obtiene una plantilla por su identificador.
 *
 * @param id Identificador de la plantilla.
 * @returns La plantilla encontrada o la primera por defecto.
 */
export function obtenerPlantilla(id: string): ReportePlantilla {
  return PLANTILLAS.find((p) => p.id === id) ?? PLANTILLAS[0];
}

/** Identificadores de plantilla disponibles. */
export const PLANTILLA_IDS = PLANTILLAS.map((p) => p.id);
