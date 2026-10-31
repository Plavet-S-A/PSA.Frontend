/**
 * Gráficos de barras horizontales para los reportes PDF.
 *
 * Capa: lib/reportes
 * Dibuja una tarjeta con título, contexto y una barra por grupo. No conoce
 * plantillas ni métricas del dominio.
 */

import { PdfCanvas } from '@/lib/reportes/pdf-writer';
import { truncateText } from '@/lib/reportes/pdf-text';

/** Fila de un gráfico: etiqueta y conteo. */
export interface PdfChartRow {
  label: string;
  value: number;
}

/** Especificación visual de un gráfico. */
export interface PdfChartSpec {
  title: string;
  description?: string;
  rows: readonly PdfChartRow[];
}

const ROW_HEIGHT = 19;
const HEADER_HEIGHT = 46;
const BOTTOM_PADDING = 12;

/** Alto total de una tarjeta de gráfico. */
export function chartHeight(rows: number): number {
  const visibleRows = Math.max(1, rows);
  return HEADER_HEIGHT + visibleRows * ROW_HEIGHT + BOTTOM_PADDING;
}

/** Formatea el conteo y su participación sobre el total. */
function valueLabel(value: number, total: number): string {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return `${value} · ${pct}%`;
}

/**
 * Dibuja un gráfico de barras desde su borde superior.
 *
 * @returns Alto consumido por la tarjeta.
 */
export function drawChart(
  canvas: PdfCanvas,
  chart: PdfChartSpec,
  x: number,
  top: number,
  width: number,
): number {
  const height = chartHeight(chart.rows.length);
  const bottom = top - height;
  const total = chart.rows.reduce((sum, row) => sum + row.value, 0);
  const inset = 14;
  const right = x + width - inset;

  canvas.roundedBox(x, bottom, width, height, 8, {
    fill: 'white',
    stroke: 'border',
    lineWidth: 0.75,
  });
  canvas.roundedBox(x, top - 4, width, 4, 2, { fill: 'accent' });

  canvas.text(truncateText(chart.title, width - 120, 9.5, true), x + inset, top - 20, {
    size: 9.5,
    bold: true,
    color: 'ink',
  });
  canvas.text(`${total} registros`, right, top - 20, {
    size: 7,
    color: 'faint',
    align: 'right',
  });

  if (chart.description) {
    canvas.text(
      truncateText(chart.description, width - inset * 2, 7),
      x + inset,
      top - 33,
      { size: 7, color: 'muted' },
    );
  }
  canvas.line(x + inset, top - 41, right, top - 41, 'border', 0.75);

  if (chart.rows.length === 0) {
    canvas.text('Sin registros disponibles.', x + inset, top - 58, {
      size: 8,
      color: 'faint',
    });
    return height;
  }

  const max = Math.max(1, ...chart.rows.map((row) => row.value));
  const labelWidth = width >= 400 ? 140 : 92;
  const valueWidth = 54;
  const trackX = x + inset + labelWidth + 8;
  const trackWidth = Math.max(36, right - trackX - valueWidth - 8);

  chart.rows.forEach((row, index) => {
    const baseline = top - 56 - index * ROW_HEIGHT;
    const barWidth = Math.max(2, (row.value / max) * trackWidth);
    canvas.text(truncateText(row.label, labelWidth, 7.5), x + inset, baseline, {
      size: 7.5,
      color: 'muted',
    });
    canvas.roundedBox(trackX, baseline - 2, trackWidth, 6, 3, { fill: 'track' });
    canvas.roundedBox(trackX, baseline - 2, barWidth, 6, 3, { fill: 'accent' });
    canvas.text(valueLabel(row.value, total), right, baseline, {
      size: 7.3,
      color: 'ink',
      align: 'right',
    });
  });

  return height;
}
