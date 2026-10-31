/**
 * GradeDocumentDialog — genera, edita y descarga el documento de una evaluación.
 *
 * Capa: organism
 * Props: open, row, templates, saved, onClose, onSave, onManageTemplates
 * Efectos: reinicia el contenido al abrir y sincroniza la vista previa.
 */
import type { Component } from 'solid-js';
import { createEffect, createSignal, Show } from 'solid-js';

import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Alert from '@/components/molecules/Alert';
import EmptyState from '@/components/molecules/EmptyState';
import GradeDocumentPreview from '@/components/molecules/GradeDocumentPreview';
import Modal from '@/components/molecules/Modal';
import GradeDocumentEditor from '@/components/organisms/GradeDocumentEditor';
import {
  buildGradeDocumentHtml,
  downloadGradeDocument,
} from '@/lib/grading/document-html';
import {
  applyGradeTemplate,
  createGradeId,
  gradeDocumentFilename,
  gradeValuesFromRow,
  todayIsoDate,
  validateGradeDocumentDraft,
} from '@/lib/grading/templates';
import type { GradeDocument, GradeTemplate } from '@/types/grading';
import type { ResourceRow } from '@/types/resource';

export interface GradeDocumentDialogProps {
  /** Controla la visibilidad del diálogo. */
  open: boolean;
  /** Evaluación que se convertirá en documento. */
  row?: ResourceRow;
  /** Plantillas disponibles. */
  templates: readonly GradeTemplate[];
  /** Documento previamente guardado para esta evaluación. */
  saved?: GradeDocument;
  /** Cierra el diálogo. */
  onClose: () => void;
  /** Persiste el documento; false mantiene el formulario abierto. */
  onSave: (document: GradeDocument) => boolean;
  /** Abre el administrador de plantillas. */
  onManageTemplates: () => void;
}

const FORM_ID = 'grade-document-form';

function fieldId(key: string): string {
  return `document-field-${key}`;
}

