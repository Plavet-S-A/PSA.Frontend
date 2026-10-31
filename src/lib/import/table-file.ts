/**
 * Lectura segura de archivos tabulares CSV y XLSX.
 *
 * Capa: lib/import
 * El archivo se procesa por completo en el navegador. No se evalúa contenido,
 * no se interpreta HTML y no se escribe en el DOM: solo se extraen celdas de
 * texto para que el importador de recursos las valide.
 */

import { strFromU8, unzipSync } from 'fflate';

/** Tamaño máximo del archivo seleccionado. */
export const TABLE_FILE_MAX_BYTES = 5 * 1024 * 1024;
/** Tamaño máximo del contenido descomprimido de un XLSX. */
const XLSX_MAX_UNCOMPRESSED_BYTES = 20 * 1024 * 1024;
/** Límite defensivo de filas antes de aplicar la validación del módulo. */
const TABLE_MAX_ROWS = 5000;

/** Datos normalizados de una hoja: encabezados y filas. */
export interface TableData {
  headers: string[];
  rows: string[][];
}

/** Error legible para mostrar en el diálogo de importación. */
export class TableFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TableFileError';
  }
}

function extensionOf(name: string): string {
  return name.split('.').pop()?.toLocaleLowerCase('es-MX') ?? '';
}

/**
 * Comprueba si el archivo tiene una extensión admitida.
 *
 * @param file Archivo elegido por la persona.
 * @param accepted Extensiones sin punto.
 * @returns true si la extensión está permitida.
 */
export function isAcceptedTableFile(
  file: File,
  accepted: readonly string[],
): boolean {
  return accepted.includes(extensionOf(file.name));
}

function detectDelimiter(text: string): string {
  const candidates = [',', ';', '\t'];
  let inQuotes = false;
  const counts = new Map(candidates.map((candidate) => [candidate, 0]));

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (inQuotes && text[index + 1] === '"') {
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (inQuotes) continue;
    if (char === '\n' || char === '\r') break;
    if (counts.has(char)) {
      counts.set(char, (counts.get(char) ?? 0) + 1);
    }
  }

  return candidates.reduce((best, candidate) =>
    (counts.get(candidate) ?? 0) > (counts.get(best) ?? 0) ? candidate : best,
  );
}

function parseDelimited(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  const pushCell = () => {
    row.push(cell.trim());
    cell = '';
  };

  const pushRow = () => {
    pushCell();
    if (row.some((value) => value !== '')) rows.push(row);
    row = [];
  };

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"' && cell.trim() === '') {
      inQuotes = true;
      cell = '';
      continue;
    }

    if (char === delimiter) {
      pushCell();
      continue;
    }

    if (char === '\r') {
      if (text[index + 1] === '\n') index += 1;
      pushRow();
      continue;
    }

    if (char === '\n') {
      pushRow();
      continue;
    }

    cell += char;
  }

  if (cell !== '' || row.length > 0) pushRow();
  return rows;
}

