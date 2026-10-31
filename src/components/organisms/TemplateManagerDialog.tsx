/**
 * TemplateManagerDialog — alta, importación, edición y borrado de plantillas.
 *
 * Capa: organism
 * Props: open, templates, onClose, onSave, onDelete
 * Efectos: reinicia el editor al abrir, importa archivos y conserva el foco.
 */
import type { Component } from 'solid-js';
import { createEffect, createSignal, Show } from 'solid-js';

import Button from '@/components/atoms/Button';
import Alert from '@/components/molecules/Alert';
import EmptyState from '@/components/molecules/EmptyState';
import Modal from '@/components/molecules/Modal';
import TemplateList from '@/components/molecules/TemplateList';
import TemplateManagerToolbar from '@/components/molecules/TemplateManagerToolbar';
import TemplateEditorForm from '@/components/organisms/TemplateEditorForm';
import { importTemplateFile } from '@/lib/grading/import-template';
import {
  createGradeId,
  templateNameFromFile,
  validateGradeTemplateDraft,
} from '@/lib/grading/templates';
import type { GradeTemplateDraft } from '@/lib/grading/templates';
import type { GradeTemplate } from '@/types/grading';

export interface TemplateManagerDialogProps {
  /** Controla la visibilidad del diálogo. */
  open: boolean;
  /** Plantillas disponibles en el navegador. */
  templates: readonly GradeTemplate[];
  /** Cierra el diálogo. */
  onClose: () => void;
  /** Persiste una plantilla; false mantiene el editor abierto. */
  onSave: (template: GradeTemplate) => boolean;
  /** Elimina una plantilla; false conserva la confirmación. */
  onDelete: (id: string) => boolean;
}

const FORM_ID = 'template-editor-form';
const DEFAULT_FOOTER = 'Expedida el {{fecha}}.\n\n______________________________\nFirma del tutor';

type Mode = 'list' | 'edit';

