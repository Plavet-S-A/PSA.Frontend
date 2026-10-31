/**
 * Persistencia local de los catálogos de demostración.
 *
 * Capa: lib/storage
 * Guarda únicamente datos de negocio ficticios en el navegador. La sesión y
 * cualquier token viven en una cookie HttpOnly; nunca aquí. Cuando exista la
 * API real, este módulo se sustituye por llamadas al servidor.
 *
 * Algunas pantallas reciben solo una parte de las filas: el estudiante ve su
 * expediente y el tutor solo su taller. Esas islas guardan una instantánea
 * `partial`; al cargarla se combina con las filas del servidor para no borrar
 * los demás registros de la demostración. Las pantallas con alcance completo
 * guardan una instantánea autoritativa normal.
 */

import type { ResourceRow, ResourceValue } from '@/types/resource';

const STORAGE_PREFIX = 'psa:data:';

interface StoredSnapshot {
  /** Filas guardadas por la última pantalla que escribió. */
  rows: ResourceRow[];
  /** true si la pantalla solo recibió una parte del conjunto. */
  partial: boolean;
  /** Identificadores eliminados explícitamente, para no revivirlos al combinar. */
  deleted: string[];
}

interface SaveOptions {
  /** Marca la escritura como parcial para combinarla con las filas del servidor. */
  partial?: boolean;
  /** Identificadores eliminados por esta acción. */
  deletedIds?: readonly string[];
}

function storageKey(resourceId: string): string {
  return `${STORAGE_PREFIX}${resourceId}`;
}

function isResourceValue(value: unknown): value is ResourceValue {
  return typeof value === 'string' || typeof value === 'number';
}

function isResourceRow(value: unknown): value is ResourceRow {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const entries = Object.entries(value);
  const hasId = entries.some(([key, item]) => key === 'id' && typeof item === 'string');
  const hasValidValues = entries.every(([, item]) => isResourceValue(item));
  return hasId && hasValidValues;
}

/**
 * Lee la instantánea local, incluidas versiones anteriores guardadas como arreglo.
 *
 * @param resourceId Identificador del módulo.
 * @returns Instantánea válida o null si no existe o está corrupta.
 */
function readSnapshot(resourceId: string): StoredSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(storageKey(resourceId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Formato anterior: el arreglo era la lista completa.
      return { rows: parsed.filter(isResourceRow), partial: false, deleted: [] };
    }
    if (typeof parsed !== 'object' || parsed === null) return null;
    const record = parsed as Record<string, unknown>;
    if (!Array.isArray(record.rows)) return null;
    return {
      rows: record.rows.filter(isResourceRow),
      partial: record.partial === true,
      deleted: Array.isArray(record.deleted)
        ? record.deleted.filter((id): id is string => typeof id === 'string')
        : [],
    };
  } catch {
    return null;
  }
}

/**
 * Completa filas antiguas con los atributos nuevos del conjunto inicial.
 *
 * Solo actúa sobre registros de demostración con el mismo `id`; las filas
 * creadas por la persona usuaria se conservan tal cual para no inventar datos.
 *
 * @param fallback Filas de ejemplo de la versión actual.
 * @param saved Filas recuperadas de `localStorage`.
 * @param deleted Identificadores que no deben reaparecer.
 * @returns Filas autoritativas de una escritura completa.
 */
function mergeFull(
  fallback: readonly ResourceRow[],
  saved: readonly ResourceRow[],
  deleted: readonly string[],
): ResourceRow[] {
  const byId = new Map(fallback.map((row) => [row.id, row]));
  const removed = new Set(deleted);
  return saved
    .filter((row) => !removed.has(row.id))
    .map((row) => {
      const seed = byId.get(row.id);
      return seed ? { ...seed, ...row } : row;
    });
}

/**
 * Combina una escritura parcial con el conjunto completo del servidor.
 *
 * @param fallback Filas de ejemplo de la versión actual.
 * @param saved Filas recuperadas de `localStorage`.
 * @param deleted Identificadores que no deben reaparecer.
 * @returns Filas completas, con las guardadas sobrescribiendo a las semilla.
 */
function mergePartial(
  fallback: readonly ResourceRow[],
  saved: readonly ResourceRow[],
  deleted: readonly string[],
): ResourceRow[] {
  const merged = new Map<string, ResourceRow>();
  const removed = new Set(deleted);
  fallback.forEach((row) => {
    if (!removed.has(row.id)) merged.set(row.id, row);
  });
  saved.forEach((row) => {
    if (removed.has(row.id)) return;
    const seed = merged.get(row.id);
    merged.set(row.id, seed ? { ...seed, ...row } : row);
  });
  return [...merged.values()];
}

/**
 * Carga las filas guardadas o el conjunto inicial del servidor.
 *
 * @param resourceId Identificador del módulo.
 * @param fallback Filas de ejemplo enviadas por la página.
 * @returns Filas válidas listas para la interfaz.
 */
export function loadResourceRows(
  resourceId: string,
  fallback: readonly ResourceRow[],
): ResourceRow[] {
  const snapshot = readSnapshot(resourceId);
  if (!snapshot) return [...fallback];
  return snapshot.partial
    ? mergePartial(fallback, snapshot.rows, snapshot.deleted)
    : mergeFull(fallback, snapshot.rows, snapshot.deleted);
}

/**
 * Guarda las filas del módulo en el navegador.
 *
 * @param resourceId Identificador del módulo.
 * @param rows Filas que se quieren persistir.
 * @param options Marca la escritura como parcial y registra eliminaciones.
 * @returns false si el navegador rechazó la escritura (cuota o modo privado).
 */
export function saveResourceRows(
  resourceId: string,
  rows: readonly ResourceRow[],
  options: SaveOptions = {},
): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const previous = readSnapshot(resourceId);
    const deleted = new Set(previous?.deleted ?? []);
    for (const id of options.deletedIds ?? []) deleted.add(id);
    const present = new Set(rows.map((row) => row.id));
    for (const id of present) deleted.delete(id);

    // Una pantalla con alcance parcial solo conoce su subconjunto. Se combina
    // con lo ya guardado para no borrar ediciones de otros talleres.
    const byId = new Map<string, ResourceRow>();
    if (options.partial === true) {
      previous?.rows.forEach((row) => byId.set(row.id, row));
    }
    rows.forEach((row) => {
      const saved = byId.get(row.id);
      byId.set(row.id, saved ? { ...saved, ...row } : row);
    });
    const storedRows = [...byId.values()].filter((row) => !deleted.has(row.id));

    const snapshot: StoredSnapshot = {
      rows: storedRows,
      partial: options.partial === true,
      deleted: [...deleted],
    };
    window.localStorage.setItem(storageKey(resourceId), JSON.stringify(snapshot));
    return true;
  } catch {
    return false;
  }
}

/**
 * Genera un identificador estable para una fila nueva.
 *
 * @param resourceId Prefijo legible del módulo.
 * @returns UUID cuando está disponible; si no, un identificador con marca de tiempo.
 */
export function createResourceId(resourceId: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${resourceId}-${Date.now().toString(36)}`;
}
