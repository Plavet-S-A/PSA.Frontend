/**
 * GradeDocumentPreview — vista previa de un documento de calificación.
 *
 * Capa: molecule
 * Props: heading, body, footer, student, taller, plaza, grade, status, issuedAt
 * Efectos: ninguno; Solid escapa todo el contenido del usuario.
 */
import type { Component } from 'solid-js';
import { Show } from 'solid-js';

import { formatDateInput } from '@/lib/format/date';

export interface GradeDocumentPreviewProps {
  /** Título editable del documento. */
  heading: string;
  /** Cuerpo editable. */
  body: string;
  /** Pie o firma editable. */
  footer: string;
  /** Estudiante de la evaluación. */
  student: string;
  /** Taller de la evaluación. */
  taller: string;
  /** Plaza de la evaluación. */
  plaza: string;
  /** Calificación numérica o vacía. */
  grade: string;
  /** Estado de la evaluación. */
  status: string;
  /** Fecha de emisión en formato YYYY-MM-DD. */
  issuedAt: string;
}

export const GradeDocumentPreview: Component<GradeDocumentPreviewProps> = (props) => (
  <article class="grade-document" aria-label="Vista previa del documento">
    <p class="grade-document__brand">PSA · Plataforma de Seguimiento de Pasantías</p>
    <h3 class="grade-document__title">
      <Show when={props.heading.trim() !== ''} fallback="Documento de calificación">
        {props.heading}
      </Show>
    </h3>

    <dl class="grade-document__meta">
      <div>
        <dt>Estudiante</dt>
        <dd>{props.student}</dd>
      </div>
      <div>
        <dt>Taller</dt>
        <dd>{props.taller}</dd>
      </div>
      <div>
        <dt>Plaza</dt>
        <dd>{props.plaza}</dd>
      </div>
      <div>
        <dt>Calificación</dt>
        <dd>{props.grade === '' ? 'Sin calificación' : `${props.grade}/100`}</dd>
      </div>
      <div>
        <dt>Estado</dt>
        <dd>{props.status}</dd>
      </div>
      <div>
        <dt>Fecha de emisión</dt>
        <dd>{formatDateInput(props.issuedAt)}</dd>
      </div>
    </dl>

    <div class="grade-document__body">
      <Show when={props.body.trim() !== ''} fallback="El contenido del documento aparecerá aquí.">
        {props.body}
      </Show>
    </div>

    <Show when={props.footer.trim() !== ''}>
      <footer class="grade-document__footer">{props.footer}</footer>
    </Show>
  </article>
);

export default GradeDocumentPreview;
