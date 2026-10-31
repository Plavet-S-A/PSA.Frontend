/**
 * Registro de funciones de normalización y derivación de filas.
 *
 * Capa: lib/catalog
 * Astro no serializa funciones cuando pasa `config` a los componentes de isla
 * (`client:*`), por lo que `normalizeRow` y `deriveRow` llegan como
 * `undefined` en el navegador. Este registro permite referenciarlas por nombre
 * desde `ResourceConfig` y resolverlas en el cliente.
 *
 * Cada módulo registra sus funciones con una llave estable; `ResourceConfig`
 * almacena la llave (`normalizeRowKey` / `deriveRowKey`) y el cliente la
 * resuelve aquí.
 */

import type {
  ResourceDeriveRow,
  ResourceRow,
} from '@/types/resource';

type DeriverEntry = {
  normalize?: (row: ResourceRow) => ResourceRow;
  derive?: ResourceDeriveRow;
};

const derivers = new Map<string, DeriverEntry>();

/**
 * Registra las funciones de un módulo.
 *
 * @param key Llave estable (por ejemplo `estudiantes`).
 * @param entry Funciones de normalización y derivación.
 */
export function registerDerivers(key: string, entry: DeriverEntry): void {
  derivers.set(key, entry);
}

/**
 * Resuelve la función de normalización de un módulo por su llave.
 */
export function resolveNormalizeRow(key: string): ((row: ResourceRow) => ResourceRow) | undefined {
  return derivers.get(key)?.normalize;
}

/**
 * Resuelve la función de derivación de un módulo por su llave.
 */
export function resolveDeriveRow(key: string): ResourceDeriveRow | undefined {
  return derivers.get(key)?.derive;
}

/** Llaves registradas. */
export function deriverKeys(): readonly string[] {
  return [...derivers.keys()];
}

export default { registerDerivers, resolveNormalizeRow, resolveDeriveRow, deriverKeys };
