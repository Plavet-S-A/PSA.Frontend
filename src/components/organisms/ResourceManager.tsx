/**
 * ResourceManager — isla de administración compartida por los módulos.
 *
 * Capa: organism
 * Props: config, initialRows, readOnly
 * Efectos: hidrata desde localStorage, persiste cambios y administra diálogos.
 */
import type { Component } from 'solid-js';
import { createMemo, createSignal, onMount, Show } from 'solid-js';

import Alert from '@/components/molecules/Alert';
import ConfirmDialog from '@/components/molecules/ConfirmDialog';
import EmptyState from '@/components/molecules/EmptyState';
import Pagination from '@/components/molecules/Pagination';
import ResourceToolbar from '@/components/molecules/ResourceToolbar';
import Toast from '@/components/molecules/Toast';
import ResourceDetailDialog from '@/components/organisms/ResourceDetailDialog';
import ResourceFormDialog from '@/components/organisms/ResourceFormDialog';
import ResourceImportDialog from '@/components/organisms/ResourceImportDialog';
import ResourceTable from '@/components/organisms/ResourceTable';
import {
  applyResourceValues,
  normalizeResourceRows,
} from '@/lib/resource/row-values';
import {
  resolveDeriveRow,
  resolveNormalizeRow,
} from '@/lib/catalog/deriver-registry';
import '@/lib/catalog/all-derivers';
import {
  createResourceId,
  loadResourceRows,
  saveResourceRows,
} from '@/lib/storage/resource-store';
import {
  normalizeFilterValues,
  removeFilterValue,
  rowMatchesFilter,
  sortResourceFilters,
} from '@/lib/ui/filters';
import type {
  ResourceConfig,
  ResourceFilter,
  ResourceFilterValues,
  ResourceRow,
} from '@/types/resource';

const PAGE_SIZE = 8;

type ToastTone = 'success' | 'error' | 'info';

interface ToastState {
  message: string;
  tone: ToastTone;
}

export interface ResourceManagerProps {
  /** Configuración declarativa del módulo. */
  config: ResourceConfig;
  /** Filas de ejemplo renderizadas en el servidor. */
  initialRows: readonly ResourceRow[];
  /** Oculta alta, edición y borrado; solo permite consultar y filtrar. */
  readOnly?: boolean;
}

