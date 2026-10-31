/**
 * SeccionReporte — renderiza una sección de reporte en vista previa.
 *
 * Capa: molecule
 * Props: configuración de sección y datos ya resueltos
 * Efectos: ninguno.
 */
import type { Component } from 'solid-js';

import MetricCard from '@/components/molecules/reportes/MetricCard';
import BarChart from '@/components/molecules/reportes/BarChart';

export interface GraficoGrupo {
  key: string;
  count: number;
}

export interface SeccionReporteProps {
  /** Identificador de la sección. */
  id: string;
  /** Título de la sección. */
  titulo: string;
  /** Subsecciones a renderizar. */
  subsecciones: {
    id: string;
    titulo: string;
    tipo: 'metrica' | 'grafico';
    clave?: string;
  }[];
  /** Valor de una métrica por clave. */
  metricaValor: (clave: string) => string | number;
  /** Filas de gráfico por clave. */
  filasPorClave: (clave: string) => GraficoGrupo[];
  /** Métricas simples por clave. */
  metricaSimple: (clave: string) => string | number;
  /** Contar evaluaciones por estado. */
  contarEvaluacionesEstado: (estado: string) => number;
}

export const SeccionReporte: Component<SeccionReporteProps> = (props) => {
  const { metricaValor, filasPorClave, metricaSimple, contarEvaluacionesEstado } = props;

  const renderMetricas = (subs: SeccionReporteProps['subsecciones']) => (
    <div class="reportes__grid reportes__grid--metrics">
      {subs.map((sub) => {
        if (sub.tipo !== 'metrica') return null;
        return (
          <MetricCard
            value={metricaValor(sub.clave ?? '')}
            label={sub.titulo}
          />
        );
      })}
    </div>
  );

  const renderGraficos = (subs: SeccionReporteProps['subsecciones']) => {
    const filasGrafico = subs.filter((sub) => sub.tipo === 'grafico');
    if (filasGrafico.length === 0) return null;
    return (
      <div class="reportes__two-col">
        {filasGrafico.map((sub) => {
          const rows = filasPorClave(sub.clave ?? '');
          return (
            <div class="reportes__chart-wrap--sm">
              <BarChart title={sub.titulo} rows={rows} max={Math.max(0, ...rows.map((r) => r.count))} />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div class="reportes__seccion-preview">
      <h3 class="reportes__seccion-preview-titulo">{props.titulo}</h3>
      {props.id === 'resumen' ? (
        <>
          {renderMetricas(props.subsecciones)}
          {renderGraficos(props.subsecciones)}
        </>
      ) : (
        <>
          {props.subsecciones.length > 0 && renderMetricas(props.subsecciones)}
          {props.id === 'estudiantes' && (
            <div class="reportes__two-col">
              <BarChart
                title="Por estado"
                rows={filasPorClave('estudiantesPorEstado')}
                max={Math.max(0, ...filasPorClave('estudiantesPorEstado').map((r) => r.count))}
              />
              <BarChart
                title="Por taller"
                rows={filasPorClave('estudiantesPorTaller')}
                max={Math.max(0, ...filasPorClave('estudiantesPorTaller').map((r) => r.count))}
              />
            </div>
          )}
          {props.id === 'plazas' && (
            <>
              <div class="reportes__grid reportes__grid--metrics">
                <MetricCard value={metricaSimple('totalPlazas')} label="Plazas" />
                <MetricCard value={metricaSimple('totalCupos')} label="Cupos totales" />
              </div>
              <div class="reportes__two-col">
                <BarChart
                  title="Por estado"
                  rows={filasPorClave('plazasPorEstado')}
                  max={Math.max(0, ...filasPorClave('plazasPorEstado').map((r) => r.count))}
                />
                <BarChart
                  title="Por centro de trabajo"
                  rows={filasPorClave('plazasPorCentro')}
                  max={Math.max(0, ...filasPorClave('plazasPorCentro').map((r) => r.count))}
                />
              </div>
            </>
          )}
          {props.id === 'evaluaciones' && (
            <>
              <div class="reportes__grid reportes__grid--metrics">
                <MetricCard value={metricaSimple('totalEvaluaciones')} label="Evaluaciones" />
                <MetricCard value={metricaSimple('promedioGeneral')} label="Promedio general" />
                <MetricCard
                  value={contarEvaluacionesEstado('Pendiente')}
                  label="Pendientes"
                  tone="warning"
                />
                <MetricCard
                  value={contarEvaluacionesEstado('Aprobada')}
                  label="Aprobadas"
                  tone="success"
                />
                <MetricCard
                  value={contarEvaluacionesEstado('Reprobada')}
                  label="Reprobadas"
                  tone="danger"
                />
              </div>
              <div class="reportes__two-col">
                <BarChart
                  title="Por estado"
                  rows={filasPorClave('evaluacionesPorEstado')}
                  max={Math.max(0, ...filasPorClave('evaluacionesPorEstado').map((r) => r.count))}
                />
                <BarChart
                  title="Por taller"
                  rows={filasPorClave('evaluacionesPorTaller')}
                  max={Math.max(0, ...filasPorClave('evaluacionesPorTaller').map((r) => r.count))}
                />
              </div>
            </>
          )}
          {props.id === 'documentacion' && (
            <>
              <div class="reportes__grid reportes__grid--metrics">
                <MetricCard value={metricaSimple('totalDocumentos')} label="Documentos" />
              </div>
              <div class="reportes__two-col">
                <BarChart
                  title="Por estado"
                  rows={filasPorClave('documentosPorEstado')}
                  max={Math.max(0, ...filasPorClave('documentosPorEstado').map((r) => r.count))}
                />
                <BarChart
                  title="Por tipo"
                  rows={filasPorClave('documentosPorTipo')}
                  max={Math.max(0, ...filasPorClave('documentosPorTipo').map((r) => r.count))}
                />
              </div>
            </>
          )}
          {props.id === 'proceso' && (
            <>
              <div class="reportes__grid reportes__grid--metrics">
                <MetricCard value={metricaSimple('totalProcesos')} label="Pasantías" />
              </div>
              <div class="reportes__two-col">
                <BarChart
                  title="Por etapa"
                  rows={filasPorClave('procesosPorEtapa')}
                  max={Math.max(0, ...filasPorClave('procesosPorEtapa').map((r) => r.count))}
                />
                <BarChart
                  title="Por estado"
                  rows={filasPorClave('procesosPorEstado')}
                  max={Math.max(0, ...filasPorClave('procesosPorEstado').map((r) => r.count))}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default SeccionReporte;
