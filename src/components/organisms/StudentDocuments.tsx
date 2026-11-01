/**
 * StudentDocuments — expediente propio con carga de PDF.
 *
 * Capa: organism
 * Props: initialRows, studentName, studentCode, taller, tallerCode, tipos
 * Efectos: hidrata y persiste el módulo compartido de documentación; abre el
 * diálogo de carga y la ficha de cada entrega.
 */
import type { Component } from 'solid-js';
import { createMemo, createSignal, For, onMount, Show } from 'solid-js';

import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import EmptyState from '@/components/molecules/EmptyState';
import Toast from '@/components/molecules/Toast';
import DocumentPdfViewer from '@/components/organisms/DocumentPdfViewer';
import ResourceDetailDialog from '@/components/organisms/ResourceDetailDialog';
import StudentDocumentDialog, {
  type StudentDocumentValues,
} from '@/components/organisms/StudentDocumentDialog';
import { documentacionConfig } from '@/lib/catalog/documentacion';
import { pluralize } from '@/lib/format/text';
import {
  deleteDocumentFile,
  saveDocumentFile,
} from '@/lib/storage/document-files';
import {
  createResourceId,
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

export interface StudentDocumentsProps {
  /** Filas iniciales del expediente propio. */
  initialRows: readonly ResourceRow[];
  /** Nombre completo de la sesión. */
  studentName: string;
  /** Llave numérica del estudiante. */
  studentCode: number;
  /** Taller al que pertenece. */
  taller: string;
  /** Llave numérica del taller. */
  tallerCode: number;
  /** Tipos de documento admitidos. */
  tipos: readonly string[];
}

/** Convierte un nombre de archivo en un segmento seguro de ruta. */
function safeFileName(name: string): string {
  const normalized = name
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-');
  return normalized.replace(/^[-.]+/, '') || 'documento.pdf';
}

export const StudentDocuments: Component<StudentDocumentsProps> = (props) => {
  const [rows, setRows] = createSignal<ResourceRow[]>([]);
  const [uploadOpen, setUploadOpen] = createSignal(false);
  const [detailRow, setDetailRow] = createSignal<ResourceRow | undefined>(undefined);
  const [toast, setToast] = createSignal<ToastState>({ message: '', tone: 'success' });

  const showToast = (message: string, tone: ToastTone = 'success') => {
    setToast({ message, tone });
  };

  const ownRows = createMemo(() =>
    rows()
      .filter((row) => String(row.estudiante) === props.studentName)
      .sort((a, b) => String(b.fecha_creacion).localeCompare(String(a.fecha_creacion))),
  );

  onMount(() => {
    setRows(loadResourceRows(documentacionConfig.id, props.initialRows));
  });

  const upload = async (values: StudentDocumentValues) => {
    const file = values.archivo;
    const row: ResourceRow = {
      id: createResourceId('doc'),
      id_estudiante: props.studentCode,
      estudiante: props.studentName,
      id_taller: props.tallerCode,
      taller: props.taller,
      tipo: values.tipo,
      storage_path: `estudiantes/est-${String(props.studentCode).padStart(3, '0')}/${safeFileName(file.name)}`,
      bucket: 'psa-documentos',
      archivo: file.name,
      tamano_kb: Math.ceil(file.size / 1024),
      estado: 'Recibido',
      fecha_creacion: values.fecha,
    };

    if (!(await saveDocumentFile(row.id, file))) {
      showToast('No se pudo guardar el PDF en este navegador.', 'error');
      return;
    }

    const next = [...rows(), row];
    if (!saveResourceRows(documentacionConfig.id, next, { partial: true })) {
      void deleteDocumentFile(row.id);
      showToast('No se pudo guardar el documento en este navegador.', 'error');
      return;
    }
    setRows(next);
    setUploadOpen(false);
    showToast('Documento enviado. Tu tutor lo revisará.');
  };

  return (
    <>
      <div class="workspace__toolbar">
        <p class="workspace__meta">
          {pluralize(ownRows().length, 'documento', 'documentos')} · {props.taller}
        </p>
        <Button variant="primary" size="sm" onClick={() => setUploadOpen(true)}>
          Subir documento
        </Button>
      </div>

      {/* Resumen dinámico de documentos requeridos */}
      <div class="doc-summary">
        <div class="doc-summary__head">
          <div>
            <h3 class="doc-summary__title">Documentos requeridos</h3>
            <p class="doc-summary__subtitle">Completa tu expediente para que tu tutor pueda dar seguimiento</p>
          </div>
          <div class="doc-summary__progress">
            <span class="doc-summary__progress-value">
              {(() => {
                const total = props.tipos.length;
                const done = props.tipos.filter(t => ownRows().some(r => r.tipo === t)).length;
                return `${done}/${total}`;
              })()}
            </span>
          </div>
        </div>
        <div class="doc-summary__bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-label="Progreso de documentos">
          <div
            class="doc-summary__bar-fill"
            style={`width: ${(() => {
              const total = props.tipos.length || 1;
              const done = props.tipos.filter(t => ownRows().some(r => r.tipo === t)).length;
              return `${Math.round((done / total) * 100)}%`;
            })()}`}
          />
        </div>
        <ul class="doc-summary__chips">
          <For each={props.tipos}>
            {(tipo) => {
              const uploaded = ownRows().some(r => r.tipo === tipo);
              return (
                <li class={`doc-chip ${uploaded ? 'is-uploaded' : 'is-pending'}`}>
                  <span class="doc-chip__icon" aria-hidden="true">
                    <Icon name={uploaded ? 'check' : 'circle'} size={14} />
                  </span>
                  <span class="doc-chip__label">{tipo}</span>
                </li>
              );
            }}
          </For>
        </ul>
      </div>

      <Show
        when={ownRows().length > 0}
        fallback={
          <div class="table-card">
            <EmptyState
              icon="file"
              title="Aún no has subido documentos"
              description="Sube tu convenio, carta de presentación o reportes en PDF. Tu tutor académico los revisará."
              actionLabel="Subir el primero"
              onAction={() => setUploadOpen(true)}
            />
          </div>
        }
      >
        <div class="table-card">
          <div class="table-scroll" tabindex="0" role="region" aria-label="Mis documentos">
            <table class="data-table">
              <thead>
                <tr>
                  <th scope="col">Tipo</th>
                  <th scope="col">Archivo</th>
                  <th scope="col">Fecha</th>
                  <th scope="col">Estado</th>
                  <th scope="col" data-align="actions">
                    <span class="psa-visually-hidden">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <For each={ownRows()}>
                  {(row) => (
                    <tr>
                      <td>
                        <span class="cell-primary">
                          <span class="cell-primary__name">{row.tipo}</span>
                          <span class="cell-primary__secondary">
                            {Number(row.tamano_kb ?? 0)} KB
                          </span>
                        </span>
                      </td>
                      <td>{row.archivo ?? 'Archivo adjunto'}</td>
                      <td>{row.fecha_creacion}</td>
                      <td>
                        <Badge tone={statusTone(String(row.estado))}>
                          {row.estado}
                        </Badge>
                      </td>
                      <td data-align="actions">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetailRow(row)}
                          aria-label={`Ver ${row.tipo}`}
                          title="Ver documento"
                        >
                          <Icon name="eye" size={18} />
                          <span class="psa-visually-hidden">Ver</span>
                        </Button>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </div>
      </Show>

      <StudentDocumentDialog
        open={uploadOpen()}
        tipos={props.tipos}
        onSubmit={upload}
        onClose={() => setUploadOpen(false)}
      />

      <ResourceDetailDialog
        open={detailRow() !== undefined}
        config={documentacionConfig}
        row={detailRow()}
        size="xl"
        onClose={() => setDetailRow(undefined)}
        preview={
          <Show when={detailRow()} keyed>
            {(row) => <DocumentPdfViewer row={row} />}
          </Show>
        }
      />

      <Toast
        message={toast().message || null}
        tone={toast().tone}
        onDismiss={() => setToast({ message: '', tone: 'success' })}
      />
    </>
  );
};

export default StudentDocuments;
