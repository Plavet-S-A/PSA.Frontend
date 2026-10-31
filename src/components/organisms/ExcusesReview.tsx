/**
 * ExcusesReview — bandeja de excusas para tutores, vinculación y coordinación.
 *
 * Capa: organism
 * Props: initialRows, canReview, scope, reviewScope, reviewerName
 * Efectos: hidrata y persiste el módulo de excusas; aprueba o rechaza las
 * pendientes y registra quién resolvió cada caso.
 */
import type { Component } from 'solid-js';
import { createMemo, createSignal, For, onMount, Show } from 'solid-js';

import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import Alert from '@/components/molecules/Alert';
import ConfirmDialog from '@/components/molecules/ConfirmDialog';
import EmptyState from '@/components/molecules/EmptyState';
import Toast from '@/components/molecules/Toast';
import ResourceDetailDialog from '@/components/organisms/ResourceDetailDialog';
import { excusasConfig } from '@/lib/catalog/excusas';
import { todayIsoDate } from '@/lib/format/date';
import {
  loadResourceRows,
  saveResourceRows,
} from '@/lib/storage/resource-store';
import { statusTone } from '@/lib/ui/status';
import type { ResourceRow } from '@/types/resource';

type ToastTone = 'success' | 'error' | 'info';

interface ToastState {
  message: string;
  tone: ToastTone;
}

type EstadoFiltro = 'Pendiente' | 'Aceptada' | 'Rechazada' | 'Todas';

export interface ExcusesReviewProps {
  /** Excusas visibles para el rol. */
  initialRows: readonly ResourceRow[];
  /** Habilita aceptar o rechazar. */
  canReview: boolean;
  /** Tutor destino que filtra la bandeja; null para ver todas. */
  scope: string | null;
  /** Destino que el rol puede resolver; null para resolver cualquiera. */
  reviewScope: string | null;
  /** Nombre de quien resuelve, para dejar rastro. */
  reviewerName: string;
}

