/**
 * ReportesWorkspace — métricas del proceso de pasantía con plantillas y vista previa.
 *
 * Capa: organism
 * Flujo: selecciona un tipo de reporte → vista previa → descarga en PDF.
 * Efectos: lee filas de localStorage por módulo; no escribe.
 */
import type { Component } from 'solid-js';
import { createMemo, createSignal, onMount, Show } from 'solid-js';

import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Alert from '@/components/molecules/Alert';
import SeccionReporte from '@/components/molecules/reportes/SeccionReporte';
import { todayIsoDate } from '@/lib/format/date';
import { loadResourceRows } from '@/lib/storage/resource-store';
import {
  agruparPor,
  contarPorEstado,
  promedioGeneral,
  totalCupos,
} from '@/lib/reportes/metricas';
import {
  obtenerPlantilla,
  PLANTILLA_IDS,
  type ReportePlantilla,
} from '@/lib/reportes/plantillas';
import { crearReportePdf } from '@/lib/reportes/reporte-pdf';
import type { ResourceConfig, ResourceRow } from '@/types/resource';
import {
  documentacionRows,
  documentacionConfig,
} from '@/lib/catalog/documentacion';
import {
  estudiantesRows,
  estudiantesConfig,
} from '@/lib/catalog/estudiantes';
import {
  evaluacionRows,
  evaluacionConfig,
} from '@/lib/catalog/evaluacion';
import {
  plazasRows,
  plazasConfig,
} from '@/lib/catalog/plazas';
import {
  procesoPasantiaRows,
  procesoPasantiaConfig,
} from '@/lib/catalog/proceso-pasantia';

type PasoReporte = 'seleccion' | 'vistaPrevia';

