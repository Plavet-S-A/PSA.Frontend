/**
 * Mapeo y validación de archivos tabulares hacia filas de un catálogo.
 *
 * Capa: lib/import
 * Traduce encabezados visibles a llaves del modelo, normaliza fechas y números,
 * valida con las mismas reglas del formulario y descarta duplicados antes de
 * persistir. No conoce Solid ni el DOM.
 */

import { applyResourceValues } from '@/lib/resource/row-values';
import { createResourceId } from '@/lib/storage/resource-store';
import { buildInitialValues, validateResourceForm } from '@/lib/validation/resource-form';
import type { TableData } from '@/lib/import/table-file';
import type {
  ResourceConfig,
  ResourceDeriveRow,
  ResourceField,
  ResourceRow,
} from '@/types/resource';

/** Motivo por el que una fila no se puede importar. */
export interface ResourceImportIssue {
  /** Número de fila en el archivo, contando el encabezado. */
  row: number;
  message: string;
}

/** Resultado del mapeo previo a la confirmación de importación. */
export interface ResourceImportResult {
  /** Filas válidas listas para agregar al catálogo. */
  rows: ResourceRow[];
  /** Encabezados que se reconocieron y a qué campo corresponden. */
  mappedHeaders: { header: string; field: string }[];
  /** Encabezados que no coinciden con ningún campo. */
  ignoredHeaders: string[];
  /** Filas descartadas con una explicación. */
  issues: ResourceImportIssue[];
  /** Total de filas de datos leídas. */
  totalRows: number;
  /** Error global que impide importar el archivo completo. */
  error?: string;
}