export const ExcusesReview: Component<ExcusesReviewProps> = (props) => {
  const [rows, setRows] = createSignal<ResourceRow[]>([]);
  const [filtro, setFiltro] = createSignal<EstadoFiltro>('Pendiente');
  const [detailRow, setDetailRow] = createSignal<ResourceRow | undefined>(undefined);
  const [rejecting, setRejecting] = createSignal<ResourceRow | undefined>(undefined);
  const [toast, setToast] = createSignal<ToastState>({ message: '', tone: 'success' });

  const showToast = (message: string, tone: ToastTone = 'success') => {
    setToast({ message, tone });
  };

  const scopedRows = createMemo(() =>
    rows().filter((row) => !props.scope || String(row.tutor) === props.scope),
  );

  const counts = createMemo(() => ({
    Pendiente: scopedRows().filter((row) => String(row.estado) === 'Pendiente').length,
    Aceptada: scopedRows().filter((row) => String(row.estado) === 'Aceptada').length,
    Rechazada: scopedRows().filter((row) => String(row.estado) === 'Rechazada').length,
    Todas: scopedRows().length,
  }));

  const visibleRows = createMemo(() => {
    const estado = filtro();
    const filtered =
      estado === 'Todas'
        ? scopedRows()
        : scopedRows().filter((row) => String(row.estado) === estado);
    return [...filtered].sort((a, b) =>
      String(b.fecha_creacion).localeCompare(String(a.fecha_creacion)),
    );
  });

  onMount(() => {
    setRows(loadResourceRows(excusasConfig.id, props.initialRows));
  });

  /** Indica si la fila puede resolverse desde este rol. */
  const canResolve = (row: ResourceRow): boolean =>
    props.canReview &&
    String(row.estado) === 'Pendiente' &&
    (!props.reviewScope || String(row.tutor) === props.reviewScope);

  const resolve = (row: ResourceRow, estado: 'Aceptada' | 'Rechazada') => {
    if (!canResolve(row)) return;
    const next = rows().map((item) =>
      item.id === row.id
        ? {
            ...item,
            estado,
            revisado_por: props.reviewerName,
            fecha_revision: todayIsoDate(),
          }
        : item,
    );
    if (!saveResourceRows(excusasConfig.id, next, { partial: props.scope !== null })) {
      showToast('No se pudo guardar la revisión en este navegador.', 'error');
      return;
    }
    setRows(next);
    setRejecting(undefined);
    showToast(
      estado === 'Aceptada' ? 'Excusa aceptada.' : 'Excusa rechazada.',
      estado === 'Aceptada' ? 'success' : 'info',
    );
  };

  const filtros: readonly EstadoFiltro[] = ['Pendiente', 'Aceptada', 'Rechazada', 'Todas'];

  return (
    <>
      <Alert class="workspace-hint" tone="info">
        Las excusas las envían los estudiantes desde su cuenta. Aquí solo se
        revisan: aceptar o rechazar deja registrada la decisión y la fecha.
      </Alert>

      <div class="workspace__toolbar">
        <div class="status-filter" role="group" aria-label="Filtrar excusas por estado">
          <For each={filtros}>
            {(estado) => (
              <button
                type="button"
                class="btn btn-sm btn-outline"
                aria-pressed={filtro() === estado}
                onClick={() => setFiltro(estado)}
              >
                {estado === 'Todas' ? 'Todas' : estado}
                <span class="status-filter__count">{counts()[estado]}</span>
              </button>
            )}
          </For>
        </div>
        <p class="workspace__meta">
          {props.scope
            ? `Dirigidas a ${props.scope.toLocaleLowerCase('es-MX')}`
            : props.reviewScope
              ? 'Todas las excusas · revisas las dirigidas a tu rol'
              : 'Todas las excusas'}
        </p>
      </div>

      <Show
        when={visibleRows().length > 0}
        fallback={
          <div class="table-card">
            <EmptyState
              icon="clipboard"
              title="No hay excusas en esta bandeja"
              description={
                filtro() === 'Pendiente'
                  ? 'No hay excusas pendientes en esta bandeja.'
                  : 'Prueba con otro estado o espera nuevos envíos de los estudiantes.'
              }
            />
          </div>
        }
      >
        <div class="table-card">
          <div class="table-scroll" tabindex="0" role="region" aria-label="Bandeja de excusas">
            <table class="data-table">
              <thead>
                <tr>
                  <th scope="col">Estudiante</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Fecha</th>
                  <th scope="col">Estado</th>
                  <th scope="col" data-align="actions">
                    <span class="psa-visually-hidden">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <For each={visibleRows()}>
                  {(row) => (
                    <tr>
                      <td>
                        <span class="cell-primary">
                          <span class="cell-primary__name">{row.estudiante}</span>
                          <span class="cell-primary__secondary">{row.tutor}</span>
                        </span>
                      </td>
                      <td>
                        <span class="cell-primary">
                          <span class="cell-primary__name">{row.tipo}</span>
                          <span class="cell-primary__secondary">{row.descripcion}</span>
                        </span>
                      </td>
                      <td>{row.fecha}</td>
                      <td>
                        <Badge tone={statusTone(String(row.estado))}>{row.estado}</Badge>
                      </td>
                      <td data-align="actions">
                        <div class="row-actions">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDetailRow(row)}
                            aria-label={`Ver excusa de ${row.estudiante}`}
                          >
                            Ver
                          </Button>
                          <Show when={canResolve(row)}>
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => resolve(row, 'Aceptada')}
                              aria-label={`Aceptar excusa de ${row.estudiante}`}
                            >
                              Aceptar
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => setRejecting(row)}
                              aria-label={`Rechazar excusa de ${row.estudiante}`}
                            >
                              Rechazar
                            </Button>
                          </Show>
                        </div>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </div>
      </Show>

      <Show when={props.canReview}>
        <p class="workspace__meta workspace__meta--footnote">
          Las decisiones quedan registradas con tu nombre y la fecha del día.
        </p>
      </Show>

      <ResourceDetailDialog
        open={detailRow() !== undefined}
        config={excusasConfig}
        row={detailRow()}
        onClose={() => setDetailRow(undefined)}
      />

      <ConfirmDialog
        open={rejecting() !== undefined}
        title="Rechazar excusa"
        description={`Se rechazará la excusa de ${rejecting()?.estudiante ?? 'la persona'} y quedará registrada la decisión.`}
        confirmLabel="Rechazar excusa"
        onConfirm={() => {
          const row = rejecting();
          if (row) resolve(row, 'Rechazada');
        }}
        onClose={() => setRejecting(undefined)}
      />

      <Toast
        message={toast().message || null}
        tone={toast().tone}
        onDismiss={() => setToast({ message: '', tone: 'success' })}
      />
    </>
  );
};

export default ExcusesReview;
