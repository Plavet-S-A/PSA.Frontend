/**
 * Exportación de documentos de calificación a un archivo HTML independiente.
 *
 * Capa: lib/grading
 * El contenido del usuario se escapa siempre. El archivo descargado no incluye
 * scripts ni recursos externos y puede abrirse en el navegador o en Word.
 */

import { formatDateInput } from '@/lib/format/date';

/** Datos visibles de un documento de calificación. */
export interface GradeDocumentHtmlInput {
  heading: string;
  body: string;
  footer: string;
  student: string;
  taller: string;
  plaza: string;
  grade: string;
  status: string;
  issuedAt: string;
}

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Escapa texto antes de incorporarlo al archivo HTML.
 *
 * @param value Texto sin confianza.
 * @returns Texto seguro para un nodo de texto o atributo.
 */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ESCAPES[character] ?? character);
}

/**
 * Construye un archivo HTML autónomo y seguro.
 *
 * @param input Datos del documento y de la evaluación.
 * @returns Documento HTML completo.
 */
export function buildGradeDocumentHtml(input: GradeDocumentHtmlInput): string {
  const title = escapeHtml(input.heading || 'Documento de calificación');
  const grade = input.grade ? `${escapeHtml(input.grade)}/100` : 'Sin calificación';

  return `<!doctype html>
<html lang="es-MX">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="generator" content="PSA · Plataforma de Seguimiento de Pasantías">
  <title>${title}</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 32px 20px;
      background: Canvas;
      color: CanvasText;
      font-family: Georgia, "Times New Roman", serif;
      line-height: 1.65;
    }
    main {
      max-width: 720px;
      margin: 0 auto;
      padding: 48px;
      border: 1px solid GrayText;
      border-radius: 2px;
      background: Canvas;
    }
    .brand {
      margin: 0 0 4px;
      color: GrayText;
      font-family: ui-sans-serif, system-ui, sans-serif;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    h1 {
      margin: 0 0 28px;
      font-size: 26px;
      line-height: 1.25;
    }
    .meta {
      width: 100%;
      margin: 0 0 28px;
      border-collapse: collapse;
      font-family: ui-sans-serif, system-ui, sans-serif;
      font-size: 13px;
    }
    .meta th,
    .meta td {
      padding: 8px 12px;
      border: 1px solid GrayText;
      text-align: left;
      vertical-align: top;
    }
    .meta th {
      width: 34%;
      background: ButtonFace;
      font-weight: 600;
    }
    .body,
    .footer {
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
    .body { margin: 0 0 32px; }
    .footer {
      margin: 32px 0 0;
      padding-top: 16px;
      border-top: 1px solid GrayText;
      color: GrayText;
      font-size: 14px;
    }
    @media print {
      body { padding: 0; }
      main { max-width: none; border: 0; padding: 0; }
    }
  </style>
</head>
<body>
  <main>
    <p class="brand">PSA · Plataforma de Seguimiento de Pasantías</p>
    <h1>${title}</h1>
    <table class="meta">
      <tbody>
        <tr><th scope="row">Estudiante</th><td>${escapeHtml(input.student)}</td></tr>
        <tr><th scope="row">Taller</th><td>${escapeHtml(input.taller)}</td></tr>
        <tr><th scope="row">Plaza</th><td>${escapeHtml(input.plaza)}</td></tr>
        <tr><th scope="row">Calificación</th><td>${grade}</td></tr>
        <tr><th scope="row">Estado</th><td>${escapeHtml(input.status)}</td></tr>
        <tr><th scope="row">Fecha de emisión</th><td>${escapeHtml(formatDateInput(input.issuedAt))}</td></tr>
      </tbody>
    </table>
    <div class="body">${escapeHtml(input.body)}</div>
    <div class="footer">${escapeHtml(input.footer)}</div>
  </main>
</body>
</html>`;
}

/**
 * Descarga un archivo HTML generado en el navegador.
 *
 * @param fileName Nombre seguro del archivo.
 * @param html Contenido completo.
 * @returns false si el navegador no permitió iniciar la descarga.
 */
export function downloadGradeDocument(fileName: string, html: string): boolean {
  if (typeof document === 'undefined') return false;
  let url = '';
  try {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.rel = 'noopener';
    document.body.append(link);
    link.click();
    link.remove();
    return true;
  } catch {
    return false;
  } finally {
    if (url !== '') {
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }
}
