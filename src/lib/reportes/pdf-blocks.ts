/**
 * Bloques y paginación de los reportes PDF.
 *
 * Capa: lib/reportes
 * Recibe un documento declarativo (portada, secciones, tarjetas, gráficos y
 * notas), decide los saltos de página y delega el dibujo a las piezas visuales.
 */

import { drawCards, cardsHeight, type PdfMetricCard } from '@/lib/reportes/pdf-cards';
import { drawChart, chartHeight, type PdfChartSpec } from '@/lib/reportes/pdf-charts';
import {
  drawCover,
  drawNote,
  drawSection,
  noteHeight,
  COVER_HEIGHT,
  SECTION_HEIGHT,
  type PdfCoverBlock,
  type PdfNoteBlock,
  type PdfSectionBlock,
} from '@/lib/reportes/pdf-pages';
import { buildPdf, PdfCanvas } from '@/lib/reportes/pdf-writer';
import { PDF_LAYOUT } from '@/lib/reportes/pdf-theme';

export type { PdfCoverBlock, PdfNoteBlock, PdfSectionBlock } from '@/lib/reportes/pdf-pages';

/** Cuadrícula de indicadores. */
export interface PdfCardsBlock {
  type: 'cards';
  cards: readonly PdfMetricCard[];
  columns?: number;
}

/** Gráfico de distribución. */
export interface PdfChartBlock {
  type: 'chart';
  chart: PdfChartSpec;
}

/** Separación vertical entre bloques. */
export interface PdfSpacerBlock {
  type: 'spacer';
  size: number;
}

/** Salto de página explícito. */
export interface PdfPageBreakBlock {
  type: 'page-break';
}

/** Bloque del documento declarativo. */
export type PdfBlock =
  | PdfCoverBlock
  | PdfSectionBlock
  | PdfCardsBlock
  | PdfChartBlock
  | PdfNoteBlock
  | PdfSpacerBlock
  | PdfPageBreakBlock;

/** Marco del documento: pie y título de continuación. */
export interface PdfReportOptions {
  footer: string;
  runningTitle: string;
}

const MAX_CHART_ROWS = 30;

/** Alto del siguiente bloque para evitar encabezados huérfanos. */
function nextBlockHeight(block: PdfBlock | undefined): number {
  if (!block) return 0;
  if (block.type === 'cards') {
    return cardsHeight(block.cards.length, block.columns ?? 3);
  }
  if (block.type === 'chart') {
    return chartHeight(Math.min(block.chart.rows.length, MAX_CHART_ROWS));
  }
  if (block.type === 'note') return noteHeight(block);
  return 0;
}

/**
 * Construye el PDF de un reporte con portada, secciones y pie numerado.
 *
 * @param blocks Documento declarativo en orden de lectura.
 * @param options Textos del marco comunes a todas las páginas.
 * @returns Bytes del documento con extensión `.pdf`.
 */
export function buildReportPdf(
  blocks: readonly PdfBlock[],
  options: PdfReportOptions,
): Uint8Array<ArrayBuffer> {
  const pages: PdfCanvas[] = [new PdfCanvas()];
  let y = PDF_LAYOUT.top;

  const current = () => pages[pages.length - 1];
  const newPage = () => {
    pages.push(new PdfCanvas());
    y = PDF_LAYOUT.top;
  };
  const ensure = (height: number) => {
    if (y - height < PDF_LAYOUT.bottom && current().ops.length > 0) newPage();
  };

  blocks.forEach((block, index) => {
    switch (block.type) {
      case 'cover':
        drawCover(current(), block, y);
        y -= COVER_HEIGHT + 20;
        break;
      case 'section':
        if (block.newPage && current().ops.length > 0) {
          newPage();
        } else {
          const reserved = SECTION_HEIGHT + 14 + nextBlockHeight(blocks[index + 1]);
          ensure(Math.min(reserved, 320));
        }
        y -= drawSection(current(), block, y) + 14;
        break;
      case 'cards': {
        const columns = block.columns ?? 3;
        const height = cardsHeight(block.cards.length, columns);
        ensure(height);
        drawCards(current(), block.cards, PDF_LAYOUT.margin, y, PDF_LAYOUT.contentWidth, columns);
        y -= height + 16;
        break;
      }
      case 'chart': {
        let rows = [...block.chart.rows];
        let continuation = false;
        while (rows.length > 0 || !continuation) {
          const chunk = rows.slice(0, MAX_CHART_ROWS);
          const height = chartHeight(chunk.length);
          ensure(height);
          drawChart(
            current(),
            {
              ...block.chart,
              title: continuation ? `${block.chart.title} (continuación)` : block.chart.title,
              rows: chunk,
            },
            PDF_LAYOUT.margin,
            y,
            PDF_LAYOUT.contentWidth,
          );
          y -= height + 14;
          rows = rows.slice(chunk.length);
          continuation = true;
          if (rows.length > 0) newPage();
        }
        break;
      }
      case 'note':
        ensure(noteHeight(block));
        y -= drawNote(current(), block, y) + 16;
        break;
      case 'spacer':
        y -= block.size;
        break;
      case 'page-break':
        if (current().ops.length > 0) newPage();
        break;
      default:
        break;
    }
  });

  return buildPdf(pages, {
    footer: options.footer,
    runningTitle: options.runningTitle,
  });
}
