/**
 * Portada, encabezados de sección y notas de los reportes PDF.
 *
 * Capa: lib/reportes
 * Piezas editoriales reutilizables por el paginador del documento.
 */

import { PDF_LAYOUT } from '@/lib/reportes/pdf-theme';
import { wrapText } from '@/lib/reportes/pdf-text';
import { PdfCanvas } from '@/lib/reportes/pdf-writer';

/** Portada del reporte. */
export interface PdfCoverBlock {
  type: 'cover';
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  meta: readonly string[];
}

/** Encabezado de una sección numerada. */
export interface PdfSectionBlock {
  type: 'section';
  index: number;
  title: string;
  description?: string;
  /** Inicia una página nueva cuando ya hay contenido. */
  newPage?: boolean;
}

/** Nota al pie de una sección. */
export interface PdfNoteBlock {
  type: 'note';
  title?: string;
  text: string;
}

/** Alto reservado por la portada. */
export const COVER_HEIGHT = 184;

/** Alto reservado por el encabezado de una sección. */
export const SECTION_HEIGHT = 58;

/** Dibuja la portada y devuelve el alto consumido. */
export function drawCover(
  canvas: PdfCanvas,
  cover: PdfCoverBlock,
  top: number,
): number {
  const x = PDF_LAYOUT.margin;
  const width = PDF_LAYOUT.contentWidth;
  const bottom = top - COVER_HEIGHT;

  canvas.roundedBox(x, top - 5, 62, 5, 2.5, { fill: 'accent' });
  canvas.text(cover.eyebrow.toUpperCase(), x, top - 26, {
    size: 7.4,
    bold: true,
    color: 'accent',
  });
  canvas.text(cover.title, x, top - 61, { size: 26, bold: true, color: 'ink' });
  canvas.text(cover.subtitle, x, top - 84, { size: 12.5, bold: true, color: 'accent' });

  const description = wrapText(cover.description, width - 70, 8.8, false, 2);
  description.forEach((line, index) => {
    canvas.text(line, x, top - 106 - index * 12, { size: 8.8, color: 'muted' });
  });

  const metaTop = bottom + 48;
  canvas.roundedBox(x, metaTop - 34, width, 34, 6, {
    fill: 'surface',
    stroke: 'border',
    lineWidth: 0.75,
  });
  const metaLines = wrapText(cover.meta.join('   ·   '), width - 28, 7.4, false, 2);
  metaLines.forEach((line, index) => {
    canvas.text(line, x + 14, metaTop - 14 - index * 10, {
      size: 7.4,
      color: 'muted',
    });
  });

  canvas.line(x, bottom, x + width, bottom, 'border', 0.75);
  return COVER_HEIGHT;
}

/** Dibuja el encabezado de sección con número e hilo inferior. */
export function drawSection(
  canvas: PdfCanvas,
  section: PdfSectionBlock,
  top: number,
): number {
  const x = PDF_LAYOUT.margin;
  const width = PDF_LAYOUT.contentWidth;
  const index = String(section.index).padStart(2, '0');

  canvas.text(index, x, top - 17, { size: 9, bold: true, color: 'accent' });
  canvas.text(section.title, x + 32, top - 18, {
    size: 13.5,
    bold: true,
    color: 'ink',
  });
  if (section.description) {
    canvas.text(section.description, x + 32, top - 34, {
      size: 7.6,
      color: 'muted',
    });
  }
  canvas.line(
    x,
    top - SECTION_HEIGHT + 10,
    x + width,
    top - SECTION_HEIGHT + 10,
    'border',
    0.75,
  );
  return SECTION_HEIGHT;
}

/** Estimación de alto de una nota informativa. */
export function noteHeight(note: PdfNoteBlock): number {
  const lines = wrapText(note.text, PDF_LAYOUT.contentWidth - 28, 7.4).length;
  return 24 + lines * 10 + (note.title ? 10 : 0);
}

/** Dibuja una nota informativa con acento lateral. */
export function drawNote(
  canvas: PdfCanvas,
  note: PdfNoteBlock,
  top: number,
): number {
  const x = PDF_LAYOUT.margin;
  const width = PDF_LAYOUT.contentWidth;
  const height = noteHeight(note);
  const bottom = top - height;
  canvas.roundedBox(x, bottom, width, height, 6, {
    fill: 'accentSoft',
    stroke: 'border',
    lineWidth: 0.75,
  });
  canvas.roundedBox(x, bottom, 3, height, 1.5, { fill: 'accent' });
  const startY = top - 17;
  if (note.title) {
    canvas.text(note.title.toUpperCase(), x + 14, startY, {
      size: 7,
      bold: true,
      color: 'accent',
    });
  }
  const textTop = note.title ? top - 30 : startY;
  wrapText(note.text, width - 28, 7.4).forEach((line, index) => {
    canvas.text(line, x + 14, textTop - index * 10, {
      size: 7.4,
      color: 'muted',
    });
  });
  return height;
}
