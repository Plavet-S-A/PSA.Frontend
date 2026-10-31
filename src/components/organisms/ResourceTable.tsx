/**
 * ResourceTable — tabla de datos común a todos los módulos.
 *
 * Capa: organism
 * Props: config, rows, onDetail, onRowClick, onEdit, onDelete
 * Efectos: ninguno; las acciones se notifican al padre.
 */
import type { Component, JSX } from 'solid-js';
import { For, Show } from 'solid-js';

import Badge from '@/components/atoms/Badge';
import Icon from '@/components/atoms/Icon';
import { statusTone } from '@/lib/ui/status';
import type { ResourceColumn, ResourceConfig, ResourceRow } from '@/types/resource';

export interface ResourceTableProps {
  /** Configuración del módulo. */
  config: ResourceConfig;
  /** Filas visibles de la página actual. */
  rows: readonly ResourceRow[];
  /** Abre la consulta detallada de una fila. */
  onDetail?: (row: ResourceRow) => void;
  /** Abre el detalle al pulsar o activar con teclado cualquier fila. */
  onRowClick?: (row: ResourceRow) => void;
  /** Abre la edición de una fila; se omite en modo consulta. */
  onEdit?: (row: ResourceRow) => void;
  /** Solicita confirmación para eliminar una fila; se omite en consulta. */
  onDelete?: (row: ResourceRow) => void;
}

/** Extrae el texto visible de una celda. */
function cellValue(row: ResourceRow, key: string): string {
  return String(row[key] ?? '');
}

/** Renderiza una celda según su formato declarado. */
function formatCell(column: ResourceColumn, row: ResourceRow): JSX.Element {
  const value = cellValue(row, column.key);

  if (column.format === 'status') {
    return <Badge tone={statusTone(value)}>{value}</Badge>;
  }
  if (column.format === 'mono' || column.format === 'number') {
    return <span class="mono">{value}</span>;
  }
  return <span>{value}</span>;
}

export const ResourceTable: Component<ResourceTableProps> = (props) => {
  const rowIsInteractive = () => props.onRowClick !== undefined;

  /** Evita que los controles internos activen también el detalle de la fila. */
  const isInteractiveTarget = (event: Event): boolean => {
    const target = event.target;
    return (
      target instanceof Element &&
      target.closest('button, a, input, select, textarea, label') !== null
    );
  };

  const activateRow = (event: MouseEvent | KeyboardEvent, row: ResourceRow) => {
    if (!props.onRowClick || isInteractiveTarget(event)) return;
    if (event.type === 'keydown') {
      const key = (event as KeyboardEvent).key;
      if (key !== 'Enter' && key !== ' ') return;
      event.preventDefault();
    }
    props.onRowClick(row);
  };

  return (
    <div
      class="table-scroll"
      tabindex="0"
      role="region"
      aria-label={`Tabla de ${props.config.plural}`}
    >
      <table class="data-table">
        <caption class="psa-visually-hidden">{props.config.plural}</caption>
        <thead>
          <tr>
            <For each={props.config.columns}>
              {(column) => (
                <th
                  scope="col"
                  data-align={column.align ?? 'left'}
                  classList={{ 'data-table__col--optional': column.optional }}
                >
                  {column.label}
                </th>
              )}
            </For>
            <Show when={props.onDetail || props.onEdit || props.onDelete}>
              <th scope="col" data-align="actions">
                <span class="psa-visually-hidden">Acciones</span>
              </th>
            </Show>
          </tr>
        </thead>
        <tbody>
          <For each={props.rows}>
            {(row) => (
              <tr
                data-clickable={rowIsInteractive() ? 'true' : undefined}
                tabindex={rowIsInteractive() ? 0 : undefined}
                onClick={(event) => activateRow(event, row)}
                onKeyDown={(event) => activateRow(event, row)}
              >
                <For each={props.config.columns}>
                  {(column) => (
                    <td
                      data-align={column.align ?? 'left'}
                      classList={{ 'data-table__col--optional': column.optional }}
                    >
                      <Show
                        when={column.secondaryKey}
                        fallback={formatCell(column, row)}
                      >
                        <div class="cell-primary">
                          <span class="cell-primary__name">{cellValue(row, column.key)}</span>
                          <Show when={cellValue(row, column.secondaryKey ?? '')}>
                            <span class="cell-primary__secondary">
                              {cellValue(row, column.secondaryKey ?? '')}
                            </span>
                          </Show>
                        </div>
                      </Show>
                    </td>
                  )}
                </For>
                <Show when={props.onDetail || props.onEdit || props.onDelete}>
                  <td data-align="actions">
                    <div class="row-actions">
                      <Show when={props.onDetail}>
                        {(onDetail) => (
                          <button
                            class="btn btn-ghost btn-square btn-sm"
                            type="button"
                            title="Ver detalle"
                            aria-label={`Ver detalle de ${cellValue(row, props.config.primaryKey)}`}
                            onClick={() => onDetail()(row)}
                          >
                            <Icon name="eye" size={16} />
                          </button>
                        )}
                      </Show>
                      <Show when={props.onEdit}>
                        {(onEdit) => (
                          <button
                            class="btn btn-ghost btn-square btn-sm"
                            type="button"
                            title="Editar"
                            aria-label={`Editar ${cellValue(row, props.config.primaryKey)}`}
                            onClick={() => onEdit()(row)}
                          >
                            <Icon name="edit" size={16} />
                          </button>
                        )}
                      </Show>
                      <Show when={props.onDelete}>
                        {(onDelete) => (
                          <button
                            class="btn btn-ghost btn-square btn-sm"
                            type="button"
                            title="Eliminar"
                            aria-label={`Eliminar ${cellValue(row, props.config.primaryKey)}`}
                            onClick={() => onDelete()(row)}
                          >
                            <Icon name="trash" size={16} />
                          </button>
                        )}
                      </Show>
                    </div>
                  </td>
                </Show>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </div>
  );
};

export default ResourceTable;
