/**
 * Escritor PDF mínimo para reportes de pasantía.
 *
 * Capa: lib/reportes
 * Concentra la codificación WinAnsi, el dibujo de primitivas y el ensamblado
 * de objetos PDF. No conoce el dominio de reportes ni el DOM.
 */

import { cleanText, encodeText, textWidth } from '@/lib/reportes/pdf-text';
import { PDF_COLORS, PDF_LAYOUT, type PdfColor } from '@/lib/reportes/pdf-theme';

/** Página PDF con sus operadores de contenido ya dibujados. */
export interface PdfPage {
  ops: string[];
}

/** Opciones tipográficas de un texto PDF. */
export interface PdfTextOptions {
  size?: number;
  bold?: boolean;
  color?: PdfColor;
  align?: 'left' | 'right' | 'center';
}

/** Lienzo de una página con las primitivas que usa el reporte. */
export class PdfCanvas {
  readonly ops: string[] = [];

  /** Dibuja texto en coordenadas absolutas. */
  text(text: string, x: number, y: number, options: PdfTextOptions = {}): void {
    const size = options.size ?? 9;
    const bold = options.bold ?? false;
    const color = PDF_COLORS[options.color ?? 'ink'];
    const clean = cleanText(text);
    let drawX = x;
    if (options.align === 'right') drawX -= textWidth(clean, size, bold);
    if (options.align === 'center') drawX -= textWidth(clean, size, bold) / 2;
    const font = bold ? '/F2' : '/F1';
    this.ops.push(
      `BT ${font} ${size} Tf ${color} rg 1 0 0 1 ${drawX.toFixed(2)} ${y.toFixed(2)} Tm (${encodeText(clean)}) Tj ET`,
    );
  }

  /** Dibuja un rectángulo relleno. */
  rect(x: number, y: number, width: number, height: number, color: PdfColor): void {
    this.ops.push(
      `q ${PDF_COLORS[color]} rg ${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f Q`,
    );
  }

  /** Dibuja un rectángulo con borde y relleno opcionales. */
  box(
    x: number,
    y: number,
    width: number,
    height: number,
    options: { fill?: PdfColor; stroke?: PdfColor; lineWidth?: number } = {},
  ): void {
    const ops = ['q'];
    if (options.fill) ops.push(`${PDF_COLORS[options.fill]} rg`);
    if (options.stroke) ops.push(`${PDF_COLORS[options.stroke]} RG ${options.lineWidth ?? 1} w`);
    ops.push(`${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re`);
    ops.push(options.fill && options.stroke ? 'B' : options.fill ? 'f' : 'S', 'Q');
    this.ops.push(ops.join(' '));
  }

  /** Dibuja un rectángulo redondeado con relleno y borde opcionales. */
  roundedBox(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    options: { fill?: PdfColor; stroke?: PdfColor; lineWidth?: number } = {},
  ): void {
    const r = Math.min(radius, width / 2, height / 2);
    const k = r * 0.4477;
    const path = [
      `${(x + r).toFixed(2)} ${y.toFixed(2)} m`,
      `${(x + width - r).toFixed(2)} ${y.toFixed(2)} l`,
      `${(x + width - r + k).toFixed(2)} ${y.toFixed(2)} ${(x + width).toFixed(2)} ${(y + r - k).toFixed(2)} ${(x + width).toFixed(2)} ${(y + r).toFixed(2)} c`,
      `${(x + width).toFixed(2)} ${(y + height - r).toFixed(2)} l`,
      `${(x + width).toFixed(2)} ${(y + height - r + k).toFixed(2)} ${(x + width - r + k).toFixed(2)} ${(y + height).toFixed(2)} ${(x + width - r).toFixed(2)} ${(y + height).toFixed(2)} c`,
      `${(x + r).toFixed(2)} ${(y + height).toFixed(2)} l`,
      `${(x + r - k).toFixed(2)} ${(y + height).toFixed(2)} ${x.toFixed(2)} ${(y + height - r + k).toFixed(2)} ${x.toFixed(2)} ${(y + height - r).toFixed(2)} c`,
      `${x.toFixed(2)} ${(y + r).toFixed(2)} l`,
      `${x.toFixed(2)} ${(y + r - k).toFixed(2)} ${(x + r - k).toFixed(2)} ${y.toFixed(2)} ${(x + r).toFixed(2)} ${y.toFixed(2)} c`,
      'h',
    ].join(' ');
    const ops = ['q'];
    if (options.fill) ops.push(`${PDF_COLORS[options.fill]} rg`);
    if (options.stroke) ops.push(`${PDF_COLORS[options.stroke]} RG ${options.lineWidth ?? 1} w`);
    ops.push(path, options.fill && options.stroke ? 'B' : options.fill ? 'f' : 'S', 'Q');
    this.ops.push(ops.join(' '));
  }

