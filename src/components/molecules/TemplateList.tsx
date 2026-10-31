/**
 * TemplateList — listado editable de plantillas de calificación.
 *
 * Capa: molecule
 * Props: templates, confirmingId, onEdit, onDeleteRequest, onDeleteCancel,
 * onDeleteConfirm
 * Efectos: ninguno; la confirmación la controla el contenedor.
 */
import type { Component } from 'solid-js';
import { For, Show } from 'solid-js';

import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import { formatDateInput } from '@/lib/format/date';
import type { GradeTemplate } from '@/types/grading';

export interface TemplateListProps {
  /** Plantillas disponibles. */
  templates: readonly GradeTemplate[];
  /** Plantilla cuya eliminación está en confirmación. */
  confirmingId: string | null;
  /** Abre una plantilla en el editor. */
  onEdit: (template: GradeTemplate) => void;
  /** Solicita confirmar la eliminación. */
  onDeleteRequest: (id: string) => void;
  /** Cancela la confirmación. */
  onDeleteCancel: () => void;
  /** Confirma la eliminación. */
  onDeleteConfirm: (id: string) => void;
}

function sourceLabel(template: GradeTemplate): string {
  return template.source === 'uploaded' ? 'Importada' : 'Personalizada';
}

export const TemplateList: Component<TemplateListProps> = (props) => (
  <ul class="template-list">
    <For each={props.templates}>
      {(template) => (
        <li class="template-item">
          <div class="template-item__head">
            <div class="template-item__content">
              <div class="template-item__title-row">
                <h3 class="template-item__title">{template.name}</h3>
                <Badge tone={template.source === 'uploaded' ? 'info' : 'neutral'}>
                  {sourceLabel(template)}
                </Badge>
              </div>
              <p class="template-item__meta">
                Actualizada el {formatDateInput(template.updatedAt.slice(0, 10))}
                {template.fileName ? ` · ${template.fileName}` : ''}
              </p>
              <p class="template-item__summary">{template.title}</p>
            </div>
            <div class="template-item__actions">
              <Button variant="secondary" size="sm" onClick={() => props.onEdit(template)}>
                <Icon name="edit" size={16} />
                Editar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Eliminar ${template.name}`}
                onClick={() => props.onDeleteRequest(template.id)}
              >
                <Icon name="trash" size={16} />
                Eliminar
              </Button>
            </div>
          </div>

          <Show when={props.confirmingId === template.id}>
            <div
              class="template-item__confirm"
              role="group"
              aria-label={`Confirmar eliminación de ${template.name}`}
            >
              <p>
                ¿Eliminar esta plantilla? Los documentos ya generados conservan su
                contenido.
              </p>
              <div class="inline-actions">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => props.onDeleteConfirm(template.id)}
                >
                  Eliminar
                </Button>
                <Button variant="secondary" size="sm" onClick={props.onDeleteCancel}>
                  Cancelar
                </Button>
              </div>
            </div>
          </Show>
        </li>
      )}
    </For>
  </ul>
);

export default TemplateList;
