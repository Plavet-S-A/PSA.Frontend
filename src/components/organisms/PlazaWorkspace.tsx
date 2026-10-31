/**
 * PlazaWorkspace — plazas de práctica agrupadas por taller.
 *
 * Capa: organism
 * Props: initialRows, initialAssignments, canManage, talleres, roleLabel,
 * guidance
 * Efectos: hidrata plazas y asignaciones; delega el detalle del taller.
 */
import type { Component } from 'solid-js';
import { createMemo, createSignal, onMount, Show } from 'solid-js';

import Alert from '@/components/molecules/Alert';
import EmptyState from '@/components/molecules/EmptyState';
import TallerMasterList from '@/components/molecules/TallerMasterList';
import WorkspaceMasterToggle from '@/components/molecules/WorkspaceMasterToggle';
import PlazaDetail from '@/components/organisms/PlazaDetail';
import {
  assignStudentsToPlaza,
  loadPlazaAssignments,
  savePlazaAssignments,
  type PlazaAssignment,
} from '@/lib/catalog/plaza-assignments';
import {
  plazasConfig,
  withPlazaTaller,
} from '@/lib/catalog/plazas';
import { pluralize } from '@/lib/format/text';
import {
  loadResourceRows,
  saveResourceRows,
} from '@/lib/storage/resource-store';
import {
  loadMasterHidden,
  saveMasterHidden,
} from '@/lib/storage/workspace-preferences';
import type { ResourceRow } from '@/types/resource';

interface TallerSummary {
  nombre: string;
  plazas: number;
  cupos: number;
  abiertas: number;
}

export interface PlazaWorkspaceProps {
  /** Filas de ejemplo renderizadas en el servidor. */
  initialRows: readonly ResourceRow[];
  /** Asignaciones de ejemplo renderizadas en el servidor. */
  initialAssignments: readonly PlazaAssignment[];
  /** Permite crear, editar y eliminar plazas y asignar estudiantes. */
  canManage: boolean;
  /** Permite enviar una solicitud de plaza para revisión. */
  canRequest: boolean;
  /** Nombre de quien solicita una plaza nueva. */
  requesterName: string;
  /** true cuando las filas recibidas son solo una parte del catálogo. */
  partialSave: boolean;
  /** Talleres que puede consultar el rol. */
  talleres: readonly string[];
  /** Nombre del rol para el aviso de contexto. */
  roleLabel: string;
  /** Explica el flujo que corresponde al rol. */
  guidance: string;
}

export const PlazaWorkspace: Component<PlazaWorkspaceProps> = (props) => {
  const [rows, setRows] = createSignal<ResourceRow[]>([...props.initialRows]);
  const [assignments, setAssignments] = createSignal<PlazaAssignment[]>([
    ...props.initialAssignments.map((assignment) => ({
      ...assignment,
      studentIds: [...assignment.studentIds],
    })),
  ]);
  const [taller, setTaller] = createSignal<string | null>(
    props.talleres.length === 1 ? props.talleres[0] : null,
  );
  const [masterHidden, setMasterHidden] = createSignal(false);
  const [ready, setReady] = createSignal(false);

  onMount(() => {
    const fallbackTaller = props.talleres[0] ?? '';
    const saved = loadResourceRows(plazasConfig.id, props.initialRows);
    setRows(withPlazaTaller(saved, fallbackTaller));
    setAssignments(loadPlazaAssignments());
    if (props.talleres.length === 1) setTaller(fallbackTaller);
    setMasterHidden(loadMasterHidden('plazas'));
    requestAnimationFrame(() => setReady(true));
  });

  /** El rol con un solo taller entra directo a su detalle, sin lista previa. */
  const hasMultipleTalleres = createMemo(() => props.talleres.length > 1);

  const resumenTalleres = createMemo<TallerSummary[]>(() =>
    props.talleres.map((nombre) => {
      const items = rows().filter((row) => String(row.taller) === nombre);
      return {
        nombre,
        plazas: items.length,
        cupos: items.reduce((total, row) => total + Number(row.cantidad ?? 0), 0),
        abiertas: items.filter((row) => String(row.estado) === 'Abierta').length,
      };
    }),
  );

  const masterItems = createMemo(() =>
    resumenTalleres().map((item) => ({
      nombre: item.nombre,
      meta: `${pluralize(item.plazas, 'plaza', 'plazas')} · ${pluralize(item.cupos, 'cupo', 'cupos')}`,
      flag:
        item.abiertas > 0
          ? pluralize(item.abiertas, 'abierta', 'abiertas')
          : undefined,
    })),
  );

  const persistRows = (nextRows: ResourceRow[]): boolean => {
    if (!saveResourceRows(plazasConfig.id, nextRows, { partial: props.partialSave })) {
      return false;
    }
    setRows(nextRows);
    return true;
  };

  const assignStudents = (
    plazaId: string,
    studentIds: readonly string[],
  ): boolean => {
    const next = assignStudentsToPlaza(assignments(), plazaId, studentIds);
    if (!savePlazaAssignments(next)) return false;
    setAssignments(next);
    return true;
  };

  const setMasterVisibility = (hidden: boolean) => {
    setMasterHidden(hidden);
    saveMasterHidden('plazas', hidden);
  };

  return (
    <section aria-label="Plazas por taller">
      <Alert class="workspace-hint" tone="info" title={`Vista de ${props.roleLabel}`}>
        {props.guidance}
      </Alert>

      <Show when={hasMultipleTalleres()}>
        <div class="workspace__toolbar">
          <WorkspaceMasterToggle
            expanded={!masterHidden()}
            controls="plazas-master"
            count={masterItems().length}
            onToggle={() => setMasterVisibility(!masterHidden())}
          />
        </div>
      </Show>

      <div
        class="workspace"
        classList={{
          'workspace--master-hidden': masterHidden(),
          'workspace--single': !hasMultipleTalleres(),
          'workspace--instant': !ready(),
        }}
      >
        <Show when={hasMultipleTalleres()}>
          <div class="workspace__master-slot">
            <TallerMasterList
              id="plazas-master"
              hidden={masterHidden()}
              items={masterItems()}
              selected={taller()}
              onSelect={setTaller}
            />
          </div>
        </Show>

        <div class="workspace__detail">
          <Show
            when={taller()}
            fallback={
              <div class="table-card">
                <EmptyState
                  icon="layers"
                  title="Elige un taller para filtrar las plazas"
                  description="Cada plaza se agrupa por el taller al que se vincula. Selecciona un taller en la lista; si ocultaste el panel, usa el botón «Talleres» para mostrarlo de nuevo."
                />
              </div>
            }
          >
            {(selectedTaller) => (
              <PlazaDetail
                taller={selectedTaller()}
                rows={rows()}
                assignments={assignments()}
                canManage={props.canManage}
                canRequest={props.canRequest}
                requesterName={props.requesterName}
                onPersistRows={persistRows}
                onAssignStudents={assignStudents}
                onBack={hasMultipleTalleres() ? () => setTaller(null) : undefined}
              />
            )}
          </Show>
        </div>
      </div>
    </section>
  );
};

export default PlazaWorkspace;
