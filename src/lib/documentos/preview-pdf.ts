/**
 * PDF de respaldo para documentos sin archivo local.
 *
 * Capa: lib/documentos
 * Las filas de ejemplo y las altas administrativas no tienen binario. Este
 * módulo genera una vista previa legible con los metadatos del expediente para
 * que el visor siempre muestre un PDF válido.
 */

import { formatLongDate } from '@/lib/format/date';
import { PDF_LAYOUT } from '@/lib/reportes/pdf-theme';
import { truncateText, wrapText } from '@/lib/reportes/pdf-text';
import { buildPdf, PdfCanvas } from '@/lib/reportes/pdf-writer';
import type { ResourceRow } from '@/types/resource';

/** Devuelve un valor visible o el texto de respaldo. */
function valueOrEmpty(value: unknown, fallback = 'Sin registrar'): string {
  const text = String(value ?? '').trim();
  return text || fallback;
}

/** Convierte una fecha ISO en una fecha larga; conserva el texto si no lo es. */
function readableDate(value: unknown): string {
  const text = String(value ?? '').trim();
  if (!text) return 'Sin registrar';
  const parts = text.split('-').map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return text;
  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day, 12);
  return Number.isNaN(date.getTime()) ? text : formatLongDate(date);
}

/**
 * Obtiene el nombre del PDF para mostrarlo y descargarlo.
 *
 * @param row Fila del documento.
 * @returns Nombre base con extensión `.pdf`.
 */
export function documentPdfFileName(row: ResourceRow): string {
  const raw = String(row.archivo ?? row.storage_path ?? '');
  const base = raw.split(/[\\/]/).pop() ?? '';
  const clean = base
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/^[.\s-]+/, '')
    .trim();
  const name = clean || 'documento.pdf';
  return /\.pdf$/i.test(name) ? name : `${name}.pdf`;
}

/**
 * Construye un PDF de demostración con los datos visibles del documento.
 *
 * @param row Fila del expediente.
 * @returns Blob PDF listo para un `blob:` URL.
 */
export function createDocumentPreviewPdf(row: ResourceRow): Blob {
  const canvas = new PdfCanvas();
  const left = PDF_LAYOUT.margin;
  const right = PDF_LAYOUT.pageWidth - PDF_LAYOUT.margin;
  const width = PDF_LAYOUT.contentWidth;
  const title = truncateText(valueOrEmpty(row.tipo, 'Documento'), width, 22, true);

  canvas.rect(left, 774, 48, 4, 'accent');
  canvas.text('PSA · GESTIÓN DE PASANTÍAS', left, 788, {
    size: 8,
    bold: true,
    color: 'accent',
  });
  canvas.text('VISTA PREVIA', right, 788, {
    size: 8,
    bold: true,
    color: 'muted',
    align: 'right',
  });
  canvas.text(title, left, 738, { size: 22, bold: true, color: 'ink' });
  canvas.line(left, 722, right, 722, 'border', 0.75);

  const fields: Array<[string, string]> = [
    ['Estudiante', valueOrEmpty(row.estudiante)],
    ['Taller', valueOrEmpty(row.taller)],
    ['Estado', valueOrEmpty(row.estado)],
    ['Fecha de registro', readableDate(row.fecha_creacion)],
    ['Archivo', documentPdfFileName(row)],
  ];

  let y = 686;
  for (const [label, value] of fields) {
    canvas.text(label.toLocaleUpperCase('es-MX'), left, y, {
      size: 8,
      bold: true,
      color: 'muted',
    });
    canvas.text(truncateText(value, width, 11), left, y - 16, {
      size: 11,
      color: 'ink',
    });
    y -= 44;
  }

  canvas.box(left, 326, width, 96, {
    fill: 'accentSoft',
    stroke: 'border',
    lineWidth: 0.75,
  });
  canvas.text('Documento de demostración', left + 14, 402, {
    size: 10,
    bold: true,
    color: 'accent',
  });

  const note =
    'Este PDF se generó automáticamente para la vista previa de la demostración. ' +
    'El archivo original no está disponible en este navegador.';
  const lines = wrapText(note, width - 28, 9, false, 3);
  lines.forEach((line, index) => {
    canvas.text(line, left + 14, 384 - index * 13, { size: 9, color: 'muted' });
  });

  const bytes = buildPdf([{ ops: canvas.ops }], {
    footer: 'PSA · Documento de demostración',
  });
  return new Blob([bytes], { type: 'application/pdf' });
}
