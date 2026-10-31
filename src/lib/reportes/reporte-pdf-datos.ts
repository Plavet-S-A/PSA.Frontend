/**
 * Datos y bloques editoriales de los reportes PDF.
 *
 * Capa: lib/reportes
 * Convierte las métricas agregadas en tarjetas, gráficos y secciones. No
 * conoce el DOM ni el estado de la interfaz.
 */

import type { PdfBlock } from '@/lib/reportes/pdf-blocks';
import type { PdfMetricCard } from '@/lib/reportes/pdf-cards';
import type { PdfChartSpec } from '@/lib/reportes/pdf-charts';
import type { GroupRow } from '@/lib/reportes/metricas';
import type { ReportePlantilla } from '@/lib/reportes/plantillas';

/** Datos agregados que alimentan cualquier plantilla. */
export interface ReportePdfDatos {
  totalEstudiantes: number;
  totalPlazas: number;
  totalCupos: number;
  totalEvaluaciones: number;
  promedioGeneral: number;
  totalDocumentos: number;
  totalProcesos: number;
  estudiantesPorEstado: readonly GroupRow[];
  estudiantesPorTaller: readonly GroupRow[];
  plazasPorEstado: readonly GroupRow[];
  plazasPorCentro: readonly GroupRow[];
  evaluacionesPorEstado: readonly GroupRow[];
  evaluacionesPorTaller: readonly GroupRow[];
  documentosPorEstado: readonly GroupRow[];
  documentosPorTipo: readonly GroupRow[];
  procesosPorEtapa: readonly GroupRow[];
  procesosPorEstado: readonly GroupRow[];
  evaluacionesPendientes: number;
  evaluacionesAprobadas: number;
  evaluacionesReprobadas: number;
}

/** Descripción editorial de cada sección del reporte. */
const SECTION_HINTS: Record<string, string> = {
  resumen: 'Indicadores clave y distribución del proceso de pasantía.',
  estudiantes: 'Volumen y distribución de estudiantes por estado y taller.',
  plazas: 'Cobertura de plazas, cupos y centros de trabajo registrados.',
  evaluaciones: 'Resultados, estados y concentración por taller.',
  documentacion: 'Entregas de documentos por estado y tipo de documento.',
  proceso: 'Avance de las pasantías por etapa y estado del proceso.',
};

/** Descripción breve de cada gráfico. */
const CHART_HINTS: Record<string, string> = {
  estudiantesPorEstado: 'Estudiantes según su estado actual.',
  estudiantesPorTaller: 'Concentración de estudiantes por taller.',
  plazasPorEstado: 'Plazas según su estado de publicación.',
  plazasPorCentro: 'Plazas agrupadas por centro de trabajo.',
  evaluacionesPorEstado: 'Evaluaciones según su resultado.',
  evaluacionesPorTaller: 'Evaluaciones capturadas por taller.',
  documentosPorEstado: 'Documentos según su estado de revisión.',
  documentosPorTipo: 'Documentos agrupados por tipo.',
  procesosPorEtapa: 'Pasantías según su etapa actual.',
  procesosPorEstado: 'Pasantías según su estado general.',
};

/** Tarjetas de resumen general que encabezan todas las plantillas. */
export function overviewCards(datos: ReportePdfDatos): PdfMetricCard[] {
  return [
    { label: 'Estudiantes', value: String(datos.totalEstudiantes), hint: 'Registros en el módulo', tone: 'accent' },
    { label: 'Plazas', value: String(datos.totalPlazas), hint: `${datos.totalCupos} cupos disponibles`, tone: 'info' },
    { label: 'Evaluaciones', value: String(datos.totalEvaluaciones), hint: `Promedio general ${datos.promedioGeneral}`, tone: 'success' },
    { label: 'Documentos', value: String(datos.totalDocumentos), hint: 'Entregas registradas', tone: 'warning' },
  ];
}

