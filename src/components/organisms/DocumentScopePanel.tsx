/**
 * DocumentScopePanel — navegación del alcance documental.
 *
 * Capa: organism
 * Props: byPlaza, groupKey, groupName, scopeName, scopePlural, estudiantes,
 * estudiante, documentos, pendientes, canManage, canReview y manejadores.
 * Efectos: ninguno; delega la selección al espacio de trabajo.
 */
import type { Component } from 'solid-js';
import { Show } from 'solid-js';

import EmptyState from '@/components/molecules/EmptyState';
import StudentDocumentationList from '@/components/molecules/StudentDocumentationList';
import DocumentStudentPanel from '@/components/organisms/DocumentStudentPanel';
import type { ScopeStudentSummary } from '@/lib/workspace/document-rows';
import type { ResourceRow } from '@/types/resource';

export interface DocumentScopePanelProps {
  /** true cuando el alcance agrupa por plaza en lugar de por taller. */
  byPlaza: boolean;
  /** Clave del grupo seleccionado; null cuando todavía no hay grupo. */
  groupKey: string | null;
  /** Nombre legible del grupo seleccionado. */
  groupName: string;
  /** Etiqueta singular del alcance; «Plaza» cuando la navegación es por plaza. */
  scopeName: string;
  /** Etiqueta plural del alcance; «plazas» cuando la navegación es por plaza. */
  scopePlural: string;
  /** Estudiantes del grupo con el conteo de sus entregas. */
  estudiantes: readonly ScopeStudentSummary[];
  /** Estudiante seleccionado; null cuando todavía no hay ninguno. */
  estudiante: string | null;
  /** Documentos del estudiante seleccionado. */
  documentos: readonly ResourceRow[];
  /** Documentos pendientes del estudiante seleccionado. */
  pendientes: number;
  /** Permite editar y eliminar documentos. */
  canManage: boolean;
  /** Permite aprobar o rechazar entregas. */
  canReview: boolean;
  /** Vuelve al listado de grupos; se omite cuando solo hay uno. */
  onRoot?: () => void;
  /** Selecciona un estudiante del grupo. */
  onSelectStudent: (nombre: string) => void;
  /** Vuelve al listado de estudiantes. */
  onBack: () => void;
  /** Edita un documento. */
  onEdit: (row: ResourceRow) => void;
  /** Elimina un documento. */
  onDelete: (row: ResourceRow) => void;
  /** Notifica la transición del documento con su nuevo estado. */
  onReview: (row: ResourceRow, estado: 'Validado' | 'Rechazado') => void;
}

export const DocumentScopePanel: Component<DocumentScopePanelProps> = (props) => (
  <Show
    when={props.groupKey}
    fallback={
      <div class="table-card">
        <EmptyState
          icon="file"
          title={
            props.byPlaza ? 'Elige una plaza para empezar' : 'Elige un taller para empezar'
          }
          description={
            props.byPlaza
              ? 'La documentación se organiza por plaza y después por estudiante. Selecciona una plaza en la lista; si ocultaste el panel, usa el botón «Plazas» para mostrarlo de nuevo.'
              : 'La documentación se organiza por taller y después por estudiante. Selecciona un taller en la lista; si ocultaste el panel, usa el botón «Talleres» para mostrarlo de nuevo.'
          }
        />
      </div>
    }
  >
    <Show
      when={props.estudiante}
      fallback={
        <StudentDocumentationList
          taller={props.groupName}
          scopeName={props.scopeName}
          scopePlural={props.scopePlural}
          estudiantes={props.estudiantes}
          onSelect={props.onSelectStudent}
          onBack={props.onRoot}
        />
      }
    >
      {(selectedEstudiante) => (
        <DocumentStudentPanel
          taller={props.groupName}
          estudiante={selectedEstudiante()}
          documentos={props.documentos}
          pendientes={props.pendientes}
          canManage={props.canManage}
          canReview={props.canReview}
          onRoot={props.onRoot}
          onBack={props.onBack}
          onEdit={props.onEdit}
          onDelete={props.onDelete}
          onReview={props.onReview}
        />
      )}
    </Show>
  </Show>
);

export default DocumentScopePanel;
