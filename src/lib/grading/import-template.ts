/**
 * Importación de plantillas desde archivos del usuario.
 *
 * Capa: lib/grading
 * Convierte .docx, .html, .txt y .md a texto plano. Nunca inserta el archivo en
 * el DOM: el HTML se recorre como texto y se descartan scripts, estilos y SVG.
 */

import { extractDocxText } from '@/lib/grading/docx';
import {
  DOCUMENT_BODY_MAX,
  TEMPLATE_FILE_MAX_BYTES,
} from '@/lib/grading/templates';

const SUPPORTED_EXTENSIONS = new Set(['docx', 'html', 'htm', 'txt', 'md']);
const SKIP_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'TEMPLATE',
  'SVG',
  'IFRAME',
  'OBJECT',
  'EMBED',
]);
const BLOCK_TAGS = new Set([
  'P',
  'DIV',
  'SECTION',
  'ARTICLE',
  'HEADER',
  'FOOTER',
  'MAIN',
  'ASIDE',
  'BLOCKQUOTE',
  'PRE',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
]);

/** Resultado de importar un archivo como plantilla. */
export interface ImportedTemplate {
  /** Nombre original del archivo. */
  fileName: string;
  /** Texto normalizado listo para editar. */
  body: string;
}

function extensionOf(fileName: string): string {
  return fileName.split('.').pop()?.toLocaleLowerCase('en-US') ?? '';
}

function textFromHtmlNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const element = node as HTMLElement;
  const tag = element.tagName.toUpperCase();
  if (SKIP_TAGS.has(tag)) return '';

  const inner = Array.from(element.childNodes).map(textFromHtmlNode).join('');
  if (tag === 'BR') return '\n';
  if (tag === 'LI') return `• ${inner.trim()}\n`;
  if (tag === 'TR') return `${inner.trim()}\n`;
  if (tag === 'TD' || tag === 'TH') return `${inner.trim()}\t`;
  if (BLOCK_TAGS.has(tag)) return `${inner.trim()}\n\n`;
  return inner;
}

function normalizeText(value: string): string {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function htmlToText(html: string): string {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const text = Array.from(parsed.body.childNodes).map(textFromHtmlNode).join('');
  return normalizeText(text);
}

/**
 * Convierte un archivo elegido por el usuario en texto de plantilla.
 *
 * @param file Archivo .docx, .html, .htm, .txt o .md.
 * @returns Nombre y contenido normalizado.
 * @throws Error con un mensaje apto para mostrar al usuario.
 */
export async function importTemplateFile(file: File): Promise<ImportedTemplate> {
  if (file.size > TEMPLATE_FILE_MAX_BYTES) {
    throw new Error('El archivo supera el límite de 2 MB.');
  }

  const extension = extensionOf(file.name);
  if (!SUPPORTED_EXTENSIONS.has(extension)) {
    throw new Error('Formato no compatible. Usa .docx, .html, .txt o .md.');
  }

  let body: string;
  if (extension === 'docx') {
    body = await extractDocxText(await file.arrayBuffer());
  } else if (extension === 'html' || extension === 'htm') {
    body = htmlToText(await file.text());
  } else {
    body = normalizeText(await file.text());
  }

  if (body === '') throw new Error('El archivo no contiene texto que se pueda usar.');
  if (body.length > DOCUMENT_BODY_MAX) {
    throw new Error(
      `El texto supera el límite de ${DOCUMENT_BODY_MAX.toLocaleString('es-MX')} caracteres.`,
    );
  }

  return { fileName: file.name, body };
}
