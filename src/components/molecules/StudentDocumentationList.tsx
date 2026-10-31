/**
 * StudentDocumentationList — estudiantes de un taller y estado de sus entregas.
 *
 * Capa: molecule
 * Props: taller, estudiantes, onSelect, onBack
 * Efectos: ninguno; delega la navegación al contenedor.
 */
import type { Component } from 'solid-js';
import { For, Show } from 'solid-js';

import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import EmptyState from '@/components/molecules/EmptyState';

export interface DocumentStudentSummary {
  nombre: string;
  documentos: number;
  pendientes: number;
}

export interface StudentDocumentationListProps {
  /** Taller o plaza del que se listan estudiantes. */
  taller: string;
  /** Etiqueta singular del alcance; «Plaza» cuando la navegación es por plaza. */
  scopeName?: string;
  /** Etiqueta plural del alcance; «plazas» cuando la navegación es por plaza. */
  scopePlural?: string;
  estudiantes: readonly DocumentStudentSummary[];
  onSelect: (nombre: string) => void;
  /** Vuelve al listado de talleres. Se omite cuando solo hay uno asignado. */
  onBack?: () => void;
}

/** Evita que los botones internos activen también la fila. */
function fromAction(event: Event): boolean {
  const target = event.target;
  return target instanceof Element && target.closest('button, a') !== null;
}

/** Activa la navegación de una fila con clic o teclado. */
function activateRow(
  event: MouseEvent | KeyboardEvent,
  onSelect: () => void,
): void {
  if (fromAction(event)) return;
  if (event.type === 'keydown') {
    const key = (event as KeyboardEvent).key;
    if (key !== 'Enter' && key !== ' ') return;
    event.preventDefault();
  }
  onSelect();
}

export const StudentDocumentationList: Component<StudentDocumentationListProps> = (props) => {
  const scope = () => props.scopeName ?? 'Taller';
  const scopeLower = () => scope().toLowerCase();
  const scopePhrase = () => (scopeLower() === 'plaza' ? 'la plaza' : 'el taller');
  const scopeArticle = () => (scopeLower() === 'plaza' ? 'Esta' : 'Este');
  const scopePlural = () => props.scopePlural ?? 'talleres';

  return (
    <>
      <header class="workspace__head">
        <div>
          <p class="workspace__eyebrow">{scope()}</p>
          <h2 class="workspace__title-lg">{props.taller}</h2>
          <p class="workspace__meta">
            {props.estudiantes.length} estudiantes ·{' '}
            {props.estudiantes.reduce((total, item) => total + item.documentos, 0)} documentos
          </p>
        </div>
        <div class="workspace__actions workspace__actions--end">
          <Show when={props.onBack}>
            <Button variant="ghost" size="sm" onClick={() => props.onBack?.()}>
              Ver todos los {scopePlural()}
            </Button>
          </Show>
        </div>
      </header>

      <Show
        when={props.estudiantes.length > 0}
        fallback={
          <div class="table-card">
            <EmptyState
              icon="graduation"
              title={`${scopeArticle()} ${scopeLower()} aún no tiene estudiantes con documentos`}
              description="Cuando el estudiante suba su primera entrega, aparecerá en esta lista."
            />
          </div>
        }
      >
        <div class="table-card">
          <div
            class="table-scroll"
            tabindex="0"
            role="region"
            aria-label={`Estudiantes de ${props.taller}`}
          >
            <table class="data-table">
              <caption class="psa-visually-hidden">
                Estudiantes de {scopePhrase()} y estado de su documentación
              </caption>
              <thead>
                <tr>
                  <th scope="col">Estudiante</th>
                  <th scope="col" data-align="right">Documentos</th>
                  <th scope="col">Pendientes</th>
                  <th scope="col" data-align="actions">
                    <span class="psa-visually-hidden">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <For each={props.estudiantes}>
                  {(item) => (
                    <tr
                      data-clickable="true"
                      tabindex="0"
                      onClick={(event) => activateRow(event, () => props.onSelect(item.nombre))}
                      onKeyDown={(event) => activateRow(event, () => props.onSelect(item.nombre))}
                    >
                      <td>
                        <span class="cell-primary__name">{item.nombre}</span>
                      </td>
                      <td data-align="right">
                        <span class="mono">{item.documentos}</span>
                      </td>
                      <td>
                        <Show
                          when={item.pendientes > 0}
                          fallback={<Badge tone="success">Al día</Badge>}
                        >
                          <Badge tone="warning">{item.pendientes} pendientes</Badge>
                        </Show>
                      </td>
                      <td data-align="actions">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            props.onSelect(item.nombre);
                          }}
                        >
                          Ver documentos
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
    </>
  );
};

export default StudentDocumentationList;
