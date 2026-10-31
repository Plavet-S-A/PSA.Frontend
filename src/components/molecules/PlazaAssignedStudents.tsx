/**
 * PlazaAssignedStudents — estudiantes asignados en la ficha de una plaza.
 *
 * Capa: molecule
 * Props: students
 * Efectos: ninguno; solo presenta la relación ya resuelta por el contenedor.
 */
import type { Component } from 'solid-js';
import { For, Show } from 'solid-js';

import type { ResourceRow } from '@/types/resource';

export interface PlazaAssignedStudentsProps {
  /** Estudiantes vinculados a la plaza consultada. */
  students: readonly ResourceRow[];
}

export const PlazaAssignedStudents: Component<PlazaAssignedStudentsProps> = (props) => (
  <section class="resource-detail__section">
    <h4 class="resource-detail__section-title">Estudiantes asignados</h4>
    <Show
      when={props.students.length > 0}
      fallback={
        <p class="resource-detail__missing">
          Esta plaza todavía no tiene estudiantes asignados.
        </p>
      }
    >
      <ul class="assignment-assigned">
        <For each={props.students}>
          {(student) => (
            <li class="assignment-assigned__item">
              <span class="assignment-assigned__name">
                {String(student.nombreCompleto ?? student.nombre ?? '')}
              </span>
              <span class="assignment-assigned__meta">
                {String(student.taller ?? '')} · {String(student.estado ?? '')}
              </span>
            </li>
          )}
        </For>
      </ul>
    </Show>
  </section>
);

export default PlazaAssignedStudents;
