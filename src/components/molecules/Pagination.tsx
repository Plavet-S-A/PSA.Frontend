/**
 * Pagination — navegación por páginas numeradas.
 *
 * Capa: molecule
 * Props: page, pageCount, onPageChange
 * Efectos: ninguno.
 */
import type { Component } from 'solid-js';
import { For, Show } from 'solid-js';

import Icon from '@/components/atoms/Icon';

export interface PaginationProps {
  /** Página actual, base 1. */
  page: number;
  /** Total de páginas, mínimo 1. */
  pageCount: number;
  /** Notifica la página solicitada. */
  onPageChange: (page: number) => void;
}

function pageNumbers(page: number, pageCount: number): number[] {
  const windowSize = 5;
  const start = Math.max(1, Math.min(page - 2, pageCount - windowSize + 1));
  const end = Math.min(pageCount, start + windowSize - 1);
  const numbers: number[] = [];

  for (let current = start; current <= end; current += 1) {
    numbers.push(current);
  }

  return numbers;
}

export const Pagination: Component<PaginationProps> = (props) => (
  <Show when={props.pageCount > 1}>
    <nav class="pagination" aria-label="Paginación">
      <button
        class="pagination__btn"
        type="button"
        aria-label="Página anterior"
        disabled={props.page <= 1}
        onClick={() => props.onPageChange(props.page - 1)}
      >
        <Icon name="chevron-left" size={16} />
      </button>

      <For each={pageNumbers(props.page, props.pageCount)}>
        {(number) => (
          <button
            class="pagination__btn"
            type="button"
            aria-label={`Página ${number}`}
            aria-current={number === props.page ? 'page' : undefined}
            onClick={() => props.onPageChange(number)}
          >
            {number}
          </button>
        )}
      </For>

      <button
        class="pagination__btn"
        type="button"
        aria-label="Página siguiente"
        disabled={props.page >= props.pageCount}
        onClick={() => props.onPageChange(props.page + 1)}
      >
        <Icon name="chevron-right" size={16} />
      </button>
    </nav>
  </Show>
);

export default Pagination;
