/**
 * PlazaDetail — plazas de un taller con búsqueda, filtro y CRUD.
 *
 * Capa: organism
 * Props: taller, rows, assignments, canManage, onPersistRows,
 * onAssignStudents, onBack
 * Efectos: filtra, persiste cambios y administra la asignación de estudiantes.
 */
import type { Component } from 'solid-js';
import { createEffect, createMemo, createSignal, Show } from 'solid-js';

import Button from '@/components/atoms/Button';
import Alert from '@/components/molecules/Alert';
import ConfirmDialog from '@/components/molecules/ConfirmDialog';
import EmptyState from '@/components/molecules/EmptyState';
import PlazaAssignedStudents from '@/components/molecules/PlazaAssignedStudents';
import ResourceToolbar from '@/components/molecules/ResourceToolbar';
import Toast from '@/components/molecules/Toast';
import PlazaAssignmentDialog from '@/components/organisms/PlazaAssignmentDialog';
import PlazaRequestDialog from '@/components/organisms/PlazaRequestDialog';
import ResourceDetailDialog from '@/components/organisms/ResourceDetailDialog';
import ResourceFormDialog from '@/components/organisms/ResourceFormDialog';
import ResourceTable from '@/components/organisms/ResourceTable';
import {
  assignedStudentIds,
  assignedStudentsForPlaza,
  candidateStudentsForPlaza,
  type PlazaAssignment,
} from '@/lib/catalog/plaza-assignments';
import { plazaDetailConfig, plazasConfig, summarizePlazas } from '@/lib/catalog/plazas';
import { todayIsoDate } from '@/lib/format/date';
import { applyResourceValues } from '@/lib/resource/row-values';
import { createResourceId } from '@/lib/storage/resource-store';
import {
  normalizeFilterValues,
  removeFilterValue,
  rowMatchesFilter,
} from '@/lib/ui/filters';
import type { ResourceFilterValues, ResourceRow } from '@/types/resource';

type ToastTone = 'success' | 'error' | 'info';

interface ToastState {
  message: string;
  tone: ToastTone;
}

export interface PlazaDetailProps {
  /** Taller seleccionado. */
  taller: string;
  /** Plazas visibles para el rol. */
  rows: readonly ResourceRow[];
  /** Relación vigente entre plazas y estudiantes. */
  assignments: readonly PlazaAssignment[];
  /** Permite crear, editar, eliminar plazas y asignar estudiantes. */
  canManage: boolean;
  /** Permite enviar una solicitud de plaza para revisión. */
  canRequest: boolean;
  /** Nombre de quien solicita una plaza nueva. */
  requesterName: string;
  /** Persiste las filas; false mantiene el formulario abierto. */
  onPersistRows: (rows: ResourceRow[]) => boolean;
  /** Persiste la selección de estudiantes de una plaza. */
  onAssignStudents: (plazaId: string, studentIds: readonly string[]) => boolean;
  /** Vuelve al listado de talleres. Se omite cuando solo hay uno asignado. */
  onBack?: () => void;
}