/** Tarjetas propias de una sección. */
function sectionCards(id: string, datos: ReportePdfDatos): PdfMetricCard[] {
  switch (id) {
    case 'estudiantes':
      return [
        { label: 'Estudiantes totales', value: String(datos.totalEstudiantes), tone: 'accent' },
        { label: 'Talleres con estudiantes', value: String(datos.estudiantesPorTaller.length), tone: 'info' },
        { label: 'Estados registrados', value: String(datos.estudiantesPorEstado.length), tone: 'neutral' },
      ];
    case 'plazas':
      return [
        { label: 'Plazas registradas', value: String(datos.totalPlazas), tone: 'accent' },
        { label: 'Cupos totales', value: String(datos.totalCupos), tone: 'info' },
        { label: 'Centros de trabajo', value: String(datos.plazasPorCentro.length), tone: 'neutral' },
      ];
    case 'evaluaciones':
      return [
        { label: 'Evaluaciones capturadas', value: String(datos.totalEvaluaciones), tone: 'accent' },
        { label: 'Promedio general', value: String(datos.promedioGeneral), tone: 'info' },
        { label: 'Pendientes', value: String(datos.evaluacionesPendientes), tone: 'warning' },
        { label: 'Aprobadas', value: String(datos.evaluacionesAprobadas), tone: 'success' },
        { label: 'Reprobadas', value: String(datos.evaluacionesReprobadas), tone: 'danger' },
      ];
    case 'documentacion':
      return [
        { label: 'Documentos entregados', value: String(datos.totalDocumentos), tone: 'accent' },
        { label: 'Tipos de documento', value: String(datos.documentosPorTipo.length), tone: 'info' },
        { label: 'Estados de revisión', value: String(datos.documentosPorEstado.length), tone: 'neutral' },
      ];
    case 'proceso':
      return [
        { label: 'Pasantías registradas', value: String(datos.totalProcesos), tone: 'accent' },
        { label: 'Etapas del proceso', value: String(datos.procesosPorEtapa.length), tone: 'info' },
        { label: 'Estados del proceso', value: String(datos.procesosPorEstado.length), tone: 'neutral' },
      ];
    default:
      return [];
  }
}

/** Convierte filas agrupadas al formato de gráfico. */
function toChartRows(rows: readonly GroupRow[]): PdfChartSpec['rows'] {
  return rows.map((row) => ({ label: row.key, value: row.count }));
}

/** Construye un gráfico con título, contexto y filas. */
function chart(title: string, hint: string, rows: readonly GroupRow[]): PdfChartSpec {
  return { title, description: hint, rows: toChartRows(rows) };
}

/** Gráficos propios de una sección. */
function sectionCharts(id: string, datos: ReportePdfDatos): PdfChartSpec[] {
  switch (id) {
    case 'estudiantes':
      return [
        chart('Estudiantes por estado', CHART_HINTS.estudiantesPorEstado, datos.estudiantesPorEstado),
        chart('Estudiantes por taller', CHART_HINTS.estudiantesPorTaller, datos.estudiantesPorTaller),
      ];
    case 'plazas':
      return [
        chart('Plazas por estado', CHART_HINTS.plazasPorEstado, datos.plazasPorEstado),
        chart('Plazas por centro de trabajo', CHART_HINTS.plazasPorCentro, datos.plazasPorCentro),
      ];
    case 'evaluaciones':
      return [
        chart('Evaluaciones por estado', CHART_HINTS.evaluacionesPorEstado, datos.evaluacionesPorEstado),
        chart('Evaluaciones por taller', CHART_HINTS.evaluacionesPorTaller, datos.evaluacionesPorTaller),
      ];
    case 'documentacion':
      return [
        chart('Documentos por estado', CHART_HINTS.documentosPorEstado, datos.documentosPorEstado),
        chart('Documentos por tipo', CHART_HINTS.documentosPorTipo, datos.documentosPorTipo),
      ];
    case 'proceso':
      return [
        chart('Pasantías por etapa', CHART_HINTS.procesosPorEtapa, datos.procesosPorEtapa),
        chart('Pasantías por estado', CHART_HINTS.procesosPorEstado, datos.procesosPorEstado),
      ];
    default:
      return [];
  }
}