export const GradeDocumentDialog: Component<GradeDocumentDialogProps> = (props) => {
  const [templateId, setTemplateId] = createSignal('');
  const [heading, setHeading] = createSignal('');
  const [body, setBody] = createSignal('');
  const [footer, setFooter] = createSignal('');
  const [issuedAt, setIssuedAt] = createSignal(todayIsoDate());
  const [errors, setErrors] = createSignal<Record<string, string>>({});
  const [message, setMessage] = createSignal<string | null>(null);

  const rowValue = (key: string): string => String(props.row?.[key] ?? '');
  const canEdit = () => props.templates.length > 0 || props.saved !== undefined;
  const savedTemplateMissing = () =>
    props.saved !== undefined &&
    !props.templates.some((template) => template.id === props.saved?.templateId);

  createEffect(() => {
    if (!props.open) return;
    setErrors({});
    setMessage(null);

    const saved = props.saved;
    if (saved) {
      setTemplateId(saved.templateId);
      setHeading(saved.heading);
      setBody(saved.body);
      setFooter(saved.footer);
      setIssuedAt(saved.issuedAt);
      return;
    }

    const date = todayIsoDate();
    setIssuedAt(date);
    const template = props.templates[0];
    setTemplateId(template?.id ?? '');
    if (!template || !props.row) {
      setHeading('');
      setBody('');
      setFooter('');
      return;
    }

    const generated = applyGradeTemplate(
      template,
      gradeValuesFromRow(props.row, date),
    );
    setHeading(generated.heading);
    setBody(generated.body);
    setFooter(generated.footer);
  });

  const selectTemplate = (id: string) => {
    setTemplateId(id);
    const template = props.templates.find((item) => item.id === id);
    if (!template || !props.row) return;
    const generated = applyGradeTemplate(
      template,
      gradeValuesFromRow(props.row, issuedAt()),
    );
    setHeading(generated.heading);
    setBody(generated.body);
    setFooter(generated.footer);
    setErrors({});
    setMessage('Contenido regenerado con la plantilla seleccionada.');
  };

  const restoreTemplate = () => {
    const template =
      props.templates.find((item) => item.id === templateId()) ?? props.templates[0];
    if (!template || !props.row) {
      setMessage('No hay una plantilla disponible para restaurar el contenido.');
      return;
    }
    setTemplateId(template.id);
    const generated = applyGradeTemplate(
      template,
      gradeValuesFromRow(props.row, issuedAt()),
    );
    setHeading(generated.heading);
    setBody(generated.body);
    setFooter(generated.footer);
    setErrors({});
    setMessage('Contenido restaurado desde la plantilla.');
  };

  const validate = (): boolean => {
    const nextErrors = validateGradeDocumentDraft({
      heading: heading(),
      body: body(),
      footer: footer(),
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) return true;

    const firstKey = Object.keys(nextErrors)[0];
    if (firstKey) {
      queueMicrotask(() => document.getElementById(fieldId(firstKey))?.focus());
    }
    return false;
  };

  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    if (!props.row || !validate()) return;

    const document: GradeDocument = {
      id: props.saved?.id ?? createGradeId('doc'),
      evaluationId: props.row.id,
      templateId: templateId() || props.saved?.templateId || '',
      heading: heading().trim(),
      body: body().trim(),
      footer: footer().trim(),
      issuedAt: issuedAt(),
      updatedAt: new Date().toISOString(),
    };

    if (props.onSave(document)) props.onClose();
  };

  const download = () => {
    if (!props.row || !validate()) return;
    const html = buildGradeDocumentHtml({
      heading: heading().trim(),
      body: body().trim(),
      footer: footer().trim(),
      student: rowValue('estudiante'),
      taller: rowValue('taller'),
      plaza: rowValue('plaza'),
      grade: rowValue('calificacion'),
      status: rowValue('estado'),
      issuedAt: issuedAt(),
    });
    const fileName = gradeDocumentFilename(heading(), rowValue('estudiante'));
    if (!downloadGradeDocument(fileName, html)) {
      setMessage('No se pudo iniciar la descarga. Revisa los permisos del navegador.');
    }
  };

  const footerActions = () =>
    canEdit() ? (
      <>
        <Button variant="secondary" onClick={props.onClose}>Cancelar</Button>
        <Button variant="secondary" onClick={download}>
          <Icon name="download" size={16} />
          Descargar
        </Button>
        <Button variant="primary" type="submit" form={FORM_ID}>
          Guardar documento
        </Button>
      </>
    ) : (
      <Button variant="secondary" onClick={props.onClose}>Cerrar</Button>
    );

  return (
    <Modal
      open={props.open}
      title="Documento de calificación"
      description={
        props.row
          ? `Genera, edita y descarga el documento de ${rowValue('estudiante')}.`
          : 'Genera un documento editable a partir de una plantilla.'
      }
      size="lg"
      onClose={props.onClose}
      footer={footerActions()}
    >
      <Show
        when={canEdit()}
        fallback={
          <EmptyState
            icon="file"
            title="Primero crea una plantilla"
            description="Las plantillas definen el título, el contenido y la firma del documento. Puedes crearlas desde cero o importar un archivo."
            actionLabel="Gestionar plantillas"
            onAction={props.onManageTemplates}
          />
        }
      >
        <Show when={props.saved}>
          <Alert class="document-saved" tone="success" title="Documento guardado">
            Puedes ajustar el contenido y volver a guardarlo. La vista previa y la
            descarga usan la información actual de la evaluación.
          </Alert>
        </Show>
        <Show when={savedTemplateMissing()}>
          <Alert class="document-saved" tone="info" title="Plantilla no disponible">
            La plantilla original ya no está en el catálogo, pero el documento
            guardado se conserva y sigue siendo editable.
          </Alert>
        </Show>
        <Show when={message()}>
          {(text) => <Alert class="document-saved" tone="info">{text()}</Alert>}
        </Show>

        <div class="document-layout">
          <GradeDocumentEditor
            formId={FORM_ID}
            templates={props.templates}
            templateId={templateId()}
            heading={heading()}
            body={body()}
            footer={footer()}
            errors={errors()}
            onTemplateChange={selectTemplate}
            onHeadingChange={setHeading}
            onBodyChange={setBody}
            onFooterChange={setFooter}
            onRestore={restoreTemplate}
            onSubmit={submit}
          />

          <div class="document-preview">
            <p class="workspace__eyebrow">Vista previa</p>
            <GradeDocumentPreview
              heading={heading()}
              body={body()}
              footer={footer()}
              student={rowValue('estudiante')}
              taller={rowValue('taller')}
              plaza={rowValue('plaza')}
              grade={rowValue('calificacion')}
              status={rowValue('estado')}
              issuedAt={issuedAt()}
            />
          </div>
        </div>
      </Show>
    </Modal>
  );
};

export default GradeDocumentDialog;