export const TemplateManagerDialog: Component<TemplateManagerDialogProps> = (props) => {
  const [mode, setMode] = createSignal<Mode>('list');
  const [editing, setEditing] = createSignal<GradeTemplate | undefined>(undefined);
  const [name, setName] = createSignal('');
  const [title, setTitle] = createSignal('');
  const [body, setBody] = createSignal('');
  const [footer, setFooter] = createSignal('');
  const [source, setSource] = createSignal<'custom' | 'uploaded'>('custom');
  const [fileName, setFileName] = createSignal<string | undefined>(undefined);
  const [errors, setErrors] = createSignal<Record<string, string>>({});
  const [uploadError, setUploadError] = createSignal<string | null>(null);
  const [uploading, setUploading] = createSignal(false);
  const [confirmingId, setConfirmingId] = createSignal<string | null>(null);
  let fileInput: HTMLInputElement | undefined;

  const clearError = (key: string) => {
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const resetEditor = () => {
    setEditing(undefined);
    setName('');
    setTitle('');
    setBody('');
    setFooter('');
    setSource('custom');
    setFileName(undefined);
    setErrors({});
  };

  createEffect(() => {
    if (!props.open) return;
    setMode('list');
    setUploadError(null);
    setUploading(false);
    setConfirmingId(null);
    resetEditor();
  });

  const startEdit = (template: GradeTemplate) => {
    setEditing(template);
    setName(template.name);
    setTitle(template.title);
    setBody(template.body);
    setFooter(template.footer);
    setSource(template.source);
    setFileName(template.fileName);
    setErrors({});
    setUploadError(null);
    setMode('edit');
  };

  const startCreate = (seed?: GradeTemplateDraft) => {
    resetEditor();
    setName(seed?.name ?? '');
    setTitle(seed?.title ?? 'Constancia de calificación');
    setBody(seed?.body ?? '');
    setFooter(seed?.footer ?? DEFAULT_FOOTER);
    setSource(seed?.source ?? 'custom');
    setFileName(seed?.fileName);
    setUploadError(null);
    setMode('edit');
  };

  const cancelEdit = () => {
    setMode('list');
    setUploadError(null);
    resetEditor();
  };

  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    const draft: GradeTemplateDraft = {
      name: name(),
      title: title(),
      body: body(),
      footer: footer(),
      source: source(),
      fileName: fileName(),
    };
    const nextErrors = validateGradeTemplateDraft(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const firstKey = Object.keys(nextErrors)[0];
      if (firstKey) {
        queueMicrotask(() =>
          document.getElementById(`template-field-${firstKey}`)?.focus(),
        );
      }
      return;
    }

    const template: GradeTemplate = {
      ...draft,
      id: editing()?.id ?? createGradeId('tpl'),
      updatedAt: new Date().toISOString(),
    };
    if (props.onSave(template)) {
      setMode('list');
      resetEditor();
    }
  };

  const handleFile = async (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      const imported = await importTemplateFile(file);
      const baseName = templateNameFromFile(imported.fileName);
      startCreate({
        name: baseName,
        title: baseName,
        body: imported.body,
        footer: DEFAULT_FOOTER,
        source: 'uploaded',
        fileName: imported.fileName,
      });
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : 'No se pudo importar el archivo.',
      );
    } finally {
      setUploading(false);
    }
  };

  const removeTemplate = (id: string) => {
    if (!props.onDelete(id)) return;
    setConfirmingId(null);
    if (editing()?.id === id) {
      setMode('list');
      resetEditor();
    }
  };

  const titleText = () =>
    mode() === 'edit'
      ? editing()
        ? 'Editar plantilla'
        : 'Nueva plantilla'
      : 'Plantillas de calificación';

  const description = () =>
    mode() === 'edit'
      ? 'Define el título, el contenido y la firma. Los marcadores se sustituyen con los datos de cada estudiante.'
      : 'Crea una plantilla desde cero o importa el texto de un documento para reutilizarlo.';

  const footerActions = () =>
    mode() === 'edit' ? (
      <>
        <Button variant="secondary" onClick={cancelEdit}>Volver</Button>
        <Button variant="primary" type="submit" form={FORM_ID}>
          Guardar plantilla
        </Button>
      </>
    ) : (
      <Button variant="secondary" onClick={props.onClose}>Cerrar</Button>
    );

  return (
    <Modal
      open={props.open}
      title={titleText()}
      description={description()}
      size={mode() === 'edit' ? 'lg' : 'md'}
      onClose={props.onClose}
      footer={footerActions()}
    >
      <Show
        when={mode() === 'edit'}
        fallback={
          <div class="template-manager">
            <TemplateManagerToolbar
              count={props.templates.length}
              uploading={uploading()}
              onUpload={() => fileInput?.click()}
              onCreate={() => startCreate()}
            />

            <input
              ref={(element) => { fileInput = element; }}
              type="file"
              accept=".docx,.html,.htm,.txt,.md"
              hidden
              onChange={handleFile}
            />
            <p class="template-manager__hint">
              Formatos .docx, .html, .txt y .md. Se importa el texto y los marcadores;
              el formato visual se aplica con el diseño de PSA.
            </p>

            <Show when={uploadError()}>
              {(message) => (
                <Alert class="template-manager__error" tone="error" title="No se pudo importar">
                  {message()}
                </Alert>
              )}
            </Show>

            <Show
              when={props.templates.length > 0}
              fallback={
                <div class="template-manager__empty">
                  <EmptyState
                    icon="file"
                    title="Aún no hay plantillas"
                    description="Crea una plantilla desde cero o importa un documento para generar constancias y reportes de calificación."
                  />
                </div>
              }
            >
              <TemplateList
                templates={props.templates}
                confirmingId={confirmingId()}
                onEdit={startEdit}
                onDeleteRequest={setConfirmingId}
                onDeleteCancel={() => setConfirmingId(null)}
                onDeleteConfirm={removeTemplate}
              />
            </Show>
          </div>
        }
      >
        <TemplateEditorForm
          formId={FORM_ID}
          name={name()}
          title={title()}
          body={body()}
          footer={footer()}
          errors={errors()}
          source={source()}
          fileName={fileName()}
          onNameChange={(value) => { setName(value); clearError('name'); }}
          onTitleChange={(value) => { setTitle(value); clearError('title'); }}
          onBodyChange={(value) => { setBody(value); clearError('body'); }}
          onFooterChange={(value) => { setFooter(value); clearError('footer'); }}
          onSubmit={submit}
        />
      </Show>
    </Modal>
  );
};

export default TemplateManagerDialog;