  /** Dibuja una línea horizontal o vertical. */
  line(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: PdfColor,
    width = 1,
  ): void {
    this.ops.push(
      `q ${PDF_COLORS[color]} RG ${width} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S Q`,
    );
  }
}

/** Opciones del marco común de las páginas. */
export interface PdfChrome {
  footer: string;
  runningTitle?: string;
}

/** Agrega encabezado de continuación y pie numerado a cada página. */
function decoratePages(pages: readonly PdfPage[], chrome: PdfChrome): void {
  const total = pages.length;
  pages.forEach((page, index) => {
    const canvas = new PdfCanvas();
    if (index > 0) {
      canvas.text('PSA · REPORTE DE PASANTÍAS', PDF_LAYOUT.margin, 812, {
        size: 7,
        bold: true,
        color: 'accent',
      });
      if (chrome.runningTitle) {
        canvas.text(chrome.runningTitle, PDF_LAYOUT.pageWidth - PDF_LAYOUT.margin, 812, {
          size: 7,
          color: 'muted',
          align: 'right',
        });
      }
      canvas.line(
        PDF_LAYOUT.margin,
        801,
        PDF_LAYOUT.pageWidth - PDF_LAYOUT.margin,
        801,
        'border',
        0.75,
      );
    }

    canvas.line(
      PDF_LAYOUT.margin,
      45,
      PDF_LAYOUT.pageWidth - PDF_LAYOUT.margin,
      45,
      'border',
      0.75,
    );
    canvas.text(chrome.footer, PDF_LAYOUT.margin, 31, { size: 7.5, color: 'muted' });
    canvas.text(`Página ${index + 1} de ${total}`, PDF_LAYOUT.pageWidth - PDF_LAYOUT.margin, 31, {
      size: 7.5,
      color: 'muted',
      align: 'right',
    });

    page.ops.push(...canvas.ops);
    canvas.ops.length = 0;
  });
}

/**
 * Ensambla un PDF completo a partir de páginas ya dibujadas.
 *
 * @param pages Páginas en orden de lectura.
 * @param chrome Pie común y título corto para páginas de continuación.
 * @returns Bytes del documento con extensión `.pdf`.
 */
export function buildPdf(
  pages: readonly PdfPage[],
  chrome: PdfChrome,
): Uint8Array<ArrayBuffer> {
  decoratePages(pages, chrome);

  // Objetos PDF: catálogo, árbol de páginas, dos fuentes y cada página con su
  // flujo de contenido. Los números se reservan en ese orden.
  const objects = new Map<number, string>([
    [1, '<< /Type /Catalog /Pages 2 0 R >>'],
    [
      3,
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    ],
    [
      4,
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    ],
  ]);
  const kids = pages.map((_, index) => `${5 + index * 2} 0 R`).join(' ');
  objects.set(2, `<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`);

  pages.forEach((page, index) => {
    const content = page.ops.join('\n');
    const pageObject = 5 + index * 2;
    const contentObject = pageObject + 1;
    objects.set(
      pageObject,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_LAYOUT.pageWidth} ${PDF_LAYOUT.pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObject} 0 R >>`,
    );
    objects.set(
      contentObject,
      `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    );
  });

  const totalObjects = 4 + pages.length * 2;
  let body = '%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n';
  const offsets: number[] = [];
  for (let objectNumber = 1; objectNumber <= totalObjects; objectNumber += 1) {
    offsets[objectNumber] = body.length;
    body += `${objectNumber} 0 obj\n${objects.get(objectNumber) ?? ''}\nendobj\n`;
  }

  const xrefStart = body.length;
  body += `xref\n0 ${totalObjects + 1}\n0000000000 65535 f \n`;
  for (let objectNumber = 1; objectNumber <= totalObjects; objectNumber += 1) {
    body += `${String(offsets[objectNumber]).padStart(10, '0')} 00000 n \n`;
  }
  body += `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  // Cada carácter de `body` representa exactamente un byte WinAnsi.
  const bytes = new Uint8Array(body.length);
  for (let index = 0; index < body.length; index += 1) {
    bytes[index] = body.charCodeAt(index) & 0xff;
  }
  return bytes;
}
