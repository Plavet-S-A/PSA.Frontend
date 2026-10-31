/**
 * ResourceImportDialog — importación masiva desde CSV o Excel.
 *
 * Capa: organism
 * Props: open, config, existingRows, onClose, onImport
 * Efectos: lee el archivo en el navegador, valida filas y solicita confirmación.
 * No interpreta HTML del archivo ni escribe markup no confiable.
 */
import type { Component } from 'solid-js';
import { createEffect, createSignal, createUniqueId, For, Show } from 'solid-js';

import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Alert from '@/components/molecules/Alert';
import Modal from '@/components/molecules/Modal';
import {
  buildImportedRows,
  buildImportTemplate,
  type ResourceImportResult,
} from '@/lib/import/resource-import';
import {
  isAcceptedTableFile,
  readTableFile,
  TABLE_FILE_MAX_BYTES,
} from '@/lib/import/table-file';
import { resolveDeriveRow, resolveNormalizeRow } from '@/lib/catalog/deriver-registry';
import '@/lib/catalog/all-derivers';
import type { ResourceConfig, ResourceRow } from '@/types/resource';

export interface ResourceImportDialogProps {
  /** Controla la visibilidad. */
  open: boolean;
  /** Configuración del módulo; debe declarar `importConfig`. */
  config: ResourceConfig;
  /** Filas actuales para detectar duplicados. */
  existingRows: readonly ResourceRow[];
  /** Cierra el diálogo. */
  onClose: () => void;
  /** Persiste las filas importadas; false mantiene el diálogo abierto. */
  onImport: (rows: readonly ResourceRow[]) => boolean;
}