export const PlazaDetail: Component<PlazaDetailProps> = (props) => {
  const [query, setQuery] = createSignal('');
  const [filterValues, setFilterValues] = createSignal<ResourceFilterValues>({});
  const [formOpen, setFormOpen] = createSignal(false);
  const [requestOpen, setRequestOpen] = createSignal(false);
  const [editingRow, setEditingRow] = createSignal<ResourceRow | undefined>(undefined);
  const [detailRow, setDetailRow] = createSignal<ResourceRow | undefined>(undefined);
  const [assigningRow, setAssigningRow] = createSignal<ResourceRow | undefined>(undefined);
  const [deletingRow, setDeletingRow] = createSignal<ResourceRow | undefined>(undefined);
  const [toast, setToast] = createSignal<ToastState | null>(null);

  createEffect(() => {
    props.taller;
    setQuery('');
    setFilterValues({});
    setFormOpen(false);
    setRequestOpen(false);
    setEditingRow(undefined);
    setDetailRow(undefined);
    setAssigningRow(undefined);
    setDeletingRow(undefined);
  });

  const plazasDelTaller = createMemo(() =>
    props.rows.filter((row) => String(row.taller) === props.taller),
  );

  const resumen = createMemo(() =>
    summarizePlazas(props.rows, props.assignments, props.taller),
  );

  const filteredRows = createMemo(() => {
    const term = query().trim().toLocaleLowerCase('es-MX');
    const values = filterValues();

    return plazasDelTaller().filter((row) => {
      const matchesFilters = (plazaDetailConfig.filters ?? []).every((filter) =>
        rowMatchesFilter(row, filter, values[filter.key] ?? []),
      );
      const matchesQuery =
        term === '' ||
        plazasConfig.searchKeys.some((key) =>
          String(row[key] ?? '').toLocaleLowerCase('es-MX').includes(term),
        );
      return matchesFilters && matchesQuery;
    });
  });

  const displayRows = createMemo(() =>
    filteredRows().map((row) => ({
      ...row,
      asignados: assignedStudentsForPlaza(props.assignments, row.id).length,
    })),
  );

  const assignedStudents = createMemo(() => {
    const row = detailRow();
    return row ? assignedStudentsForPlaza(props.assignments, row.id) : [];
  });

  const candidateStudents = createMemo(() => {
    const row = assigningRow();
    return row ? candidateStudentsForPlaza(row) : [];
  });

  const assignedIds = createMemo(() => {
    const row = assigningRow();
    return row ? assignedStudentIds(props.assignments, row.id) : [];
  });

  const hasFilters = createMemo(
    () => query().trim() !== '' || Object.keys(filterValues()).length > 0,
  );
  const deletingLabel = createMemo(() => String(deletingRow()?.plaza ?? ''));

  /** Centro de trabajo de la plaza vigente del taller, para precargar la solicitud. */
  const requestCenter = () =>
    String(
      props.rows.find(
        (row) =>
          String(row.taller) === props.taller && row.solicitadoPor === undefined,
      )?.centroTrabajo ?? '',
    );

  const changeFilters = (values: ResourceFilterValues) => {
    setFilterValues(
      normalizeFilterValues(plazaDetailConfig.filters ?? [], values),
    );
  };

  const removeFilter = (key: string, value: string) => {
    setFilterValues(removeFilterValue(filterValues(), key, value));
  };

  const clearFilters = () => {
    setQuery('');
    setFilterValues({});
  };

  const persist = (nextRows: ResourceRow[]): boolean => {
    if (!props.onPersistRows(nextRows)) {
      setToast({
        message: 'No se pudieron guardar los cambios en este navegador.',
        tone: 'error',
      });
      return false;
    }
    return true;
  };

  const openCreate = () => {
    if (!props.canManage) return;
    setEditingRow(undefined);
    setFormOpen(true);
  };

  const openEdit = (row: ResourceRow) => {
    if (!props.canManage) return;
    setEditingRow(row);
    setFormOpen(true);
  };

  const editFromDetail = (row: ResourceRow) => {
    setDetailRow(undefined);
    openEdit(row);
  };

  /** Abre la asignación desde la ficha para evitar dos modales apilados. */
  const openAssignment = (row: ResourceRow) => {
    setDetailRow(undefined);
    setAssigningRow(row);
  };

  const saveAssignment = (studentIds: string[]) => {
    const row = assigningRow();
    if (!row) return;
    if (!props.onAssignStudents(row.id, studentIds)) {
      setToast({
        message: 'No se pudo guardar la asignación en este navegador.',
        tone: 'error',
      });
      return;
    }
    setAssigningRow(undefined);
    setToast({
      message:
        studentIds.length === 1
          ? 'Estudiante asignado a la plaza.'
          : 'Asignación de estudiantes actualizada.',
      tone: 'success',
    });
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingRow(undefined);
  };

  const openRequest = () => {
    if (!props.canRequest) return;
    setRequestOpen(true);
  };

  const saveRequest = (values: Record<string, string>) => {
    const composed = applyResourceValues(plazasConfig, {
      ...values,
      taller: props.taller,
      estado: 'En revisión',
      solicitadoPor: props.requesterName,
      fecha_solicitud: todayIsoDate(),
    });
    const nextRow: ResourceRow = {
      ...composed,
      id: createResourceId(plazasConfig.id),
    };
    if (!persist([nextRow, ...props.rows])) return;
    setRequestOpen(false);
    setToast({
      message: 'Solicitud enviada a vinculación para revisión.',
      tone: 'success',
    });
  };

  const savePlaza = (values: Record<string, string>) => {
    const current = editingRow();
    const composed = applyResourceValues(
      plazasConfig,
      { ...values, taller: props.taller },
      current,
    );
    const nextRow: ResourceRow = current
      ? composed
      : { ...composed, id: createResourceId(plazasConfig.id) };
    const nextRows = current
      ? props.rows.map((row) => (row.id === current.id ? nextRow : row))
      : [nextRow, ...props.rows];

    if (!persist(nextRows)) return;
    closeForm();
    setToast({
      message: current ? 'Plaza actualizada.' : 'Plaza creada.',
      tone: 'success',
    });
  };

  const confirmDelete = () => {
    const current = deletingRow();
    if (!current) return;
    if (!persist(props.rows.filter((row) => row.id !== current.id))) return;
    setDeletingRow(undefined);
    setToast({ message: 'Plaza eliminada.', tone: 'success' });
  };

  return (
    <>
      <header class="workspace__head">
        <div>
          <p class="workspace__eyebrow">Taller</p>
          <h2 class="workspace__title-lg">{props.taller}</h2>
          <p class="workspace__meta">
            {resumen().plazas} plazas · {resumen().cupos} cupos ·{' '}
            {resumen().asignados} asignados
            {resumen().abiertas > 0 ? ` · ${resumen().abiertas} abiertas` : ''}
          </p>
        </div>
        <div class="workspace__actions workspace__actions--end">
          <Show when={props.onBack}>
            <Button variant="ghost" size="sm" onClick={() => props.onBack?.()}>
              Ver todos los talleres
            </Button>
          </Show>
        </div>
      </header>

      <Show when={!props.canManage}>
        <Alert class="resource-readonly" tone="info">
          {props.canRequest
            ? 'Vista de consulta: revisa las plazas de tu taller y usa «Solicitar plaza» para enviar una nueva a vinculación. La solicitud entra con estado En revisión y se conserva en este navegador.'
            : 'Vista de consulta: tu rol no puede modificar las plazas.'}
        </Alert>
      </Show>

      <ResourceToolbar
        query={query()}
        filters={plazaDetailConfig.filters}
        filterValues={filterValues()}
        searchPlaceholder={plazasConfig.searchPlaceholder}
        createLabel={props.canManage ? plazasConfig.createLabel : 'Solicitar plaza'}
        hasFilters={hasFilters()}
        onQueryChange={setQuery}
        onFiltersChange={changeFilters}
        onFilterRemove={removeFilter}
        onClear={clearFilters}
        onCreate={props.canManage ? openCreate : props.canRequest ? openRequest : undefined}
      />

      <Show
        when={plazasDelTaller().length > 0}
        fallback={
          <div class="table-card">
            <EmptyState
              icon="briefcase"
              title="Este taller aún no tiene plazas"
              description={
                props.canRequest
                  ? 'Solicita la primera plaza para vincular estudiantes de este taller con tu centro de trabajo.'
                  : 'Crea la primera plaza para vincular estudiantes de este taller con un centro de trabajo.'
              }
              actionLabel={
                props.canManage
                  ? plazasConfig.createLabel
                  : props.canRequest
                    ? 'Solicitar plaza'
                    : undefined
              }
              onAction={
                props.canManage ? openCreate : props.canRequest ? openRequest : undefined
              }
            />
          </div>
        }
      >
        <Show
          when={filteredRows().length > 0}
          fallback={
            <div class="table-card">
              <EmptyState
                title="No hay plazas que coincidan"
                description="Ajusta la búsqueda o limpia los filtros para ver todas las plazas de este taller."
                actionLabel="Limpiar filtros"
                onAction={clearFilters}
                icon="search"
              />
            </div>
          }
        >
          <div class="table-card">
            <ResourceTable
              config={plazaDetailConfig}
              rows={displayRows()}
              onDetail={setDetailRow}
              onRowClick={setDetailRow}
              onEdit={props.canManage ? editFromDetail : undefined}
              onDelete={props.canManage ? setDeletingRow : undefined}
            />
          </div>
        </Show>
      </Show>

      <ResourceFormDialog
        open={formOpen()}
        config={plazaDetailConfig}
        row={editingRow()}
        onClose={closeForm}
        onSave={savePlaza}
      />

      <PlazaRequestDialog
        open={requestOpen()}
        taller={props.taller}
        center={requestCenter()}
        onClose={() => setRequestOpen(false)}
        onSubmit={saveRequest}
      />

      <ResourceDetailDialog
        open={detailRow() !== undefined}
        config={plazaDetailConfig}
        row={detailRow()}
        onClose={() => setDetailRow(undefined)}
        onEdit={props.canManage ? editFromDetail : undefined}
        footerActions={
          <Show when={props.canManage && detailRow() !== undefined}>
            <Button
              variant="secondary"
              onClick={() => {
                const row = detailRow();
                if (row) openAssignment(row);
              }}
            >
              Asignar estudiantes
            </Button>
          </Show>
        }
      >
        <Show when={detailRow()}>
          <PlazaAssignedStudents students={assignedStudents()} />
        </Show>
      </ResourceDetailDialog>

      <PlazaAssignmentDialog
        open={assigningRow() !== undefined}
        plaza={assigningRow()}
        students={candidateStudents()}
        assignedIds={assignedIds()}
        onClose={() => setAssigningRow(undefined)}
        onSave={saveAssignment}
      />

      <ConfirmDialog
        open={deletingRow() !== undefined}
        title="Eliminar plaza"
        description={`¿Seguro que quieres eliminar "${deletingLabel()}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        onConfirm={confirmDelete}
        onClose={() => setDeletingRow(undefined)}
      />

      <Toast
        message={toast()?.message ?? null}
        tone={toast()?.tone}
        onDismiss={() => setToast(null)}
      />
    </>
  );
};

export default PlazaDetail;
