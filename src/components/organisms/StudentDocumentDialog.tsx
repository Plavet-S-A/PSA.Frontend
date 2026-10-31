/**
 * StudentDocumentDialog — carga de un documento al expediente propio.
 *
 * Capa: organism
 * Props: open, tipos, onSubmit, onClose
 * Efectos: valida tipo, fecha, formato PDF y tamaño antes de entregar el archivo.
 */
import type { Component } from 'solid-js';
import { createEffect, createSignal, Show } from 'solid-js';

import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Alert from '@/components/molecules/Alert';
import FormField from '@/components/molecules/FormField';
import Modal from '@/components/molecules/Modal';
import { todayIsoDate } from '@/lib/format/date';

/** Tamaño máximo aceptado por la demostración. */
export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export interface StudentDocumentValues {
  tipo: string;
  fecha: string;
  archivo: File;
}

export interface StudentDocumentDialogProps {
  /** Controla la visibilidad. */
  open: boolean;
  /** Tipos de documento disponibles. */
  tipos: readonly string[];
  /** Entrega los valores ya validados. */
  onSubmit: (values: StudentDocumentValues) => void | Promise<void>;
  /** Cierra el diálogo. */
  onClose: () => void;
}

const FORM_ID = 'student-document-form';

/** Indica si el archivo es un PDF por tipo MIME o extensión. */
function isPdf(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

export const StudentDocumentDialog: Component<StudentDocumentDialogProps> = (props) => {
  const [tipo, setTipo] = createSignal('');
  const [fecha, setFecha] = createSignal(todayIsoDate());
  const [archivo, setArchivo] = createSignal<File | null>(null);
  const [errors, setErrors] = createSignal<Record<string, string>>({});
  const [submitting, setSubmitting] = createSignal(false);

  createEffect(() => {
    if (!props.open) return;
    setTipo('');
    setFecha(todayIsoDate());
    setArchivo(null);
    setErrors({});
    setSubmitting(false);
  });

  const validate = (): StudentDocumentValues | null => {
    const next: Record<string, string> = {};
    const file = archivo();
    if (!tipo()) next.tipo = 'Selecciona el tipo de documento.';
    if (!fecha()) next.fecha = 'Indica la fecha del documento.';
    if (!file) next.archivo = 'Adjunta el archivo PDF.';
    else if (!isPdf(file)) next.archivo = 'El archivo debe ser un PDF.';
    else if (file.size > MAX_FILE_BYTES) next.archivo = 'El archivo supera los 5 MB.';
    setErrors(next);
    if (Object.keys(next).length > 0 || !file) return null;
    return { tipo: tipo(), fecha: fecha(), archivo: file };
  };

  const submit = async (event: SubmitEvent) => {
    event.preventDefault();
    if (submitting()) return;

    const values = validate();
    if (!values) return;

    setSubmitting(true);
    try {
      await props.onSubmit(values);
    } catch {
      setErrors((current) => ({
        ...current,
        form: 'No se pudo guardar el documento. Inténtalo de nuevo.',
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const errorId = (key: string) => `${FORM_ID}-${key}-error`;

  return (
    <Modal
      open={props.open}
      title="Subir documento"
      description="El documento quedará en revisión para tu tutor académico."
      size="md"
      onClose={props.onClose}
      footer={
        <>
          <Button variant="secondary" onClick={props.onClose} disabled={submitting()}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="submit"
            form={FORM_ID}
            loading={submitting()}
          >
            Enviar documento
          </Button>
        </>
      }
    >
      <form id={FORM_ID} class="form-grid" onSubmit={submit} noValidate>
        <Show when={errors().form}>
          <Alert tone="error" class="field--wide">
            {errors().form}
          </Alert>
        </Show>

        <FormField
          id="student-doc-tipo"
          label="Tipo de documento"
          type="select"
          value={tipo()}
          options={props.tipos}
          required
          error={errors().tipo}
          onInput={setTipo}
        />
        <FormField
          id="student-doc-fecha"
          label="Fecha del documento"
          type="date"
          value={fecha()}
          required
          error={errors().fecha}
          onInput={setFecha}
        />

        <div
          class={[
            'field',
            'field--wide',
            errors().archivo ? 'field--invalid' : '',
          ].filter(Boolean).join(' ')}
        >
          <label class="field__label" for="student-doc-file">
            Archivo PDF
            <span class="field__required" aria-hidden="true"> *</span>
            <span class="psa-visually-hidden"> (obligatorio)</span>
          </label>
          <input
            id="student-doc-file"
            class="file-input"
            type="file"
            accept="application/pdf,.pdf"
            required
            aria-invalid={errors().archivo ? 'true' : undefined}
            aria-describedby={errors().archivo ? errorId('archivo') : 'student-doc-file-hint'}
            onChange={(event) => setArchivo(event.currentTarget.files?.[0] ?? null)}
          />
          <Show
            when={errors().archivo}
            fallback={
              <span class="field__hint" id="student-doc-file-hint">
                PDF de hasta 5 MB. Verifica que el archivo esté legible y completo.
              </span>
            }
          >
            <span class="field__error" id={errorId('archivo')}>
              <Icon name="alert" size={16} />
              {errors().archivo}
            </span>
          </Show>
        </div>
      </form>
    </Modal>
  );
};

export default StudentDocumentDialog;
