/**
 * Tema visual compartido por los reportes PDF.
 *
 * Capa: lib/reportes
 * Paleta, medidas de página y tipos de color. No conoce el dominio.
 */

/** Paleta compartida por las piezas del reporte. */
export const PDF_COLORS = {
  ink: '0.102 0.122 0.141',
  muted: '0.357 0.392 0.427',
  faint: '0.58 0.61 0.64',
  accent: '0.541 0.106 0.173',
  accentSoft: '0.973 0.925 0.937',
  surface: '0.976 0.973 0.969',
  border: '0.886 0.871 0.871',
  track: '0.937 0.929 0.925',
  white: '1 1 1',
  success: '0.184 0.49 0.353',
  warning: '0.72 0.49 0.07',
  danger: '0.706 0.196 0.203',
  info: '0.17 0.42 0.6',
} as const;

/** Nombre de color de la paleta. */
export type PdfColor = keyof typeof PDF_COLORS;

/** Medidas base de la hoja A4 y sus márgenes. */
export const PDF_LAYOUT = {
  pageWidth: 595.28,
  pageHeight: 841.89,
  margin: 48,
  contentWidth: 595.28 - 48 * 2,
  top: 841.89 - 48,
  bottom: 64,
} as const;
