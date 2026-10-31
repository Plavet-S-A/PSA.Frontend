/**
 * Tarjetas de indicadores para los reportes PDF.
 *
 * Capa: lib/reportes
 * Dibuja una cuadrícula de tarjetas con etiqueta, valor y tono. No conoce
 * plantillas ni métricas del dominio.
 */

import { PdfCanvas } from '@/lib/reportes/pdf-writer';
import { truncateText, wrapText } from '@/lib/reportes/pdf-text';
import type { PdfColor } from '@/lib/reportes/pdf-theme';

/** Tono semántico de una tarjeta. */
export type PdfMetricTone = 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

/** Contenido de una tarjeta. */
export interface PdfMetricCard {
  label: string;
  value: string;
  hint?: string;
  tone?: PdfMetricTone;
}

const CARD_HEIGHT = 70;
const CARD_GAP = 8;
const TONE_COLOR: Record<PdfMetricTone, PdfColor> = {
  accent: 'accent',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  info: 'info',
  neutral: 'muted',
};

/** Alto total de una cuadrícula de tarjetas. */
export function cardsHeight(count: number, columns = 3): number {
  if (count <= 0) return 0;
  const rows = Math.ceil(count / columns);
  return rows * CARD_HEIGHT + (rows - 1) * CARD_GAP;
}

/**
 * Dibuja una cuadrícula de tarjetas desde su borde superior.
 *
 * @returns Alto consumido, incluido el espacio entre filas.
 */
export function drawCards(
  canvas: PdfCanvas,
  cards: readonly PdfMetricCard[],
  x: number,
  top: number,
  width: number,
  columns = 3,
): number {
  if (cards.length === 0) return 0;
  const gap = CARD_GAP;
  const cardWidth = (width - gap * (columns - 1)) / columns;

  cards.forEach((card, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const left = x + column * (cardWidth + gap);
    const cardTop = top - row * (CARD_HEIGHT + gap);
    const cardBottom = cardTop - CARD_HEIGHT;
    const tone = TONE_COLOR[card.tone ?? 'accent'];

    canvas.roundedBox(left, cardBottom, cardWidth, CARD_HEIGHT, 7, {
      fill: 'surface',
      stroke: 'border',
      lineWidth: 0.75,
    });
    canvas.roundedBox(left, cardBottom, 4, CARD_HEIGHT, 2, { fill: tone });

    canvas.text(card.label.toUpperCase(), left + 14, cardTop - 19, {
      size: 6.6,
      bold: true,
      color: 'muted',
    });

    const valueSize = card.value.length > 12 ? 14 : 20;
    canvas.text(
      truncateText(card.value, cardWidth - 24, valueSize, true),
      left + 14,
      cardTop - 44,
      { size: valueSize, bold: true, color: 'ink' },
    );

    if (card.hint) {
      const hint = wrapText(card.hint, cardWidth - 24, 6.4, false, 1)[0] ?? '';
      canvas.text(hint, left + 14, cardTop - 58, { size: 6.4, color: 'faint' });
    }
  });

  return cardsHeight(cards.length, columns);
}