function fileSizeLabel(bytes: number): string {
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export const ResourceImportDialog: Component<ResourceImportDialogProps> = (props) => {
  const inputId = createUniqueId();
  const [fileName, setFileName] = createSignal('');
  const [fileSize, setFileSize] = createSignal(0);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [result, setResult] = createSignal<ResourceImportResult | null>(null);
  let input: HTMLInputElement | undefined;

  const accepted = () =>
    (props.config.importConfig?.acceptedExtensions ?? []).map((extension) => `.${extension}`);
  const buttonLabel = () => props.config.importConfig?.buttonLabel ?? 'Importar';

  const reset = () => {
    setFileName('');
    setFileSize(0);
    setError(null);
    setResult(null);
    setLoading(false);
    if (input) input.value = '';
  };

  createEffect(() => {
    if (!props.open) reset();
  });

  const close = () => {
    reset();
    props.onClose();
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    const importConfig = props.config.importConfig;
    setError(null);
    setResult(null);
    setFileName(file.name);
    setFileSize(file.size);

    if (!importConfig || !isAcceptedTableFile(file, importConfig.acceptedExtensions)) {
      setError(
        `Formato no compatible. Usa ${accepted().join(' o ')}.`,
      );
      return;
    }
    if (file.size > TABLE_FILE_MAX_BYTES) {
      setError('El archivo supera el límite de 5 MB.');
      return;
    }

    const normalizeRow = resolveNormalizeRow(
      props.config.normalizeRowKey ?? props.config.id,
    );
    const deriveRow = resolveDeriveRow(props.config.deriveRowKey ?? props.config.id);

    setLoading(true);
    try {
      const table = await readTableFile(file);
      const next = buildImportedRows(
        props.config,
        table,
        props.existingRows,
        normalizeRow,
        deriveRow,
      );
      setResult(next);
      if (next.error) setError(next.error);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo leer el archivo.');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const content = buildImportTemplate(props.config);
    const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = props.config.importConfig?.templateName ?? 'plantilla.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const confirmImport = () => {
    const current = result();
    if (!current || current.rows.length === 0) return;
    if (props.onImport(current.rows)) close();
  };

  const previewColumns = () => props.config.columns.slice(0, 3);
  const previewRows = () => result()?.rows.slice(0, 5) ?? [];

  return (
    <Modal
      open={props.open}
      title="Importar registros"
      description={`Carga un archivo CSV o Excel para agregar ${props.config.plural.toLocaleLowerCase('es-MX')} sin capturarlos uno por uno.`}
      size="lg"
      onClose={close}
      footer={
        <>
          <Button variant="secondary" onClick={close}>Cancelar</Button>
          <Button
            variant="primary"
            onClick={confirmImport}
            disabled={loading() || !result()?.rows.length}
          >
            <Icon name="upload" size={16} />
            {result()?.rows.length
              ? `Importar ${result()!.rows.length}`
              : buttonLabel()}
          </Button>
        </>
      }
    >
      <div class="import-dialog">
        <div class="import-dialog__intro">
          <div class="field">
            <label class="field__label" for={inputId}>
              Archivo CSV o Excel
            </label>
            <input
              ref={input}
              id={inputId}
              class="file-input import-dialog__file"
              type="file"
              accept={accepted().join(',')}
              disabled={loading()}
              onChange={(event) => void handleFile(event.currentTarget.files?.[0])}
            />
            <span class="field__hint">
              Máximo 5 MB. La primera fila debe contener los nombres de las columnas.
            </span>
          </div>

          <Button variant="ghost" size="sm" onClick={downloadTemplate}>
            <Icon name="download" size={16} />
            Descargar plantilla
          </Button>
        </div>

        <Show when={fileName()}>
          <p class="import-dialog__file-meta">
            <Icon name="file" size={16} />
            <span>{fileName()}</span>
            <span class="import-dialog__file-size">{fileSizeLabel(fileSize())}</span>
          </p>
        </Show>

        <details class="import-dialog__help">
          <summary>Columnas esperadas</summary>
          <ul class="import-dialog__fields">
            <For each={props.config.fields}>
              {(field) => (
                <li classList={{ 'import-dialog__field--required': field.required }}>
                  {field.label}
                </li>
              )}
            </For>
          </ul>
          <p class="field__hint">
            También se aceptan encabezados equivalentes, por ejemplo “Correo” o
            “Fecha de nacimiento”. Las columnas desconocidas se ignoran.
          </p>
        </details>

        <Show when={loading()}>
          <Alert tone="info">Leyendo el archivo y validando los registros…</Alert>
        </Show>

        <Show when={error()}>
          <Alert tone="error" title="No se pudo preparar la importación">
            {error()}
          </Alert>
        </Show>

        <Show when={result()}>
          {(current) => (
            <Show when={!current().error}>
              <Alert
                tone={
                  current().rows.length === 0
                    ? 'error'
                    : current().issues.length > 0
                      ? 'info'
                      : 'success'
                }
                title={
                  current().rows.length === 0
                    ? 'No hay filas válidas para importar'
                    : `${current().rows.length} ${
                        current().rows.length === 1 ? 'registro listo' : 'registros listos'
                      } para importar`
                }
              >
                <p>
                  {current().totalRows}{' '}
                  {current().totalRows === 1 ? 'fila leída' : 'filas leídas'}
                  {current().issues.length > 0
                    ? ` · ${current().issues.length} ${
                        current().issues.length === 1
                          ? 'fila con observaciones'
                          : 'filas con observaciones'
                      }`
                    : ''}
                  .
                </p>
              </Alert>

              <Show when={current().mappedHeaders.length > 0}>
                <p class="import-dialog__meta">
                  Columnas reconocidas:{' '}
                  {current()
                    .mappedHeaders.map((item) => item.header)
                    .join(', ')}
                </p>
              </Show>

              <Show when={current().ignoredHeaders.length > 0}>
                <p class="import-dialog__meta">
                  Columnas ignoradas: {current().ignoredHeaders.join(', ')}.
                </p>
              </Show>

              <Show when={current().issues.length > 0}>
                <div class="import-dialog__issues">
                  <h3 class="import-dialog__issues-title">Filas que no se importarán</h3>
                  <ul>
                    <For each={current().issues.slice(0, 8)}>
                      {(issue) => (
                        <li>
                          <strong>Fila {issue.row}:</strong> {issue.message}
                        </li>
                      )}
                    </For>
                  </ul>
                  <Show when={current().issues.length > 8}>
                    <p class="field__hint">
                      Y {current().issues.length - 8} fila(s) más con observaciones.
                    </p>
                  </Show>
                </div>
              </Show>

              <Show when={previewRows().length > 0}>
                <div class="import-dialog__preview">
                  <h3 class="import-dialog__issues-title">Vista previa</h3>
                  <div class="table-scroll" tabindex="0" role="region" aria-label="Vista previa de la importación">
                    <table class="data-table">
                      <thead>
                        <tr>
                          <For each={previewColumns()}>
                            {(column) => <th scope="col">{column.label}</th>}
                          </For>
                        </tr>
                      </thead>
                      <tbody>
                        <For each={previewRows()}>
                          {(row) => (
                            <tr>
                              <For each={previewColumns()}>
                                {(column) => (
                                  <td>{String(row[column.key] ?? '')}</td>
                                )}
                              </For>
                            </tr>
                          )}
                        </For>
                      </tbody>
                    </table>
                  </div>
                  <Show when={current().rows.length > previewRows().length}>
                    <p class="field__hint">
                      Se muestran las primeras {previewRows().length} filas de{' '}
                      {current().rows.length}.
                    </p>
                  </Show>
                </div>
              </Show>
            </Show>
          )}
        </Show>
      </div>
    </Modal>
  );
};

export default ResourceImportDialog;
