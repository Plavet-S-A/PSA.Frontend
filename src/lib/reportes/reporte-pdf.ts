/**
 * Composición de reportes de pasantía en PDF.
 *
 * Capa: lib/reportes
 * Traduce la plantilla y las métricas agregadas a un documento declarativo con
 * portada, indicadores, gráficos y notas.
 */

import { buildReportPdf, type PdfBlock } from '@/lib/reportes/pdf-blocks';
import {
  overviewCards,
  sectionBlocks,
  type ReportePdfDatos,
} from '@/lib/reportes/reporte-pdf-datos';
import type { ReportePlantilla } from '@/lib/reportes/plantillas';

export type { ReportePdfDatos } from '@/lib/reportes/reporte-pdf-datos';

/** Entrada del generador. */
export interface ReportePdfInput {
  plantilla: ReportePlantilla;
  datos: ReportePdfDatos;
  /** Fecha legible que se imprime en la portada. */
  generado: string;
}

/**
 * Construye el archivo PDF completo.
 *
 * @param input Plantilla, datos agregados y fecha de generación.
 * @returns Bytes del documento con extensión `.pdf`.
 */
export function crearReportePdf(input: ReportePdfInput): Uint8Array<ArrayBuffer> {
  const blocks: PdfBlock[] = [
    {
      type: 'cover',
      eyebrow: 'PSA · Gestión de pasantías',
      title: 'Reporte de pasantías',
      subtitle: input.plantilla.nombre,
      description: input.plantilla.descripcion,
      meta: [
        `Generado: ${input.generado}`,
        `Plantilla: ${input.plantilla.nombre}`,
        'Documento informativo',
      ],
    },
    {
      type: 'section',
      index: 1,
      title: 'Panorama general',
      description: 'Indicadores consolidados de estudiantes, plazas, evaluaciones y documentos.',
    },
    { type: 'cards', cards: overviewCards(input.datos), columns: 4 },
    {
      type: 'note',
      title: 'Nota metodológica',
      text:
        'Las cifras se calculan a partir de los registros disponibles al momento de generar el reporte. ' +
        'Los porcentajes de cada gráfico se calculan sobre el total de registros de ese grupo. ' +
        'La vista previa y este documento usan la misma fuente de datos.',
    },
  ];

  input.plantilla.secciones.forEach((section, index) => {
    blocks.push(...sectionBlocks(section.id, index + 2, input.plantilla, input.datos));
  });

  return buildReportPdf(blocks, {
    footer: 'PSA · Plataforma de pasantías',
    runningTitle: input.plantilla.nombre,
  });
}
