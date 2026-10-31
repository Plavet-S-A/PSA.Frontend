/**
 * EvaluationTable — estudiantes de un taller o plaza con su promedio.
 *
 * Capa: molecule
 * Props: taller, scopeName, items, canGrade, onGrade, onDocument, onDetail,
 * documentIds
 * Efectos: ninguno; delega la captura, el detalle y el documento al contenedor.
 */
import type { Component } from 'solid-js';
import { For, Show } from 'solid-js';

import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import EmptyState from '@/components/molecules/EmptyState';
import { statusTone } from '@/lib/ui/status';
import type { ResourceRow } from '@/types/resource';

export interface EvaluationRowSummary {
  row: ResourceRow;
  nombre: string;
  plaza: string;
  promedio: number;
  estado: string;
}

/** Evita que los controles internos activen también el detalle de la fila. */
function fromAction(event: Event): boolean {
  const target = event.target;
  return target instanceof Element && target.closest('button, a') !== null;
}

/** Activa el detalle con clic o teclado sobre la fila. */
function activateRow(
  event: MouseEvent | KeyboardEvent,
  onDetail: () => void,
): void {
  if (fromAction(event)) return;
  if (event.type === 'keydown') {
    const key = (event as KeyboardEvent).key;
    if (key !== 'Enter' && key !== ' ') return;
    event.preventDefault();
  }
  onDetail();
}

export interface EvaluationTableProps {
  /** Taller o plaza del que se listan las evaluaciones. */
  taller: string;
  /** Etiqueta del alcance; «Plaza» cuando la navegación es por plaza. */
  scopeName?: string;
  items: readonly EvaluationRowSummary[];
  /** Permite abrir el formulario de captura y generar documentos. */
  canGrade: boolean;
  onGrade: (row: ResourceRow) => void;
  /** Abre el documento editable de la evaluación. */
  onDocument?: (row: ResourceRow) => void;
  /** Abre la consulta detallada de la evaluación. */
  onDetail?: (row: ResourceRow) => void;
  /** Evaluaciones que ya tienen un documento guardado. */
  documentIds?: readonly string[];
}

export const EvaluationTable: Component<EvaluationTableProps> = (props) => {
  const scope = () => props.scopeName ?? 'Taller';
  const scopeLower = () => scope().toLowerCase();
  const scopePhrase = () => (scopeLower() === 'plaza' ? 'la plaza' : 'el taller');
  const scopeArticle = () => (scopeLower() === 'plaza' ? 'Esta' : 'Este');

  return (
    <Show
      when={props.items.length > 0}
      fallback={
        <div class="table-card">
          <EmptyState
            icon="chart"
            title={`${scopeArticle()} ${scopeLower()} aún no tiene estudiantes evaluados`}
            description="Cuando se registre una práctica, el estudiante aparecerá aquí para su calificación."
          />
        </div>
      }
    >
      <div class="table-card">
        <div
          class="table-scroll"
          tabindex="0"
          role="region"
          aria-label={`Evaluaciones de ${props.taller}`}
        >
          <table class="data-table data-table--actions-wide">
            <caption class="psa-visually-hidden">
              Estudiantes de {scopePhrase()}, promedio registrado y documentos
            </caption>
            <thead>
              <tr>
                <th scope="col">Estudiante</th>
                <th scope="col">Plaza</th>
                <th scope="col" data-align="right">Promedio</th>
                <th scope="col">Estado</th>
                <Show when={props.onDetail || props.canGrade}>
                  <th scope="col" data-align="actions">
                    <span class="psa-visually-hidden">Acciones</span>
                  </th>
                </Show>
              </tr>
            </thead>
            <tbody>
              <For each={props.items}>
                {(item) => (
                  <tr
                    data-clickable={props.onDetail ? 'true' : undefined}
                    tabindex={props.onDetail ? 0 : undefined}
                    onClick={(event) =>
                      activateRow(event, () => props.onDetail?.(item.row))
                    }
                    onKeyDown={(event) =>
                      activateRow(event, () => props.onDetail?.(item.row))
                    }
                  >
                    <td>
                      <span class="cell-primary__name">{item.nombre}</span>
                    </td>
                    <td>{item.plaza}</td>
                    <td data-align="right">
                      <span class="mono">{item.promedio}</span>
                    </td>
                    <td>
                      <Badge tone={statusTone(item.estado)}>{item.estado}</Badge>
                    </td>
                    <Show when={props.onDetail || props.canGrade}>
                      <td data-align="actions">
                        <div class="row-actions">
                          <Show when={props.onDetail}>
                            {(onDetail) => (
                              <Button
                                variant="ghost"
                                size="sm"
                                iconOnly
                                title="Ver detalle"
                                aria-label={`Ver detalle de ${item.nombre}`}
                                onClick={() => onDetail()(item.row)}
                              >
                                <Icon name="eye" size={16} />
                              </Button>
                            )}
                          </Show>
                          <Show when={props.canGrade}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => props.onGrade(item.row)}
                            >
                              {item.estado === 'Pendiente' ? 'Calificar' : 'Editar'}
                            </Button>
                            <Show when={props.onDocument}>
                              {(onDocument) => (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title={
                                    props.documentIds?.includes(item.row.id)
                                      ? 'Editar documento guardado'
                                      : 'Generar documento de calificación'
                                  }
                                  onClick={() => onDocument()(item.row)}
                                >
                                  <Icon name="file" size={16} />
                                  Documento
                                </Button>
                              )}
                            </Show>
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
      </div>
    </Show>
  );
};

export default EvaluationTable;
