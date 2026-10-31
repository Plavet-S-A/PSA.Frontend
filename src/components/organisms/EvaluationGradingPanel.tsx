/**
 * EvaluationGradingPanel — calificaciones, plantillas y documentos de un taller.
 *
 * Capa: organism
 * Props: taller, rows, canGrade, onPersistRows, onBack
 * Efectos: hidrata plantillas y documentos; persiste calificaciones y diálogos.
 */
import type { Component } from 'solid-js';
import { createMemo, createSignal, onMount, Show } from 'solid-js';

import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import EvaluationTable from '@/components/molecules/EvaluationTable';
import type { EvaluationRowSummary } from '@/components/molecules/EvaluationTable';
import Toast from '@/components/molecules/Toast';
import GradeDocumentDialog from '@/components/organisms/GradeDocumentDialog';
import ResourceDetailDialog from '@/components/organisms/ResourceDetailDialog';
import ResourceFormDialog from '@/components/organisms/ResourceFormDialog';
import TemplateManagerDialog from '@/components/organisms/TemplateManagerDialog';
import { evaluacionConfig } from '@/lib/catalog/evaluacion';
import { applyResourceValues } from '@/lib/resource/row-values';
import {
  loadGradeDocuments,
  loadGradeTemplates,
  saveGradeDocuments,
  saveGradeTemplates,
} from '@/lib/storage/grading-store';
import type { GradeDocument, GradeTemplate } from '@/types/grading';
import type { ResourceConfig, ResourceRow } from '@/types/resource';

type ToastTone = 'success' | 'error' | 'info';

interface ToastState {
  message: string;
  tone: ToastTone;
}

/** Campos editables cuando el taller y el estudiante ya están elegidos. */
const EVALUATION_FIELDS = evaluacionConfig.fields;

const studentEvaluationConfig: ResourceConfig = {
  ...evaluacionConfig,
  createLabel: 'Capturar evaluación',
  fields: EVALUATION_FIELDS,
};

export interface EvaluationGradingPanelProps {
  /** Taller al que pertenecen las filas; se usa para guardar. */
  taller: string;
  /** Filas completas visibles para el rol; son las que se persisten. */
  rows: readonly ResourceRow[];
  /** Filas del grupo activo; si se omite se muestran todas las de `rows`. */
  scopeRows?: readonly ResourceRow[];
  /** Nombre visible del grupo; en el alcance por plaza es la plaza. */
  scopeLabel?: string;
  /** Etiqueta singular del alcance; «Plaza» cuando la navegación es por plaza. */
  scopeName?: string;
  /** Etiqueta plural del alcance; «plazas» cuando la navegación es por plaza. */
  scopePlural?: string;
  /** Permite capturar calificaciones y generar documentos. */
  canGrade: boolean;
  /** Persiste las filas; false mantiene el formulario abierto. */
  onPersistRows: (rows: ResourceRow[]) => boolean;
  /** Vuelve al listado de talleres. Se omite cuando solo hay uno asignado. */
  onBack?: () => void;
}

