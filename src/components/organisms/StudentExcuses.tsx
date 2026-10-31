/**
 * StudentExcuses — envío y seguimiento de excusas propias.
 *
 * Capa: organism
 * Props: initialRows, studentName
 * Efectos: hidrata y persiste el módulo compartido de excusas; abre el
 * formulario y la ficha de cada envío.
 */
import type { Component } from 'solid-js';
import { createMemo, createSignal, For, onMount, Show } from 'solid-js';

import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import Alert from '@/components/molecules/Alert';
import EmptyState from '@/components/molecules/EmptyState';
import Toast from '@/components/molecules/Toast';
import ResourceDetailDialog from '@/components/organisms/ResourceDetailDialog';
import ResourceFormDialog from '@/components/organisms/ResourceFormDialog';
import {
  excusasEstudianteConfig,
  excusasConfig,
} from '@/lib/catalog/excusas';
import { todayIsoDate } from '@/lib/format/date';
import { pluralize } from '@/lib/format/text';
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

export interface StudentExcusesProps {
  /** Excusas iniciales de la persona. */
  initialRows: readonly ResourceRow[];
  /** Nombre completo de la sesión. */
  studentName: string;
}

export const StudentExcuses: Component<StudentExcusesProps> = (props) => {
  const [rows, setRows] = createSignal<ResourceRow[]>([]);
  const [formOpen, setFormOpen] = createSignal(false);
  const [formError, setFormError] = createSignal('');
  const [detailRow, setDetailRow] = createSignal<ResourceRow | undefined>(undefined);
  const [toast, setToast] = createSignal<ToastState>({ message: '', tone: 'success' });

  const showToast = (message: string, tone: ToastTone = 'success') => {
    setToast({ message, tone });
  };

  const openForm = () => {
    setFormError('');
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormError('');
    setFormOpen(false);
  };

  const ownRows = createMemo(() =>
    rows()
      .filter((row) => String(row.estudiante) === props.studentName)
      .sort((a, b) => String(b.fecha_creacion).localeCompare(String(a.fecha_creacion))),
  );

  onMount(() => {
    setRows(loadResourceRows(excusasConfig.id, props.initialRows));
  });

  const send = (values: Record<string, string>) => {
    const row: ResourceRow = {
      id: createResourceId('excusa'),
      estudiante: props.studentName,
      tutor: values.tutor ?? '',
      tipo: values.tipo ?? '',
      fecha: values.fecha ?? todayIsoDate(),
      descripcion: values.descripcion ?? '',
      estado: 'Pendiente',
      fecha_creacion: todayIsoDate(),
    };
    const next = [...rows(), row];
    if (!saveResourceRows(excusasConfig.id, next, { partial: true })) {
      setFormError('Puede que el navegador no tenga espacio disponible. Inténtalo de nuevo.');
      return;
    }
    setRows(next);
    setFormError('');
    setFormOpen(false);
    showToast('Excusa enviada. Tu tutor la revisará.');
  };

  return (
    <>
      <Alert class="workspace-hint" tone="info">
        Las excusas las revisa tu tutor. Mientras estén pendientes puedes
        consultarlas aquí; recibirás la respuesta de aceptación o rechazo.
      </Alert>

      <div class="workspace__toolbar">
        <p class="workspace__meta">
          {pluralize(ownRows().length, 'excusa', 'excusas')} ·{' '}
          {pluralize(
            ownRows().filter((row) => String(row.estado) === 'Pendiente').length,
            'pendiente',
            'pendientes',
          )}
        </p>
        <Button variant="primary" size="sm" onClick={openForm}>
          Enviar excusa
        </Button>
      </div>

      <Show
        when={ownRows().length > 0}
        fallback={
          <div class="table-card">
            <EmptyState
              icon="clipboard"
              title="Aún no has enviado excusas"
              description="Si faltas, llegas tarde o tienes un problema de documentación, envíalo aquí con el detalle."
              actionLabel="Enviar la primera"
              onAction={openForm}
            />
          </div>
        }
      >
        <div class="table-card">
          <div class="table-scroll" tabindex="0" role="region" aria-label="Mis excusas">
            <table class="data-table">
              <thead>
                <tr>
                  <th scope="col">Tipo</th>
                  <th scope="col">Dirigida a</th>
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
                          <span class="cell-primary__secondary">{row.descripcion}</span>
                        </span>
                      </td>
                      <td>{row.tutor}</td>
                      <td>{row.fecha}</td>
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
                          aria-label={`Ver excusa de ${row.tipo}`}
                        >
                          Ver
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

      <ResourceFormDialog
        open={formOpen()}
        config={excusasEstudianteConfig}
        error={formError()}
        onClose={closeForm}
        onSave={send}
        submitLabel="Enviar excusa"
      />

      <ResourceDetailDialog
        open={detailRow() !== undefined}
        config={excusasEstudianteConfig}
        row={detailRow()}
        onClose={() => setDetailRow(undefined)}
      />

      <Toast
        message={toast().message || null}
        tone={toast().tone}
        onDismiss={() => setToast({ message: '', tone: 'success' })}
      />
    </>
  );
};

export default StudentExcuses;