export const ResourceManager: Component<ResourceManagerProps> = (props) => {
  const [rows, setRows] = createSignal<ResourceRow[]>([...props.initialRows]);
  const [query, setQuery] = createSignal('');
  const [filterValues, setFilterValues] = createSignal<ResourceFilterValues>({});
  const [page, setPage] = createSignal(1);
  const [formOpen, setFormOpen] = createSignal(false);
  const [importOpen, setImportOpen] = createSignal(false);
  const [editingRow, setEditingRow] = createSignal<ResourceRow | undefined>(undefined);
  const [detailRow, setDetailRow] = createSignal<ResourceRow | undefined>(undefined);
  const [deletingRow, setDeletingRow] = createSignal<ResourceRow | undefined>(undefined);
  const [toast, setToast] = createSignal<ToastState | null>(null);

  const normalizeRow = resolveNormalizeRow(
    props.config.normalizeRowKey ?? props.config.id,
  );
  const deriveRow = resolveDeriveRow(props.config.deriveRowKey ?? props.config.id);

  const filters = createMemo<ResourceFilter[]>(() => {
    const statusFilter: ResourceFilter[] =
      props.config.statusOptions.length > 0
        ? [
            {
              key: props.config.statusKey,
              label: 'Estado',
              allLabel: 'Todos los estados',
              options: props.config.statusOptions,
              type: 'multi',
            },
          ]
        : [];
    const byKey = new Map<string, ResourceFilter>();

    for (const filter of [...statusFilter, ...(props.config.filters ?? [])]) {
      if (!byKey.has(filter.key)) byKey.set(filter.key, filter);
    }

    return sortResourceFilters([...byKey.values()]);
  });

  onMount(() => {
    const saved = loadResourceRows(props.config.id, props.initialRows);
    setRows(normalizeResourceRows(props.config, saved, normalizeRow, deriveRow));
  });

  const filtered = createMemo(() => {
    const term = query().trim().toLocaleLowerCase('es-MX');
    const definitions = filters();
    const values = filterValues();

    return rows().filter((row) => {
      const matchesFilters = definitions.every((filter) =>
        rowMatchesFilter(row, filter, values[filter.key] ?? []),
      );
      const matchesQuery =
        term === '' ||
        props.config.searchKeys.some((key) =>
          String(row[key] ?? '').toLocaleLowerCase('es-MX').includes(term),
        );
      return matchesFilters && matchesQuery;
    });
  });

  const pageCount = createMemo(() =>
    Math.max(1, Math.ceil(filtered().length / PAGE_SIZE)),
  );

  const visibleRows = createMemo(() => {
    const start = (page() - 1) * PAGE_SIZE;
    return filtered().slice(start, start + PAGE_SIZE);
  });

  const hasFilters = createMemo(
    () =>
      query().trim() !== '' ||
      filters().some((filter) => (filterValues()[filter.key] ?? []).length > 0),
  );
  const deletingLabel = createMemo(() => {
    const row = deletingRow();
    return row ? String(row[props.config.primaryKey] ?? '') : '';
  });
  const rangeLabel = createMemo(() => {
    const total = filtered().length;
    if (total === 0) return '0 registros';
    const start = (page() - 1) * PAGE_SIZE + 1;
    const end = Math.min(page() * PAGE_SIZE, total);
    return `Mostrando ${start}–${end} de ${total}`;
  });

  const clampPage = () => {
    const limit = pageCount();
    setPage((current) => Math.min(current, limit));
  };

  const persist = (nextRows: ResourceRow[], deletedIds?: readonly string[]): boolean => {
    if (!saveResourceRows(props.config.id, nextRows, { deletedIds })) {
      setToast({
        message: 'No se pudieron guardar los cambios en este navegador.',
        tone: 'error',
      });
      return false;
    }
    setRows(nextRows);
    return true;
  };

  const changeQuery = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const changeFilters = (values: ResourceFilterValues) => {
    setFilterValues(normalizeFilterValues(filters(), values));
    setPage(1);
  };

  const removeFilter = (key: string, value: string) => {
    setFilterValues(removeFilterValue(filterValues(), key, value));
    setPage(1);
  };

  const clearFilters = () => {
    setQuery('');
    setFilterValues({});
    setPage(1);
  };

  const openCreate = () => {
    if (props.readOnly) return;
    setEditingRow(undefined);
    setFormOpen(true);
  };

  const openEdit = (row: ResourceRow) => {
    if (props.readOnly) return;
    setEditingRow(row);
    setFormOpen(true);
  };

  const editFromDetail = (row: ResourceRow) => {
    setDetailRow(undefined);
    openEdit(row);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingRow(undefined);
  };

  const saveValues = (values: Record<string, string>) => {
    const current = editingRow();
    const composed = applyResourceValues(
      props.config,
      values,
      current,
      normalizeRow,
      deriveRow,
    );
    const nextRow: ResourceRow = current
      ? composed
      : { ...composed, id: createResourceId(props.config.id) };
    const nextRows = current
      ? rows().map((row) => (row.id === current.id ? nextRow : row))
      : [nextRow, ...rows()];

    if (!persist(nextRows)) return;
    closeForm();

    if (current) {
      clampPage();
    } else {
      setPage(1);
    }

    setToast({
      message: current ? 'Cambios guardados.' : 'Registro creado.',
      tone: 'success',
    });
  };

  const confirmDelete = () => {
    const current = deletingRow();
    if (!current) return;

    if (!persist(rows().filter((row) => row.id !== current.id), [current.id])) return;
    setDeletingRow(undefined);
    clampPage();
    setToast({ message: 'Registro eliminado.', tone: 'success' });
  };

  const importRows = (imported: readonly ResourceRow[]): boolean => {
    if (imported.length === 0) return false;
    if (!persist([...imported, ...rows()])) return false;

    setPage(1);
    setToast({
      message:
        imported.length === 1
          ? 'Se importó 1 registro.'
          : `Se importaron ${imported.length} registros.`,
      tone: 'success',
    });
    return true;
  };

  return (
    <section aria-label={props.config.plural}>
      <Show when={props.readOnly}>
        <Alert tone="info" class="resource-readonly">
          Vista de consulta: tu rol no puede modificar este módulo.
        </Alert>
      </Show>

      <ResourceToolbar
        query={query()}
        filters={filters()}
        filterValues={filterValues()}
        searchPlaceholder={props.config.searchPlaceholder}
        createLabel={props.config.createLabel}
        hasFilters={hasFilters()}
        onQueryChange={changeQuery}
        onFiltersChange={changeFilters}
        onFilterRemove={removeFilter}
        onClear={clearFilters}
        onCreate={props.readOnly ? undefined : openCreate}
        importLabel={props.config.importConfig?.buttonLabel}
        onImport={
          props.readOnly || !props.config.importConfig
            ? undefined
            : () => setImportOpen(true)
        }
      />

      <Show
        when={rows().length > 0}
        fallback={
          <div class="table-card">
            <EmptyState
              title={props.config.emptyTitle}
              description={props.config.emptyDescription}
              actionLabel={props.readOnly ? undefined : props.config.createLabel}
              onAction={props.readOnly ? undefined : openCreate}
              icon="layers"
            />
          </div>
        }
      >
        <Show
          when={filtered().length > 0}
          fallback={
            <div class="table-card">
              <EmptyState
                title="No encontramos resultados"
                description="Ajusta la búsqueda o limpia los filtros para ver todos los registros."
                actionLabel="Limpiar filtros"
                onAction={clearFilters}
                icon="search"
              />
            </div>
          }
        >
          <div class="table-card">
            <ResourceTable
              config={props.config}
              rows={visibleRows()}
              onDetail={setDetailRow}
              onEdit={props.readOnly ? undefined : openEdit}
              onDelete={props.readOnly ? undefined : setDeletingRow}
            />
            <div class="table-footer">
              <span>{rangeLabel()}</span>
              <Pagination page={page()} pageCount={pageCount()} onPageChange={setPage} />
            </div>
          </div>
        </Show>
      </Show>

      <ResourceFormDialog
        open={formOpen()}
        config={props.config}
        row={editingRow()}
        onClose={closeForm}
        onSave={saveValues}
      />

      <ResourceDetailDialog
        open={detailRow() !== undefined}
        config={props.config}
        row={detailRow()}
        onClose={() => setDetailRow(undefined)}
        onEdit={props.readOnly ? undefined : editFromDetail}
      />

      <Show when={props.config.importConfig && !props.readOnly}>
        <ResourceImportDialog
          open={importOpen()}
          config={props.config}
          existingRows={rows()}
          onClose={() => setImportOpen(false)}
          onImport={importRows}
        />
      </Show>

      <ConfirmDialog
        open={deletingRow() !== undefined}
        title="Eliminar registro"
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
    </section>
  );
};

export default ResourceManager;
