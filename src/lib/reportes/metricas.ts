/**
 * Cálculos de métricas y agrupamientos para reportes.
 *
 * Capa: lib/reportes
 * Funciones puras que reciben filas de un módulo y devuelven agregados para
 * las tarjetas y gráficos de los reportes. No conoce Solid ni el DOM.
 */
import type { ResourceRow } from '@/types/resource';

export interface GroupRow {
  key: string;
  count: number;
}

/** Agrupa filas por una llave y cuenta cuántas hay por grupo. */
export function agruparPor(
  rows: readonly ResourceRow[],
  clave: string,
  valorPorDefecto = 'Sin valor',
): GroupRow[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = String(row[clave] ?? valorPorDefecto);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

/** Valor máximo de conteo entre grupos. */
export function maxConteo(grupos: readonly GroupRow[]): number {
  return Math.max(0, ...grupos.map((g) => g.count));
}

/** Total de cupos de plazas. */
export function totalCupos(rows: readonly ResourceRow[]): number {
  return rows.reduce((sum, row) => sum + Number(row.cantidad ?? 0), 0);
}

/** Promedio general de evaluaciones (solo valores > 0). */
export function promedioGeneral(rows: readonly ResourceRow[]): number {
  const vals = rows
    .map((row) => Number(row.promedio ?? 0))
    .filter((v) => v > 0);
  return vals.length > 0
    ? Math.round(vals.reduce((sum, v) => sum + v, 0) / vals.length)
    : 0;
}

/** Cuenta filas cuyo estado coincida con el valor dado. */
export function contarPorEstado(
  rows: readonly ResourceRow[],
  estado: string,
  claveEstado = 'estado',
): number {
  return rows.filter((row) => String(row[claveEstado] ?? '') === estado).length;
}
