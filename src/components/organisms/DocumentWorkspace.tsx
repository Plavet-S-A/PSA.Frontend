/**
 * DocumentWorkspace — documentación agrupada por taller o plaza y estudiante.
 *
 * Capa: organism
 * Props: initialRows, canManage, canReview, talleres, roleLabel, guidance,
 * reviewerName, partialSave, assignmentScope, assignedStudentNames, groupByPlaza
 * Efectos: hidrata y persiste documentos en localStorage; abre diálogos.
 */
import type { Component } from 'solid-js';
import { createMemo, createSignal, onMount, Show } from 'solid-js';

import Alert from '@/components/molecules/Alert';
import ConfirmDialog from '@/components/molecules/ConfirmDialog';
import TallerMasterList from '@/components/molecules/TallerMasterList';
import Toast from '@/components/molecules/Toast';
import WorkspaceMasterToggle from '@/components/molecules/WorkspaceMasterToggle';
import DocumentScopePanel from '@/components/organisms/DocumentScopePanel';
import ResourceFormDialog from '@/components/organisms/ResourceFormDialog';
import { documentacionConfig, documentacionStudentConfig } from '@/lib/catalog/documentacion';
import {
  assignedPlazaIdByStudentName,
  assignedStudentNamesForTalleres,
  defaultPlazaAssignments,
  loadPlazaAssignments,
  plazasRows,
  plazasWithAssignmentsForTalleres,
  type PlazaAssignment,
} from '@/lib/catalog/plaza-assignments';
import { todayIsoDate } from '@/lib/format/date';
import { pluralize } from '@/lib/format/text';
import { normalizeResourceRows } from '@/lib/resource/row-values';
import { deleteDocumentFile } from '@/lib/storage/document-files';
import { loadResourceRows, saveResourceRows } from '@/lib/storage/resource-store';
import {
  loadMasterHidden,
  saveMasterHidden,
} from '@/lib/storage/workspace-preferences';
import {
  composeDocumentRow,
  documentsOfStudent,
  pendingDocuments,
  removeDocumentRow,
  reviewedDocumentRow,
  scopeGroupName,
  scopeStudents,
  summarizeScopeGroups,
  upsertDocumentRow,
  type ScopeGroupOptions,
} from '@/lib/workspace/document-rows';
import type { ResourceRow } from '@/types/resource';

type ToastTone = 'success' | 'error' | 'info';

interface ToastState {
  message: string;
  tone: ToastTone;
}

export interface DocumentWorkspaceProps {
  /** Filas de ejemplo renderizadas en el servidor. */
  initialRows: readonly ResourceRow[];
  /** Permite editar y eliminar documentos existentes. */
  canManage: boolean;
  /** Permite aprobar o rechazar entregas. */
  canReview: boolean;
  /** Talleres que puede consultar el rol. */
  talleres: readonly string[];
  /** Nombre del rol para el aviso de contexto. */
  roleLabel: string;
  /** Explica el flujo que corresponde al rol. */
  guidance: string;
  /** Persona que firma la revisión de un documento. */
  reviewerName: string;
  /** Guarda una instantánea parcial sin borrar filas de otros alcances. */
  partialSave?: boolean;
  /** Limita la vista a estudiantes asignados a plazas de los talleres. */
  assignmentScope?: boolean;
  /** Nombres asignados calculados en el servidor para el alcance inicial. */
  assignedStudentNames?: readonly string[];
  /** Agrupa por plaza en lugar de por taller (tutor empresarial). */
  groupByPlaza?: boolean;
}