function normalizeHeader(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-MX')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizeOption(value: string, options: readonly string[]): string {
  const normalized = normalizeHeader(value);
  return options.find((option) => normalizeHeader(option) === normalized) ?? value.trim();
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function isoFromParts(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return `${year}-${pad(month)}-${pad(day)}`;
}

function excelDate(serial: number): string | null {
  if (!Number.isFinite(serial) || serial < 1 || serial > 60000) return null;
  const date = new Date(Date.UTC(1899, 11, 30) + Math.round(serial) * 86_400_000);
  return isoFromParts(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
  );
}

/**
 * Normaliza fechas ISO, fechas es-MX y series numéricas de Excel.
 *
 * @param value Texto original de la celda.
 * @returns Fecha `YYYY-MM-DD`, cadena vacía o null si no es válida.
 */
export function normalizeImportDate(value: string): string | null {
  const text = value.trim().replace(/^['’]/, '');
  if (text === '') return '';

  const iso = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s].*)?$/);
  if (iso) return isoFromParts(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const short = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if (short) {
    let first = Number(short[1]);
    let second = Number(short[2]);
    const year = Number(short[3]) < 100 ? 2000 + Number(short[3]) : Number(short[3]);
    if (second > 12 && first <= 12) [first, second] = [second, first];
    return isoFromParts(year, second, first);
  }

  if (/^\d+(?:\.\d+)?$/.test(text)) return excelDate(Number(text));
  return null;
}

function parseNumber(value: string): string | null {
  const normalized = value
    .trim()
    .replace(/^['’]/, '')
    .replace(/\s/g, '')
    .replace(/,/g, '.');
  if (normalized === '') return '';
  const number = Number(normalized);
  return Number.isFinite(number) ? String(number) : null;
}

function normalizeFieldValue(field: ResourceField, raw: string): string | null {
  const value = raw.trim();
  if (value === '') return '';

  if (field.type === 'date') return normalizeImportDate(value);
  if (field.type === 'number') return parseNumber(value);
  if (field.type === 'select' && field.options) {
    return normalizeOption(value, field.options);
  }
  return value;
}

function headerMap(config: ResourceConfig): Map<string, ResourceField> {
  const map = new Map<string, ResourceField>();
  for (const field of config.fields) {
    map.set(normalizeHeader(field.key), field);
    map.set(normalizeHeader(field.label), field);
    for (const alias of config.importConfig?.aliases?.[field.key] ?? []) {
      map.set(normalizeHeader(alias), field);
    }
  }
  return map;
}

function uniqueValue(row: ResourceRow, key: string): string {
  return String(row[key] ?? '').trim().toLocaleLowerCase('es-MX');
}

function uniqueMessage(config: ResourceConfig, key: string): string {
  const label =
    config.fields.find((field) => field.key === key)?.label ??
    config.columns.find((column) => column.key === key)?.label ??
    key;
  return `Ya existe un registro con el mismo valor en "${label}".`;
}

/**
 * Convierte una tabla en filas válidas del catálogo.
 *
 * @param config Configuración del módulo con `importConfig`.
 * @param table Encabezados y filas leídas del archivo.
 * @param existingRows Registros actuales para detectar duplicados.
 * @param normalizeRow Función de normalización resuelta en el cliente.
 * @param deriveRow Función de derivación resuelta en el cliente.
 * @returns Filas listas, encabezados reconocidos y errores por fila.
 */
export function buildImportedRows(
  config: ResourceConfig,
  table: TableData,
  existingRows: readonly ResourceRow[],
  normalizeRow?: (row: ResourceRow) => ResourceRow,
  deriveRow?: ResourceDeriveRow,
): ResourceImportResult {
  const importConfig = config.importConfig;
  const mappedHeaders: { header: string; field: string }[] = [];
  const ignoredHeaders: string[] = [];
  const issues: ResourceImportIssue[] = [];
  const headerToField: (ResourceField | undefined)[] = [];
  const map = headerMap(config);

  if (!importConfig) {
    return {
      rows: [],
      mappedHeaders,
      ignoredHeaders,
      issues,
      totalRows: table.rows.length,
      error: 'Este módulo no admite importación.',
    };
  }

  for (const header of table.headers) {
    const field = map.get(normalizeHeader(header));
    if (field) {
      headerToField.push(field);
      mappedHeaders.push({ header, field: field.key });
    } else {
      headerToField.push(undefined);
      if (header.trim() !== '') ignoredHeaders.push(header);
    }
  }

  const mappedKeys = new Set(
    headerToField.filter((field): field is ResourceField => !!field).map((field) => field.key),
  );
  const missing = config.fields.filter(
    (field) =>
      field.required &&
      field.defaultValue === undefined &&
      !mappedKeys.has(field.key),
  );
  if (missing.length > 0) {
    return {
      rows: [],
      mappedHeaders,
      ignoredHeaders,
      issues,
      totalRows: table.rows.length,
      error: `Faltan columnas obligatorias: ${missing.map((field) => field.label).join(', ')}.`,
    };
  }

  const maxRows = importConfig.maxRows ?? 1000;
  if (table.rows.length > maxRows) {
    return {
      rows: [],
      mappedHeaders,
      ignoredHeaders,
      issues,
      totalRows: table.rows.length,
      error: `El archivo supera el máximo de ${maxRows} filas por importación.`,
    };
  }

  const defaults = buildInitialValues(config.fields);
  const uniqueKeys = importConfig.uniqueKeys ?? [];
  const seen = new Map<string, Set<string>>(
    uniqueKeys.map((key) => [
      key,
      new Set(existingRows.map((row) => uniqueValue(row, key)).filter(Boolean)),
    ]),
  );
  const rows: ResourceRow[] = [];

  table.rows.forEach((values, index) => {
    const rowNumber = index + 2;
    const formValues = { ...defaults };
    const fieldIssues: string[] = [];
    let mappedCount = 0;

    headerToField.forEach((field, column) => {
      if (!field) return;
      const normalized = normalizeFieldValue(field, values[column] ?? '');
      if (normalized === null) {
        fieldIssues.push(`${field.label}: formato inválido.`);
        return;
      }
      if (normalized !== '') {
        formValues[field.key] = normalized;
        mappedCount += 1;
      }
    });

    if (mappedCount === 0) {
      issues.push({ row: rowNumber, message: 'La fila no contiene datos importables.' });
      return;
    }

    const validation = validateResourceForm(config.fields, formValues);
    for (const [key, message] of Object.entries(validation)) {
      const label = config.fields.find((field) => field.key === key)?.label ?? key;
      fieldIssues.push(`${label}: ${message}`);
    }

    if (fieldIssues.length > 0) {
      issues.push({ row: rowNumber, message: fieldIssues.join(' ') });
      return;
    }

    const candidate = applyResourceValues(config, formValues, undefined, normalizeRow, deriveRow);
    const duplicate = uniqueKeys.find((key) => {
      const value = uniqueValue(candidate, key);
      return value !== '' && seen.get(key)?.has(value);
    });

    if (duplicate) {
      issues.push({ row: rowNumber, message: uniqueMessage(config, duplicate) });
      return;
    }

    for (const key of uniqueKeys) {
      const value = uniqueValue(candidate, key);
      if (value !== '') seen.get(key)?.add(value);
    }

    rows.push({ ...candidate, id: createResourceId(config.id) });
  });

  return {
    rows,
    mappedHeaders,
    ignoredHeaders,
    issues,
    totalRows: table.rows.length,
  };
}

function csvCell(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * Genera una plantilla CSV con los encabezados visibles del módulo.
 *
 * @param config Configuración del módulo.
 * @returns Contenido CSV listo para descargar.
 */
export function buildImportTemplate(config: ResourceConfig): string {
  return `${config.fields.map((field) => csvCell(field.label)).join(',')}\r\n`;
}