function decodeXml(value: string): string {
  return value.replace(
    /&(?:#(\d+)|#x([\da-f]+)|([a-z]+));/gi,
    (entity, decimal: string | undefined, hex: string | undefined, named: string | undefined) => {
      if (decimal) return String.fromCodePoint(Number(decimal));
      if (hex) return String.fromCodePoint(Number.parseInt(hex, 16));
      switch (named?.toLocaleLowerCase('en-US')) {
        case 'amp':
          return '&';
        case 'lt':
          return '<';
        case 'gt':
          return '>';
        case 'quot':
          return '"';
        case 'apos':
          return "'";
        default:
          return entity;
      }
    },
  );
}

function xmlText(xml: string): string {
  return decodeXml(xml.replace(/<[^>]*>/g, '')).replace(/\u0000/g, '').trim();
}

function attribute(tag: string, name: string): string {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = tag.match(new RegExp(`${escaped}\\s*=\\s*["']([^"']*)["']`, 'i'));
  return match ? decodeXml(match[1]) : '';
}

function columnIndex(reference: string): number {
  const letters = reference.match(/^[A-Z]+/i)?.[0]?.toLocaleUpperCase('en-US');
  if (!letters) return -1;

  let index = 0;
  for (const letter of letters) {
    index = index * 26 + letter.charCodeAt(0) - 64;
  }
  return index - 1;
}

function firstWorksheetPath(files: Record<string, Uint8Array>): string {
  const workbookBytes = files['xl/workbook.xml'];
  const relsBytes = files['xl/_rels/workbook.xml.rels'];

  if (workbookBytes) {
    const workbook = strFromU8(workbookBytes);
    const sheet = workbook.match(/<sheet\b[^>]*\/?>/i)?.[0] ?? '';
    const relationId = attribute(sheet, 'r:id');

    if (relationId && relsBytes) {
      const relationships = strFromU8(relsBytes);
      const relations = relationships.match(/<Relationship\b[^>]*\/?>/gi) ?? [];
      const relation = relations.find((item) => attribute(item, 'Id') === relationId);
      const target = relation ? attribute(relation, 'Target') : '';
      if (target) {
        const normalized = target.replace(/^\/+/, '').replace(/^\.\//, '');
        return normalized.startsWith('xl/') ? normalized : `xl/${normalized}`;
      }
    }
  }

  return Object.keys(files)
    .filter((path) => /^xl\/worksheets\/[^/]+\.xml$/i.test(path))
    .sort((a, b) => a.localeCompare(b, 'en'))[0] ?? '';
}

function readSharedStrings(files: Record<string, Uint8Array>): string[] {
  const bytes = files['xl/sharedStrings.xml'];
  if (!bytes) return [];

  const xml = strFromU8(bytes);
  const items = xml.match(/<si\b[^>]*>[\s\S]*?<\/si>/gi) ?? [];
  return items.map((item) => {
    const texts = [...item.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/gi)].map((match) =>
      decodeXml(match[1]),
    );
    return texts.length > 0 ? texts.join('') : xmlText(item);
  });
}

function cellText(cellXml: string, sharedStrings: readonly string[]): string {
  const type = attribute(cellXml, 't');
  const rawValue = cellXml.match(/<v\b[^>]*>([\s\S]*?)<\/v>/i)?.[1] ?? '';

  if (type === 's') {
    const index = Number(rawValue);
    return Number.isInteger(index) ? sharedStrings[index] ?? '' : '';
  }

  if (type === 'inlineStr') {
    const inline = cellXml.match(/<is\b[^>]*>([\s\S]*?)<\/is>/i)?.[1] ?? '';
    return xmlText(inline);
  }

  if (type === 'b') {
    if (rawValue.trim() === '1') return 'Sí';
    if (rawValue.trim() === '0') return 'No';
    return '';
  }

  return type === 'str' ? decodeXml(rawValue).trim() : rawValue.trim();
}

function readXlsx(bytes: Uint8Array): TableData {
  let total = 0;
  let files: Record<string, Uint8Array>;

  try {
    files = unzipSync(bytes, {
      filter: (entry) => {
        total += entry.originalSize;
        return total <= XLSX_MAX_UNCOMPRESSED_BYTES;
      },
    });
  } catch {
    throw new TableFileError('No se pudo leer el archivo de Excel. Verifica que no esté dañado.');
  }

  if (total > XLSX_MAX_UNCOMPRESSED_BYTES) {
    throw new TableFileError('El archivo de Excel contiene demasiada información para importarlo.');
  }

  const sheetPath = firstWorksheetPath(files);
  const sheetBytes = files[sheetPath];
  if (!sheetPath || !sheetBytes) {
    throw new TableFileError('El archivo de Excel no contiene una hoja de cálculo legible.');
  }

  const sharedStrings = readSharedStrings(files);
  const sheet = strFromU8(sheetBytes);
  const rows: string[][] = [];
  const rowMatches = sheet.match(/<row\b[^>]*>[\s\S]*?<\/row>/gi) ?? [];

  for (const rowXml of rowMatches) {
    const cells = rowXml.match(/<c\b[^>]*?(?:\/>|>[\s\S]*?<\/c>)/gi) ?? [];
    const values: string[] = [];
    let fallbackIndex = 0;

    for (const cellXml of cells) {
      const reference = attribute(cellXml, 'r');
      const index = reference ? columnIndex(reference) : fallbackIndex;
      if (index < 0) continue;
      while (values.length < index) values.push('');
      values[index] = cellText(cellXml, sharedStrings);
      fallbackIndex = index + 1;
    }

    if (values.some((value) => value.trim() !== '')) rows.push(values);
  }

  return normalizeRows(rows);
}

function readCsv(text: string): TableData {
  const clean = text.replace(/^\uFEFF/, '');
  const delimiter = detectDelimiter(clean);
  return normalizeRows(parseDelimited(clean, delimiter));
}

function normalizeRows(rows: readonly string[][]): TableData {
  if (rows.length === 0) {
    throw new TableFileError('El archivo está vacío.');
  }

  const [headerRow, ...dataRows] = rows;
  const headers = headerRow.map((header) => header.trim());
  if (headers.every((header) => header === '')) {
    throw new TableFileError('La primera fila debe contener los nombres de las columnas.');
  }

  if (dataRows.length > TABLE_MAX_ROWS) {
    throw new TableFileError(`El archivo supera el máximo de ${TABLE_MAX_ROWS} filas.`);
  }

  const width = headers.length;
  const rowsNormalized = dataRows
    .map((row) => Array.from({ length: width }, (_, index) => row[index] ?? ''))
    .filter((row) => row.some((value) => value.trim() !== ''));

  return { headers, rows: rowsNormalized };
}

/**
 * Lee un CSV o XLSX y devuelve sus celdas como texto.
 *
 * @param file Archivo elegido por la persona.
 * @returns Encabezados y filas listos para mapear.
 * @throws TableFileError con un mensaje apto para la interfaz.
 */
export async function readTableFile(file: File): Promise<TableData> {
  if (file.size > TABLE_FILE_MAX_BYTES) {
    throw new TableFileError('El archivo supera el límite de 5 MB.');
  }

  const extension = extensionOf(file.name);
  if (extension === 'csv') {
    return readCsv(await file.text());
  }
  if (extension === 'xlsx') {
    return readXlsx(new Uint8Array(await file.arrayBuffer()));
  }

  throw new TableFileError('Formato no compatible. Usa un archivo CSV o Excel (.xlsx).');
}
