/**
 * DocumentPdfViewer — vista previa embebida de un PDF del expediente.
 *
 * Capa: organism
 * Props: row
 * Efectos: recupera el blob de IndexedDB, genera un PDF de demostración cuando
 * no existe archivo local y crea un `blob:` URL que revoca al desmontar. El PDF
 * lo renderiza el visor nativo del navegador dentro de un iframe; no se inyecta
 * HTML ni se usa `object-src`.
 */
import type { Component } from 'solid-js';
import { createSignal, onCleanup, onMount, Show } from 'solid-js';

import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Alert from '@/components/molecules/Alert';
import {
  createDocumentPreviewPdf,
  documentPdfFileName,
} from '@/lib/documentos/preview-pdf';
import { loadDocumentFile } from '@/lib/storage/document-files';
import { buttonVariantClass } from '@/lib/ui/daisy';
import type { ResourceRow } from '@/types/resource';

export interface DocumentPdfViewerProps {
  /** Fila del documento que se consulta. */
  row: ResourceRow;
}

export const DocumentPdfViewer: Component<DocumentPdfViewerProps> = (props) => {
  const [source, setSource] = createSignal<string | undefined>(undefined);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  let objectUrl: string | undefined;
  let request = 0;

  const title = () => String(props.row.tipo ?? 'Documento');
  const fileName = () => documentPdfFileName(props.row);
  const fileSize = () => Number(props.row.tamano_kb ?? 0);
  const fileMeta = () => (fileSize() > 0 ? `PDF · ${fileSize()} KB` : 'PDF');

  const releaseObjectUrl = () => {
    if (!objectUrl) return;
    URL.revokeObjectURL(objectUrl);
    objectUrl = undefined;
  };

  const load = async () => {
    const currentRequest = ++request;
    releaseObjectUrl();
    setSource(undefined);
    setError(null);
    setLoading(true);

    try {
      const stored = await loadDocumentFile(props.row.id);
      if (currentRequest !== request) return;

      const blob = stored ?? createDocumentPreviewPdf(props.row);
      objectUrl = URL.createObjectURL(blob);
      setSource(objectUrl);
    } catch {
      if (currentRequest === request) {
        setError(
          'No se pudo preparar el PDF. Verifica que el archivo siga disponible e inténtalo de nuevo.',
        );
      }
    } finally {
      if (currentRequest === request) setLoading(false);
    }
  };

  onMount(() => {
    void load();
  });

  onCleanup(() => {
    request += 1;
    releaseObjectUrl();
  });

  return (
    <section
      class="pdf-preview"
      aria-label={`Vista previa de ${title()}`}
      aria-busy={loading() ? 'true' : undefined}
    >
      <header class="pdf-preview__header">
        <div>
          <p class="pdf-preview__eyebrow">Archivo adjunto</p>
          <p class="pdf-preview__file">{fileName()}</p>
          <p class="pdf-preview__meta">{fileMeta()}</p>
        </div>
        <Show when={source()}>
          {(url) => (
            <div class="pdf-preview__actions">
              <a
                class={`btn ${buttonVariantClass('secondary')} btn-sm`}
                href={url()}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="arrow-right" size={16} />
                Abrir en pestaña
              </a>
              <a
                class={`btn ${buttonVariantClass('secondary')} btn-sm`}
                href={url()}
                download={fileName()}
              >
                <Icon name="download" size={16} />
                Descargar
              </a>
            </div>
          )}
        </Show>
      </header>

      <Show when={loading()}>
        <div class="pdf-preview__state" role="status">
          <span class="loading loading-spinner" aria-hidden="true" />
          <span>Preparando la vista previa del PDF…</span>
        </div>
      </Show>

      <Show when={error()}>
        <Alert tone="error" title="No se pudo mostrar el PDF">
          {error()}
        </Alert>
        <div class="pdf-preview__retry">
          <Button variant="secondary" size="sm" onClick={() => void load()}>
            <Icon name="refresh" size={16} />
            Reintentar
          </Button>
        </div>
      </Show>

      <Show when={source()}>
        {(url) => (
          <>
            <iframe
              class="pdf-preview__frame"
              src={url()}
              title={`Vista previa de ${title()} (PDF)`}
              referrerpolicy="no-referrer"
            />
            <p class="pdf-preview__hint">
              Si el visor no carga,{' '}
              <a href={url()} target="_blank" rel="noopener noreferrer">
                abre el PDF en una pestaña nueva
              </a>
              .
            </p>
          </>
        )}
      </Show>
    </section>
  );
};

export default DocumentPdfViewer;