export const ReportesWorkspace: Component = () => {
  const [estudiantes, setEstudiantes] = createSignal<ResourceRow[]>([]);
  const [plazas, setPlazas] = createSignal<ResourceRow[]>([]);
  const [evaluaciones, setEvaluaciones] = createSignal<ResourceRow[]>([]);
  const [documentos, setDocumentos] = createSignal<ResourceRow[]>([]);
  const [procesos, setProcesos] = createSignal<ResourceRow[]>([]);
  const [plantillaId, setPlantillaId] = createSignal<string>('detallado');
  const [paso, setPaso] = createSignal<PasoReporte>('seleccion');

  const loadModule = (
    config: ResourceConfig,
    rows: readonly ResourceRow[],
    setter: (rows: ResourceRow[]) => void,
  ) => {
    const saved = loadResourceRows(config.id, rows);
    setter([...saved]);
  };

  onMount(() => {
    loadModule(estudiantesConfig, estudiantesRows, setEstudiantes);
    loadModule(plazasConfig, plazasRows, setPlazas);
    loadModule(evaluacionConfig, evaluacionRows, setEvaluaciones);
    loadModule(documentacionConfig, documentacionRows, setDocumentos);
    loadModule(procesoPasantiaConfig, procesoPasantiaRows, setProcesos);
  });

  /* ---------- Métricas principales ---------- */
  const totalEstudiantes = createMemo(() => estudiantes().length);
  const totalPlazas = createMemo(() => plazas().length);
  const totalEvaluaciones = createMemo(() => evaluaciones().length);
  const totalDocumentos = createMemo(() => documentos().length);
  const totalProcesos = createMemo(() => procesos().length);

  /* ---------- Agrupamientos ---------- */
  const estudiantesPorEstado = createMemo(() => agruparPor(estudiantes(), 'estado'));
  const estudiantesPorTaller = createMemo(() =>
    agruparPor(estudiantes(), 'taller', 'Sin taller'),
  );
  const plazasPorEstado = createMemo(() => agruparPor(plazas(), 'estado'));
  const plazasPorCentro = createMemo(() =>
    agruparPor(plazas(), 'centroTrabajo', 'Sin centro'),
  );
  const evaluacionesPorEstado = createMemo(() => agruparPor(evaluaciones(), 'estado'));
  const evaluacionesPorTaller = createMemo(() =>
    agruparPor(evaluaciones(), 'taller', 'Sin taller'),
  );
  const documentosPorEstado = createMemo(() => agruparPor(documentos(), 'estado'));
  const documentosPorTipo = createMemo(() =>
    agruparPor(documentos(), 'tipo', 'Sin tipo'),
  );
  const procesosPorEtapa = createMemo(() =>
    agruparPor(procesos(), 'etapa', 'Sin etapa'),
  );
  const procesosPorEstado = createMemo(() => agruparPor(procesos(), 'estado'));

  const plantilla = createMemo<ReportePlantilla>(() => obtenerPlantilla(plantillaId()));

  const seleccionarPlantilla = (id: string) => {
    setPlantillaId(id);
    setPaso('vistaPrevia');
  };

  const volverASleccion = () => setPaso('seleccion');

  const metricaValor = (clave: string): string | number => {
    switch (clave) {
      case 'totalEstudiantes': return totalEstudiantes();
      case 'totalPlazas': return totalPlazas();
      case 'totalCupos': return totalCupos(plazas());
      case 'totalEvaluaciones': return totalEvaluaciones();
      case 'promedioGeneral': return promedioGeneral(evaluaciones());
      case 'totalDocumentos': return totalDocumentos();
      case 'totalProcesos': return totalProcesos();
      default: return 0;
    }
  };

  const exportarPdf = () => {
    const now = new Date();
    const bytes = crearReportePdf({
      plantilla: plantilla(),
      generado: now.toLocaleString('es-MX', {
        dateStyle: 'long',
        timeStyle: 'short',
      }),
      datos: {
        totalEstudiantes: totalEstudiantes(),
        totalPlazas: totalPlazas(),
        totalCupos: totalCupos(plazas()),
        totalEvaluaciones: totalEvaluaciones(),
        promedioGeneral: promedioGeneral(evaluaciones()),
        totalDocumentos: totalDocumentos(),
        totalProcesos: totalProcesos(),
        estudiantesPorEstado: estudiantesPorEstado(),
        estudiantesPorTaller: estudiantesPorTaller(),
        plazasPorEstado: plazasPorEstado(),
        plazasPorCentro: plazasPorCentro(),
        evaluacionesPorEstado: evaluacionesPorEstado(),
        evaluacionesPorTaller: evaluacionesPorTaller(),
        documentosPorEstado: documentosPorEstado(),
        documentosPorTipo: documentosPorTipo(),
        procesosPorEtapa: procesosPorEtapa(),
        procesosPorEstado: procesosPorEstado(),
        evaluacionesPendientes: contarPorEstado(evaluaciones(), 'Pendiente'),
        evaluacionesAprobadas: contarPorEstado(evaluaciones(), 'Aprobada'),
        evaluacionesReprobadas: contarPorEstado(evaluaciones(), 'Reprobada'),
      },
    });

    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-psa-${todayIsoDate()}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <section aria-label="Reportes de métricas del proceso">
      <div class="reportes__header">
        {paso() === 'vistaPrevia' && (
          <button
            class="btn btn-ghost btn-sm reportes__volver"
            type="button"
            onClick={volverASleccion}
          >
            <Icon name="chevron-left" size={16} />
            Volver a selección
          </button>
        )}
        <div class="reportes__header-row">
          <div class="reportes__heading">
            {paso() === 'seleccion' ? (
              <>
                <h1 class="reportes__title">Seleccionar tipo de reporte</h1>
                <p class="reportes__description">
                  Elige la plantilla de reporte que deseas generar. Cada una incluye
                  distintas secciones y métricas del proceso de pasantía.
                </p>
              </>
            ) : (
              <>
                <h1 class="reportes__title">
                  Vista previa — {plantilla().nombre}
                </h1>
                <p class="reportes__description">
                  Revisa el contenido del reporte antes de descargarlo. Puedes
                  cambiar la plantilla desde la selección.
                </p>
              </>
            )}
          </div>
          <div class="reportes__actions">
            {paso() === 'vistaPrevia' && (
              <Button variant="primary" onClick={exportarPdf}>
                <Icon name="download" size={16} />
                Descargar reporte PDF
              </Button>
            )}
          </div>
        </div>
      </div>

      <Show when={paso() === 'seleccion'}>
        <div class="reportes__grid-plantillas">
          {PLANTILLA_IDS.map((id) => obtenerPlantilla(id)).map((p) => (
            <button
              class="reportes__plantilla-card"
              classList={{
                'reportes__plantilla-card--activa': plantillaId() === p.id,
              }}
              type="button"
              onClick={() => seleccionarPlantilla(p.id)}
            >
              <div class="reportes__plantilla-card-head">
                <span class="reportes__plantilla-card-nombre">{p.nombre}</span>
                {plantillaId() === p.id && <Icon name="check" size={16} />}
              </div>
              <p class="reportes__plantilla-card-desc">{p.descripcion}</p>
              <div class="reportes__plantilla-card-secciones">
                {p.secciones.map((s) => (
                  <span class="reportes__plantilla-card-chip">{s.titulo}</span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </Show>

      <Show when={paso() === 'vistaPrevia'}>
        <div class="reportes__vista-previa">
          <div class="reportes__secciones-preview">
            {plantilla().secciones.map((seccion) => (
              <SeccionReporte
                id={seccion.id}
                titulo={seccion.titulo}
                subsecciones={seccion.subsecciones}
                metricaValor={metricaValor}
                filasPorClave={(clave: string) => {
                  switch (clave) {
                    case 'estudiantesPorEstado': return estudiantesPorEstado();
                    case 'estudiantesPorTaller': return estudiantesPorTaller();
                    case 'plazasPorEstado': return plazasPorEstado();
                    case 'plazasPorCentro': return plazasPorCentro();
                    case 'evaluacionesPorEstado': return evaluacionesPorEstado();
                    case 'evaluacionesPorTaller': return evaluacionesPorTaller();
                    case 'documentosPorEstado': return documentosPorEstado();
                    case 'documentosPorTipo': return documentosPorTipo();
                    case 'procesosPorEtapa': return procesosPorEtapa();
                    case 'procesosPorEstado': return procesosPorEstado();
                    default: return [];
                  }
                }}
                metricaSimple={(clave: string) => metricaValor(clave)}
                contarEvaluacionesEstado={(estado: string) =>
                  contarPorEstado(evaluaciones(), estado)}
              />
            ))}
          </div>
        </div>
      </Show>

      <Show
        when={
          paso() === 'vistaPrevia' &&
          estudiantes().length === 0 &&
          plazas().length === 0
        }
      >
        <Alert tone="info">
          No hay datos suficientes para generar el reporte. Agrega registros en
          los módulos correspondientes y vuelve a cargar esta página.
        </Alert>
      </Show>
    </section>
  );
};

export default ReportesWorkspace;
