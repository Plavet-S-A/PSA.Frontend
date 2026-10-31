/**
 * DocumentStudentPanel — detalle de documentos de un estudiante.
 *
 * Capa: organism
 * Props: taller, estudiante, documentos, pendientes, canManage, canReview,
 * callbacks
 * Efectos: ninguno; las acciones de revisión se notifican al contenedor.
 */
import type { Component } from 'solid-js';
import { createSignal, Show } from 'solid-js';

import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import EmptyState from '@/components/molecules/EmptyState';
import DocumentPdfViewer from '@/components/organisms/DocumentPdfViewer';
import ResourceDetailDialog from '@/components/organisms/ResourceDetailDialog';
import ResourceTable from '@/components/organisms/ResourceTable';
import { documentacionStudentConfig } from '@/lib/catalog/documentacion';
import type { ResourceRow } from '@/types/resource';

export interface DocumentStudentPanelProps {
  /** Taller o plaza a la que pertenece el estudiante. */
  taller: string;
  estudiante: string;
  documentos: readonly ResourceRow[];
  pendientes: number;
  canManage: boolean;
  /** Permite aprobar o rechazar entregas desde el detalle. */
  canReview: boolean;
  /** Vuelve al listado de talleres. Se omite cuando solo hay uno asignado. */
  onRoot?: () => void;
  onBack: () => void;
  onEdit: (row: ResourceRow) => void;
  onDelete: (row: ResourceRow) => void;
  /** Notifica la transición del documento con su nuevo estado. */
  onReview: (row: ResourceRow, estado: 'Validado' | 'Rechazado') => void;
}

export const DocumentStudentPanel: Component<DocumentStudentPanelProps> = (props) => {
  const [detailRow, setDetailRow] = createSignal<ResourceRow | undefined>(undefined);

  const editFromDetail = (row: ResourceRow) => {
    setDetailRow(undefined);
    props.onEdit(row);
  };

  const review = (row: ResourceRow, estado: 'Validado' | 'Rechazado') => {
    setDetailRow(undefined);
    props.onReview(row, estado);
  };

  const reviewActions = () => {
    const row = detailRow();
    if (!props.canReview || !row) return undefined;

    return (
      <>
        <Show when={String(row.estado ?? '') !== 'Validado'}>
          <Button variant="success" onClick={() => review(row, 'Validado')}>
            <Icon name="check" size={16} />
            Aprobar
          </Button>
        </Show>
        <Show when={String(row.estado ?? '') !== 'Rechazado'}>
          <Button variant="danger" onClick={() => review(row, 'Rechazado')}>
            <Icon name="x" size={16} />
            Rechazar
          </Button>
        </Show>
      </>
    );
  };

  return (
    <>
      <nav class="workspace__crumbs" aria-label="Ruta de documentación">
        <Show when={props.onRoot}>
          <button class="workspace__crumb" type="button" onClick={() => props.onRoot?.()}>
            Documentación
          </button>
          <span class="workspace__crumb-sep" aria-hidden="true">/</span>
        </Show>
        <button class="workspace__crumb" type="button" onClick={props.onBack}>
          {props.taller}
        </button>
        <span class="workspace__crumb-sep" aria-hidden="true">/</span>
        <span class="workspace__crumb-current" aria-current="page">
          {props.estudiante}
        </span>
      </nav>

      <header class="workspace__head">
        <div>
          <p class="workspace__eyebrow">Estudiante</p>
          <h2 class="workspace__title-lg">{props.estudiante}</h2>
          <p class="workspace__meta">
            {props.documentos.length} documentos · {props.pendientes} pendientes
          </p>
        </div>
        <div class="workspace__actions workspace__actions--end">
          <Button variant="ghost" size="sm" onClick={props.onBack}>
            Volver a estudiantes
          </Button>
        </div>
      </header>

      <Show
        when={props.documentos.length > 0}
        fallback={
          <div class="table-card">
            <EmptyState
              icon="file"
              title="Este estudiante aún no tiene documentos"
              description="Cuando el estudiante suba su primera entrega, aparecerá aquí."
            />
          </div>
        }
      >
        <div class="table-card">
          <ResourceTable
            config={documentacionStudentConfig}
            rows={props.documentos}
            onDetail={setDetailRow}
            onRowClick={setDetailRow}
            onEdit={props.canManage ? editFromDetail : undefined}
            onDelete={props.canManage ? props.onDelete : undefined}
          />
        </div>
      </Show>

      <ResourceDetailDialog
        open={detailRow() !== undefined}
        config={documentacionStudentConfig}
        row={detailRow()}
        size="xl"
        onClose={() => setDetailRow(undefined)}
        onEdit={props.canManage ? editFromDetail : undefined}
        preview={
          <Show when={detailRow()} keyed>
            {(row) => <DocumentPdfViewer row={row} />}
          </Show>
        }
        footerActions={reviewActions()}
      />
    </>
  );
};

export default DocumentStudentPanel;
