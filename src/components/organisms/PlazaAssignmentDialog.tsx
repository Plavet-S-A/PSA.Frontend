/**
 * PlazaAssignmentDialog — selecciona los estudiantes de una plaza.
 *
 * Capa: organism
 * Props: open, plaza, students, assignedIds, onClose, onSave
 * Efectos: reinicia la selección al abrir y valida el cupo de la plaza.
 */
import type { Component } from 'solid-js';
import { createEffect, createMemo, createSignal, createUniqueId, For, Show } from 'solid-js';

import Button from '@/components/atoms/Button';
import Modal from '@/components/molecules/Modal';
import type { ResourceRow } from '@/types/resource';

export interface PlazaAssignmentDialogProps {
  /** Controla la visibilidad del diálogo. */
  open: boolean;
  /** Plaza que recibe la asignación. */
  plaza?: ResourceRow;
  /** Estudiantes del taller que pueden asignarse. */
  students: readonly ResourceRow[];
  /** Identificadores ya asignados a la plaza. */
  assignedIds: readonly string[];
  /** Cierra el diálogo sin guardar. */
  onClose: () => void;
  /** Guarda la selección completa de la plaza. */
  onSave: (studentIds: string[]) => void;
}

/** Nombre visible del estudiante. */
function fullName(row: ResourceRow): string {
  return String(row.nombreCompleto ?? row.nombre ?? '');
}

export const PlazaAssignmentDialog: Component<PlazaAssignmentDialogProps> = (props) => {
  const searchId = createUniqueId();
  const [selected, setSelected] = createSignal<string[]>([]);
  const [query, setQuery] = createSignal('');
  let wasOpen = false;

  createEffect(() => {
    if (props.open && !wasOpen) {
      setSelected([...props.assignedIds]);
      setQuery('');
    }
    wasOpen = props.open;
  });

  const capacity = createMemo(() => Number(props.plaza?.cantidad ?? 0));
  const atCapacity = createMemo(() => selected().length >= capacity());

  const students = createMemo(() => {
    const term = query().trim().toLocaleLowerCase('es-MX');
    return props.students
      .filter((row) => {
        if (term === '') return true;
        return [fullName(row), String(row.estado ?? '')]
          .join(' ')
          .toLocaleLowerCase('es-MX')
          .includes(term);
      })
      .sort((left, right) => fullName(left).localeCompare(fullName(right), 'es-MX'));
  });

  const isSelected = (studentId: string) => selected().includes(studentId);

  const toggle = (studentId: string) => {
    setSelected((current) => {
      if (current.includes(studentId)) {
        return current.filter((id) => id !== studentId);
      }
      if (current.length >= capacity()) return current;
      return [...current, studentId];
    });
  };

  const save = () => {
    if (selected().length > capacity()) return;
    props.onSave([...selected()]);
  };

  return (
    <Modal
      open={props.open}
      title="Asignar estudiantes"
      description={
        props.plaza
          ? `${String(props.plaza.plaza ?? '')} · ${capacity()} cupos`
          : 'Selecciona los estudiantes de la plaza.'
      }
      size="md"
      onClose={props.onClose}
      footer={
        <>
          <Button variant="secondary" onClick={props.onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={save}
            disabled={selected().length > capacity()}
          >
            Guardar asignación
          </Button>
        </>
      }
    >
      <div class="assignment-dialog">
        <div class="assignment-dialog__summary">
          <div>
            <p class="assignment-dialog__eyebrow">Selección actual</p>
            <p class="assignment-dialog__count">
              {selected().length} de {capacity()} cupos
            </p>
          </div>
          <p class="assignment-dialog__hint">
            Un estudiante se mueve a esta plaza si ya estaba asignado a otra.
          </p>
        </div>

        <div class="field">
          <label class="field__label" for={searchId}>
            Buscar estudiante
          </label>
          <input
            id={searchId}
            class="input"
            type="search"
            value={query()}
            placeholder="Nombre o estado"
            autocomplete="off"
            onInput={(event) => setQuery(event.currentTarget.value)}
          />
        </div>

        <Show
          when={students().length > 0}
          fallback={
            <p class="assignment-dialog__empty">
              No hay estudiantes del taller que coincidan con la búsqueda.
            </p>
          }
        >
          <div
            class="assignment-list"
            role="group"
            aria-label="Estudiantes del taller"
          >
            <For each={students()}>
              {(student) => {
                const checked = () => isSelected(student.id);
                const disabled = () => !checked() && atCapacity();
                return (
                  <label
                    class="assignment-option"
                    classList={{ 'assignment-option--selected': checked() }}
                  >
                    <input
                      class="assignment-option__control"
                      type="checkbox"
                      checked={checked()}
                      disabled={disabled()}
                      onChange={() => toggle(student.id)}
                    />
                    <span class="assignment-option__text">
                      <span class="assignment-option__name">{fullName(student)}</span>
                      <span class="assignment-option__meta">
                        {String(student.taller ?? '')} · {String(student.estado ?? '')}
                      </span>
                    </span>
                  </label>
                );
              }}
            </For>
          </div>
        </Show>

        <Show when={selected().length > capacity()}>
          <p class="assignment-dialog__warning" role="alert">
            La selección supera los cupos disponibles. Quita estudiantes antes de guardar.
          </p>
        </Show>
      </div>
    </Modal>
  );
};

export default PlazaAssignmentDialog;