/** Tarjetas del resumen ejecutivo según las subsecciones de la plantilla. */
function summaryCards(
  plantilla: ReportePlantilla,
  datos: ReportePdfDatos,
): PdfMetricCard[] {
  const section = plantilla.secciones.find((item) => item.id === 'resumen');
  if (!section) return [];
  return section.subsecciones
    .filter((sub) => sub.tipo === 'metrica')
    .map((sub) => ({
      label: sub.titulo,
      value: String(metricaValor(sub.clave ?? '', datos)),
      tone: sub.clave === 'promedioGeneral' ? 'info' : 'accent',
    }));
}

/** Gráficos del resumen ejecutivo según las subsecciones de la plantilla. */
function summaryCharts(
  plantilla: ReportePlantilla,
  datos: ReportePdfDatos,
): PdfChartSpec[] {
  const section = plantilla.secciones.find((item) => item.id === 'resumen');
  if (!section) return [];
  return section.subsecciones
    .filter((sub) => sub.tipo === 'grafico')
    .map((sub) =>
      chart(
        sub.titulo,
        CHART_HINTS[sub.clave ?? ''] ?? '',
        filasPorClave(sub.clave ?? '', datos),
      ),
    );
}

/** Bloques de una sección de la plantilla. */
export function sectionBlocks(
  id: string,
  index: number,
  plantilla: ReportePlantilla,
  datos: ReportePdfDatos,
): PdfBlock[] {
  const section = plantilla.secciones.find((item) => item.id === id);
  if (!section) return [];
  const cards = id === 'resumen' ? summaryCards(plantilla, datos) : sectionCards(id, datos);
  const charts = id === 'resumen' ? summaryCharts(plantilla, datos) : sectionCharts(id, datos);
  const blocks: PdfBlock[] = [
    {
      type: 'section',
      index,
      title: section.titulo,
      description: SECTION_HINTS[id] ?? plantilla.descripcion,
      newPage: true,
    },
  ];

  if (cards.length > 0) blocks.push({ type: 'cards', cards, columns: 3 });
  for (const item of charts) blocks.push({ type: 'chart', chart: item });
  return blocks;
}

/** Valor visible de una métrica del resumen. */
function metricaValor(clave: string, datos: ReportePdfDatos): string | number {
  switch (clave) {
    case 'totalEstudiantes': return datos.totalEstudiantes;
    case 'totalPlazas': return datos.totalPlazas;
    case 'totalCupos': return datos.totalCupos;
    case 'totalEvaluaciones': return datos.totalEvaluaciones;
    case 'promedioGeneral': return datos.promedioGeneral;
    case 'totalDocumentos': return datos.totalDocumentos;
    case 'totalProcesos': return datos.totalProcesos;
    default: return 0;
  }
}

/** Filas de un gráfico del resumen. */
function filasPorClave(clave: string, datos: ReportePdfDatos): readonly GroupRow[] {
  switch (clave) {
    case 'estudiantesPorEstado': return datos.estudiantesPorEstado;
    case 'estudiantesPorTaller': return datos.estudiantesPorTaller;
    case 'plazasPorEstado': return datos.plazasPorEstado;
    case 'plazasPorCentro': return datos.plazasPorCentro;
    case 'evaluacionesPorEstado': return datos.evaluacionesPorEstado;
    case 'evaluacionesPorTaller': return datos.evaluacionesPorTaller;
    case 'documentosPorEstado': return datos.documentosPorEstado;
    case 'documentosPorTipo': return datos.documentosPorTipo;
    case 'procesosPorEtapa': return datos.procesosPorEtapa;
    case 'procesosPorEstado': return datos.procesosPorEstado;
    default: return [];
  }
}