export const DocumentWorkspace: Component<DocumentWorkspaceProps> = (props) => {
  /** true cuando el rol agrupa por plaza en lugar de por taller. */
  const usesPlazas = () => props.groupByPlaza === true && props.assignmentScope === true;

  /**
   * Calcula el grupo inicial para que el servidor ya renderice el detalle.
   *
   * @returns Clave del taller o de la plaza, o null si hay varias opciones.
   */
  function initialGroupKey(): string | null {
    if (props.assignmentScope && usesPlazas()) {
      const plazas = plazasWithAssignmentsForTalleres(
        defaultPlazaAssignments(),
        props.talleres,
      );
      return plazas.length === 1 ? plazas[0].id : null;
    }
    return props.talleres.length === 1 ? props.talleres[0] : null;
  }

  const [rows, setRows] = createSignal<ResourceRow[]>([...props.initialRows]);
  const [assignmentNames, setAssignmentNames] = createSignal<string[]>([
    ...(props.assignedStudentNames ?? []),
  ]);
  const [assignments, setAssignments] = createSignal<PlazaAssignment[]>(
    defaultPlazaAssignments(),
  );
  const [groupKey, setGroupKey] = createSignal<string | null>(initialGroupKey());
  const [masterHidden, setMasterHidden] = createSignal(false);
  const [ready, setReady] = createSignal(false);
  const [estudiante, setEstudiante] = createSignal<string | null>(null);
  const [formOpen, setFormOpen] = createSignal(false);
  const [editingRow, setEditingRow] = createSignal<ResourceRow | undefined>(undefined);
  const [deletingRow, setDeletingRow] = createSignal<ResourceRow | undefined>(undefined);
  const [toast, setToast] = createSignal<ToastState | null>(null);

  /** Etiqueta del panel maestro según el alcance activo. */
  const masterLabel = () => (usesPlazas() ? 'Plazas' : 'Talleres');

  /** Etiqueta singular del alcance; se usa en los encabezados de detalle. */
  const scopeName = () => (usesPlazas() ? 'Plaza' : 'Taller');

  /** Etiqueta plural del alcance; se usa en las acciones de navegación. */
  const scopePlural = () => (usesPlazas() ? 'plazas' : 'talleres');

  onMount(() => {
    const saved = loadResourceRows(documentacionConfig.id, props.initialRows);
    setRows(normalizeResourceRows(documentacionConfig, saved));

    if (props.assignmentScope) {
      const loaded = loadPlazaAssignments();
      setAssignments(loaded);
      setAssignmentNames(assignedStudentNamesForTalleres(loaded, props.talleres));
      if (usesPlazas()) {
        const plazas = plazasWithAssignmentsForTalleres(loaded, props.talleres);
        if (plazas.length === 1) setGroupKey(plazas[0].id);
      } else if (props.talleres.length === 1) {
        setGroupKey(props.talleres[0]);
      }
    } else if (props.talleres.length === 1) {
      setGroupKey(props.talleres[0]);
    }

    setMasterHidden(loadMasterHidden('documentacion'));
    requestAnimationFrame(() => setReady(true));
  });

  /** Reglas de agrupación vigentes: plaza o taller. */
  const groupOptions = createMemo<ScopeGroupOptions>(() => ({
    byPlaza: usesPlazas(),
    plazaByStudent: usesPlazas()
      ? assignedPlazaIdByStudentName(assignments(), props.talleres)
      : new Map<string, string>(),
    plazaNames: new Map(plazasRows.map((row) => [row.id, String(row.plaza)])),
  }));

  /** Aplica el alcance por plaza sin alterar las filas persistidas. */
  const visibleRows = createMemo(() => {
    if (!props.assignmentScope) return rows();
    const assigned = new Set(assignmentNames());
    return rows().filter((row) => assigned.has(String(row.estudiante)));
  });

  /** Obtiene el nombre legible de una clave de grupo. */
  const getGroupName = (key: string): string => scopeGroupName(key, groupOptions());

  /** Resumen por grupo del alcance visible. */
  const resumenGrupos = createMemo(() =>
    summarizeScopeGroups(visibleRows(), groupOptions()),
  );

  /** El panel maestro solo aparece cuando hay más de un grupo visible. */
  const hasMultipleGroups = createMemo(() => resumenGrupos().length > 1);

  const masterItems = createMemo(() =>
    resumenGrupos().map((item) => ({
      nombre: item.nombre,
      meta: `${pluralize(item.estudiantes, 'estudiante', 'estudiantes')} · ${pluralize(item.documentos, 'documento', 'documentos')}`,
      flag:
        item.pendientes > 0
          ? pluralize(item.pendientes, 'pendiente', 'pendientes')
          : undefined,
    })),
  );

  /** Estudiantes del grupo seleccionado con el conteo de sus entregas. */
  const estudiantesDelGrupo = createMemo(() =>
    scopeStudents(visibleRows(), groupKey() ?? '', groupOptions()),
  );

  /** Documentos del estudiante seleccionado dentro del grupo activo. */
  const documentosDelEstudiante = createMemo(() =>
    documentsOfStudent(visibleRows(), groupKey() ?? '', estudiante() ?? '', groupOptions()),
  );

  const pendientesDelEstudiante = createMemo(() =>
    pendingDocuments(documentosDelEstudiante()),
  );

  const deletingLabel = createMemo(() => String(deletingRow()?.tipo ?? ''));

  const selectGroup = (nombre: string) => {
    const key = resumenGrupos().find((g) => g.nombre === nombre)?.key ?? nombre;
    setGroupKey(key);
    setEstudiante(null);
  };

  const setMasterVisibility = (hidden: boolean) => {
    setMasterHidden(hidden);
    saveMasterHidden('documentacion', hidden);
  };

  const persist = (
    nextRows: ResourceRow[],
    deletedIds?: readonly string[],
  ): boolean => {
    if (
      !saveResourceRows(documentacionConfig.id, nextRows, {
        deletedIds,
        partial: props.partialSave === true,
      })
    ) {
      setToast({
        message: 'No se pudieron guardar los cambios en este navegador.',
        tone: 'error',
      });
      return false;
    }
    setRows(nextRows);
    return true;
  };

  const openEdit = (row: ResourceRow) => {
    setEditingRow(row);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingRow(undefined);
  };

  const saveDocument = (values: Record<string, string>) => {
    const selectedEstudiante = estudiante();
    const current = editingRow();
    if (!selectedEstudiante || !current) return;

    // El taller se conserva de los documentos existentes del estudiante para
    // no alterar la relación cuando la navegación ocurre por plaza.
    const taller = String(
      rows().find((row) => String(row.estudiante) === selectedEstudiante)?.taller ??
        props.talleres[0] ??
        '',
    );
    const composed = composeDocumentRow(documentacionConfig, {
      values,
      current,
      estudiante: selectedEstudiante,
      taller,
    });
    const nextRows = upsertDocumentRow(rows(), composed, current);

    if (!persist(nextRows)) return;
    closeForm();
    setToast({
      message: 'Documento actualizado.',
      tone: 'success',
    });
  };

  const confirmDelete = () => {
    const current = deletingRow();
    if (!current) return;

    const remaining = removeDocumentRow(rows(), current.id);
    const studentDocs = remaining.filter(
      (row) =>
        String(row.taller) === String(current.taller) &&
        String(row.estudiante) === String(current.estudiante),
    );
    if (!persist(remaining, [current.id])) return;
    void deleteDocumentFile(current.id);
    if (studentDocs.length === 0) setEstudiante(null);
    setDeletingRow(undefined);
    setToast({ message: 'Documento eliminado.', tone: 'success' });
  };

  const reviewDocument = (row: ResourceRow, estado: 'Validado' | 'Rechazado') => {
    const nextRows = rows().map((current) =>
      current.id === row.id
        ? reviewedDocumentRow(current, estado, props.reviewerName, todayIsoDate())
        : current,
    );
    if (!persist(nextRows)) return;
    setToast({
      message:
        estado === 'Validado'
          ? 'Documento aprobado y listo para el expediente.'
          : 'Documento rechazado; el estudiante deberá corregirlo.',
      tone: estado === 'Validado' ? 'success' : 'info',
    });
  };

  return (
    <section
      aria-label={
        usesPlazas() ? 'Documentación por plaza' : 'Documentación por taller'
      }
    >
      <Alert class="workspace-hint" tone="info" title={`Vista de ${props.roleLabel}`}>
        {props.guidance}
      </Alert>

      <Show when={hasMultipleGroups()}>
        <div class="workspace__toolbar">
          <WorkspaceMasterToggle
            expanded={!masterHidden()}
            controls="documentacion-master"
            count={masterItems().length}
            label={masterLabel()}
            onToggle={() => setMasterVisibility(!masterHidden())}
          />
        </div>
      </Show>

      <div
        class="workspace"
        classList={{
          'workspace--master-hidden': masterHidden(),
          'workspace--single': !hasMultipleGroups(),
          'workspace--instant': !ready(),
        }}
      >
        <Show when={hasMultipleGroups()}>
          <div class="workspace__master-slot">
            <TallerMasterList
              id="documentacion-master"
              hidden={masterHidden()}
              items={masterItems()}
              selected={groupKey() ? getGroupName(groupKey()!) : null}
              label={masterLabel()}
              onSelect={selectGroup}
            />
          </div>
        </Show>

        <div class="workspace__detail">
          <DocumentScopePanel
            byPlaza={usesPlazas()}
            groupKey={groupKey()}
            groupName={groupKey() ? getGroupName(groupKey()!) : ''}
            scopeName={scopeName()}
            scopePlural={scopePlural()}
            estudiantes={estudiantesDelGrupo()}
            estudiante={estudiante()}
            documentos={documentosDelEstudiante()}
            pendientes={pendientesDelEstudiante()}
            canManage={props.canManage}
            canReview={props.canReview}
            onRoot={
              hasMultipleGroups()
                ? () => {
                    setGroupKey(null);
                    setEstudiante(null);
                  }
                : undefined
            }
            onSelectStudent={setEstudiante}
            onBack={() => setEstudiante(null)}
            onEdit={openEdit}
            onDelete={setDeletingRow}
            onReview={reviewDocument}
          />
        </div>
      </div>

      <ResourceFormDialog
        open={formOpen()}
        config={documentacionStudentConfig}
        row={editingRow()}
        onClose={closeForm}
        onSave={saveDocument}
      />

      <ConfirmDialog
        open={deletingRow() !== undefined}
        title="Eliminar documento"
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

export default DocumentWorkspace;