export const EvaluationGradingPanel: Component<EvaluationGradingPanelProps> = (props) => {
  const [formOpen, setFormOpen] = createSignal(false);
  const [editingRow, setEditingRow] = createSignal<ResourceRow | undefined>(undefined);
  const [detailRow, setDetailRow] = createSignal<ResourceRow | undefined>(undefined);
  const [templates, setTemplates] = createSignal<GradeTemplate[]>([]);
  const [documents, setDocuments] = createSignal<GradeDocument[]>([]);
  const [templatesOpen, setTemplatesOpen] = createSignal(false);
  const [documentOpen, setDocumentOpen] = createSignal(false);
  const [documentRow, setDocumentRow] = createSignal<ResourceRow | undefined>(undefined);
  const [toast, setToast] = createSignal<ToastState | null>(null);

  onMount(() => {
    setTemplates(loadGradeTemplates());
    setDocuments(loadGradeDocuments());
  });

  const evaluaciones = createMemo<EvaluationRowSummary[]>(() =>
    (props.scopeRows ?? props.rows).map((row) => ({
      row,
      nombre: String(row.estudiante ?? ''),
      plaza: String(row.plaza ?? ''),
      promedio: Number(row.promedio ?? row.calificacion ?? 0),
      estado: String(row.estado ?? ''),
    })),
  );

  const resumen = createMemo(() => {
    const items = evaluaciones();
    const evaluadas = items.filter((item) => item.estado !== 'Pendiente');
    const suma = evaluadas.reduce((total, item) => total + item.promedio, 0);
    return {
      estudiantes: items.length,
      evaluadas: evaluadas.length,
      promedio: evaluadas.length > 0 ? Math.round(suma / evaluadas.length) : 0,
    };
  });

  const savedDocument = createMemo(() => {
    const row = documentRow();
    if (!row) return undefined;
    return documents().find((document) => document.evaluationId === row.id);
  });

  const documentIds = createMemo(() =>
    documents().map((document) => document.evaluationId),
  );

  const openEdit = (row: ResourceRow) => {
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

  const saveEvaluation = (values: Record<string, string>) => {
    const current = editingRow();
    if (!current) return;

    const composed = applyResourceValues(
      evaluacionConfig,
      { ...values, estudiante: String(current.estudiante), taller: props.taller },
      current,
    );
    const nextRows = props.rows.map((row) =>
      row.id === current.id ? composed : row,
    );
    if (!props.onPersistRows(nextRows)) {
      setToast({
        message: 'No se pudieron guardar los cambios en este navegador.',
        tone: 'error',
      });
      return;
    }

    closeForm();
    setToast({ message: 'Calificación guardada.', tone: 'success' });
  };

  const openDocument = (row: ResourceRow) => {
    if (!props.canGrade) return;
    setDocumentRow(row);
    setDocumentOpen(true);
  };

  const closeDocument = () => {
    setDocumentOpen(false);
    setDocumentRow(undefined);
  };

  const manageTemplatesFromDocument = () => {
    closeDocument();
    setTemplatesOpen(true);
  };

  const saveTemplate = (template: GradeTemplate): boolean => {
    const current = templates();
    const exists = current.some((item) => item.id === template.id);
    const next = exists
      ? current.map((item) => (item.id === template.id ? template : item))
      : [template, ...current];
    if (!saveGradeTemplates(next)) {
      setToast({
        message: 'No se pudieron guardar las plantillas en este navegador.',
        tone: 'error',
      });
      return false;
    }
    setTemplates(next);
    setToast({
      message: exists ? 'Plantilla actualizada.' : 'Plantilla creada.',
      tone: 'success',
    });
    return true;
  };

  const deleteTemplate = (id: string): boolean => {
    const next = templates().filter((template) => template.id !== id);
    if (!saveGradeTemplates(next)) {
      setToast({
        message: 'No se pudieron guardar las plantillas en este navegador.',
        tone: 'error',
      });
      return false;
    }
    setTemplates(next);
    setToast({ message: 'Plantilla eliminada.', tone: 'success' });
    return true;
  };

  const saveDocument = (document: GradeDocument): boolean => {
    const current = documents();
    const exists = current.some((item) => item.id === document.id);
    const next = exists
      ? current.map((item) => (item.id === document.id ? document : item))
      : [document, ...current];
    if (!saveGradeDocuments(next)) {
      setToast({
        message: 'No se pudo guardar el documento en este navegador.',
        tone: 'error',
      });
      return false;
    }
    setDocuments(next);
    setToast({
      message: exists ? 'Documento actualizado.' : 'Documento generado.',
      tone: 'success',
    });
    return true;
  };

  return (
    <>
      <header class="workspace__head">
        <div>
          <p class="workspace__eyebrow">{props.scopeName ?? 'Taller'}</p>
          <h2 class="workspace__title-lg">{props.scopeLabel ?? props.taller}</h2>
          <p class="workspace__meta">
            {resumen().estudiantes} estudiantes · {resumen().evaluadas} evaluadas
            {resumen().evaluadas > 0 ? ` · promedio ${resumen().promedio}` : ''}
          </p>
        </div>
        <div class="workspace__actions workspace__actions--end">
          <Show when={props.canGrade}>
            <Button variant="secondary" size="sm" onClick={() => setTemplatesOpen(true)}>
              <Icon name="file" size={16} />
              Plantillas
            </Button>
          </Show>
          <Show when={props.onBack}>
            <Button variant="ghost" size="sm" onClick={() => props.onBack?.()}>
              Ver todos los {props.scopePlural ?? 'talleres'}
            </Button>
          </Show>
        </div>
      </header>

      <EvaluationTable
        taller={props.scopeLabel ?? props.taller}
        scopeName={props.scopeName}
        items={evaluaciones()}
        canGrade={props.canGrade}
        onGrade={openEdit}
        onDocument={openDocument}
        onDetail={setDetailRow}
        documentIds={documentIds()}
      />

      <ResourceFormDialog
        open={formOpen()}
        config={studentEvaluationConfig}
        row={editingRow()}
        onClose={closeForm}
        onSave={saveEvaluation}
      />

      <ResourceDetailDialog
        open={detailRow() !== undefined}
        config={evaluacionConfig}
        row={detailRow()}
        onClose={() => setDetailRow(undefined)}
        onEdit={props.canGrade ? editFromDetail : undefined}
      />

      <TemplateManagerDialog
        open={templatesOpen()}
        templates={templates()}
        onClose={() => setTemplatesOpen(false)}
        onSave={saveTemplate}
        onDelete={deleteTemplate}
      />

      <GradeDocumentDialog
        open={documentOpen()}
        row={documentRow()}
        templates={templates()}
        saved={savedDocument()}
        onClose={closeDocument}
        onSave={saveDocument}
        onManageTemplates={manageTemplatesFromDocument}
      />

      <Toast
        message={toast()?.message ?? null}
        tone={toast()?.tone}
        onDismiss={() => setToast(null)}
      />
    </>
  );
};

export default EvaluationGradingPanel;
