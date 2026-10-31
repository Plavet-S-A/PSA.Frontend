/**
 * EvaluationWorkspace — evaluaciones agrupadas por taller o plaza y estudiante.
 *
 * Capa: organism
 * Props: initialRows, canGrade, talleres, roleLabel, guidance, partialSave,
 * assignmentScope, assignedStudentNames, groupByPlaza
 * Efectos: hidrata y persiste calificaciones; delega el detalle al panel.
 */
import type { Component } from 'solid-js';
import { createMemo, createSignal, onMount, Show } from 'solid-js';

import Alert from '@/components/molecules/Alert';
import EmptyState from '@/components/molecules/EmptyState';
import TallerMasterList from '@/components/molecules/TallerMasterList';
import WorkspaceMasterToggle from '@/components/molecules/WorkspaceMasterToggle';
import EvaluationGradingPanel from '@/components/organisms/EvaluationGradingPanel';
import { evaluacionConfig } from '@/lib/catalog/evaluacion';
import {
  assignedPlazaIdByStudentName,
  assignedStudentNamesForTalleres,
  defaultPlazaAssignments,
  loadPlazaAssignments,
  plazasRows,
  plazasWithAssignmentsForTalleres,
  type PlazaAssignment,
} from '@/lib/catalog/plaza-assignments';
import { normalizeResourceRows } from '@/lib/resource/row-values';
import {
  loadResourceRows,
  saveResourceRows,
} from '@/lib/storage/resource-store';
import {
  loadMasterHidden,
  saveMasterHidden,
} from '@/lib/storage/workspace-preferences';
import type { ResourceRow } from '@/types/resource';

interface GroupSummary {
  nombre: string;
  key: string;
  estudiantes: number;
  evaluadas: number;
  promedio: number;
}

export interface EvaluationWorkspaceProps {
  /** Filas de ejemplo renderizadas en el servidor. */
  initialRows: readonly ResourceRow[];
  /** Permite capturar y actualizar calificaciones. */
  canGrade: boolean;
  /** Talleres que puede consultar el rol. */
  talleres: readonly string[];
  /** Nombre del rol para el aviso de contexto. */
  roleLabel: string;
  /** Explica el flujo que corresponde al rol. */
  guidance: string;
  /**
   * Indica que `initialRows` es un subconjunto del módulo. Al guardar se
   * combina con las filas completas para no borrar otros talleres.
   */
  partialSave?: boolean;
  /** Limita la vista a estudiantes asignados a plazas de los talleres. */
  assignmentScope?: boolean;
  /** Nombres asignados calculados en el servidor para el alcance inicial. */
  assignedStudentNames?: readonly string[];
  /** Agrupa por plaza en lugar de por taller (tutor empresarial). */
  groupByPlaza?: boolean;
}

export const EvaluationWorkspace: Component<EvaluationWorkspaceProps> = (props) => {
  /** true cuando el rol agrupa por plaza en lugar de por taller. */
  const usesPlazas = () => props.groupByPlaza === true && props.assignmentScope === true;

  /**
   * Calcula el grupo inicial para que el servidor ya renderice el detalle.
   *
   * @returns Clave del taller o de la plaza, o null si hay varias opciones.
   */
  function initialGroupKey(): string | null {
    if (props.assignmentScope && usesPlazas()) {
      const plazas = plazasWithAssignmentsForTalleres(
        defaultPlazaAssignments(),
        props.talleres,
      );
      return plazas.length === 1 ? plazas[0].id : null;
    }
    return props.talleres.length === 1 ? props.talleres[0] : null;
  }

  const [rows, setRows] = createSignal<ResourceRow[]>([...props.initialRows]);
  const [assignmentNames, setAssignmentNames] = createSignal<string[]>([
    ...(props.assignedStudentNames ?? []),
  ]);
  const [assignments, setAssignments] = createSignal<PlazaAssignment[]>(
    defaultPlazaAssignments(),
  );
  const [groupKey, setGroupKey] = createSignal<string | null>(initialGroupKey());
  const [masterHidden, setMasterHidden] = createSignal(false);
  const [ready, setReady] = createSignal(false);

  /** Etiqueta del panel maestro según el alcance activo. */
  const masterLabel = () => (usesPlazas() ? 'Plazas' : 'Talleres');

  /** Etiqueta singular del alcance; se usa en los encabezados de detalle. */
  const scopeName = () => (usesPlazas() ? 'Plaza' : 'Taller');

  /** Etiqueta plural del alcance; se usa en las acciones de navegación. */
  const scopePlural = () => (usesPlazas() ? 'plazas' : 'talleres');

  onMount(() => {
    const saved = loadResourceRows(evaluacionConfig.id, props.initialRows);
    setRows(normalizeResourceRows(evaluacionConfig, saved));

    if (props.assignmentScope) {
      const loaded = loadPlazaAssignments();
      setAssignments(loaded);
      setAssignmentNames(assignedStudentNamesForTalleres(loaded, props.talleres));
      if (usesPlazas()) {
        const plazas = plazasWithAssignmentsForTalleres(loaded, props.talleres);
        if (plazas.length === 1) setGroupKey(plazas[0].id);
      } else if (props.talleres.length === 1) {
        setGroupKey(props.talleres[0]);
      }
    } else if (props.talleres.length === 1) {
      setGroupKey(props.talleres[0]);
    }

    setMasterHidden(loadMasterHidden('evaluacion'));
    requestAnimationFrame(() => setReady(true));
  });

  /** Aplica el alcance por plaza sin alterar las filas persistidas. */
  const visibleRows = createMemo(() => {
    if (!props.assignmentScope) return rows();
    const assigned = new Set(assignmentNames());
    return rows().filter((row) => assigned.has(String(row.estudiante)));
  });

  /** Relaciona a cada estudiante visible con la plaza que lo recibe. */
  const plazaByStudent = createMemo(
    () =>
      usesPlazas()
        ? assignedPlazaIdByStudentName(assignments(), props.talleres)
        : new Map<string, string>(),
  );

  /** Obtiene la clave de agrupación (taller o plaza) para una fila. */
  const getGroupKey = (row: ResourceRow): string => {
    if (usesPlazas()) {
      return plazaByStudent().get(String(row.estudiante)) ?? String(row.taller);
    }
    return String(row.taller);
  };

  /** Obtiene el nombre legible de una clave de grupo. */
  const getGroupName = (key: string): string => {
    if (usesPlazas()) {
      const plaza = plazasRows.find((row) => row.id === key);
      return String(plaza?.plaza ?? key);
    }
    return key;
  };

  /** Obtiene el taller al que pertenece un grupo; se usa para guardar filas. */
  const getGroupTaller = (key: string): string => {
    if (usesPlazas()) {
      const plaza = plazasRows.find((row) => row.id === key);
      return String(plaza?.taller ?? '');
    }
    return key;
  };

  /** El panel maestro solo aparece cuando hay más de un grupo visible. */
  const hasMultipleGroups = createMemo(() => {
    const groups = new Set(visibleRows().map(getGroupKey));
    return groups.size > 1;
  });

  const resumenGrupos = createMemo<GroupSummary[]>(() => {
    const groups = [...new Set(visibleRows().map(getGroupKey))];
    return groups.map((key) => {
      const items = visibleRows().filter((row) => getGroupKey(row) === key);
      const evaluadas = items.filter((row) => String(row.estado) !== 'Pendiente');
      const suma = evaluadas.reduce((total, row) => total + Number(row.promedio ?? 0), 0);
      return {
        nombre: getGroupName(key),
        key,
        estudiantes: items.length,
        evaluadas: evaluadas.length,
        promedio: evaluadas.length > 0 ? Math.round(suma / evaluadas.length) : 0,
      };
    });
  });

  const masterItems = createMemo(() =>
    resumenGrupos().map((item) => ({
      nombre: item.nombre,
      meta: `${item.evaluadas}/${item.estudiantes} evaluadas${
        item.estudiantes > 0 ? ` · promedio ${item.promedio}` : ''
      }`,
      flag:
        item.estudiantes > item.evaluadas
          ? `${item.estudiantes - item.evaluadas} por calificar`
          : undefined,
    })),
  );

  const persistRows = (nextRows: ResourceRow[]): boolean => {
    if (
      !saveResourceRows(evaluacionConfig.id, nextRows, {
        partial: props.partialSave === true,
      })
    ) {
      return false;
    }
    setRows(nextRows);
    return true;
  };

  const selectGroup = (nombre: string) => {
    const key = resumenGrupos().find((g) => g.nombre === nombre)?.key ?? nombre;
    setGroupKey(key);
  };

  const setMasterVisibility = (hidden: boolean) => {
    setMasterHidden(hidden);
    saveMasterHidden('evaluacion', hidden);
  };

  return (
    <section
      aria-label={usesPlazas() ? 'Evaluación por plaza' : 'Evaluación por taller'}
    >
      <Alert class="workspace-hint" tone="info" title={`Vista de ${props.roleLabel}`}>
        {props.guidance}
      </Alert>

      <Show when={hasMultipleGroups()}>
        <div class="workspace__toolbar">
          <WorkspaceMasterToggle
            expanded={!masterHidden()}
            controls="evaluacion-master"
            count={masterItems().length}
            label={masterLabel()}
            onToggle={() => setMasterVisibility(!masterHidden())}
          />
        </div>
      </Show>

      <div
        class="workspace"
        classList={{
          'workspace--master-hidden': masterHidden(),
          'workspace--single': !hasMultipleGroups(),
          'workspace--instant': !ready(),
        }}
      >
        <Show when={hasMultipleGroups()}>
          <div class="workspace__master-slot">
            <TallerMasterList
              id="evaluacion-master"
              hidden={masterHidden()}
              items={masterItems()}
              selected={groupKey() ? getGroupName(groupKey()!) : null}
              label={masterLabel()}
              onSelect={selectGroup}
            />
          </div>
        </Show>

        <div class="workspace__detail">
          <Show
            when={groupKey()}
            fallback={
              <div class="table-card">
                <EmptyState
                  icon="chart"
                  title={
                    usesPlazas()
                      ? 'Elige una plaza para empezar'
                      : 'Elige un taller para empezar'
                  }
                  description={
                    usesPlazas()
                      ? 'Las calificaciones se organizan por plaza y después por estudiante. Selecciona una plaza en la lista; si ocultaste el panel, usa el botón «Plazas» para mostrarlo de nuevo.'
                      : 'Las calificaciones se organizan por taller y después por estudiante. Selecciona un taller en la lista; si ocultaste el panel, usa el botón «Talleres» para mostrarlo de nuevo.'
                  }
                />
              </div>
            }
          >
            {(selectedGroup) => (
              <EvaluationGradingPanel
                taller={getGroupTaller(selectedGroup())}
                scopeLabel={getGroupName(selectedGroup())}
                scopeName={scopeName()}
                scopePlural={scopePlural()}
                rows={visibleRows()}
                scopeRows={visibleRows().filter(
                  (row) => getGroupKey(row) === selectedGroup(),
                )}
                canGrade={props.canGrade}
                onPersistRows={persistRows}
                onBack={hasMultipleGroups() ? () => setGroupKey(null) : undefined}
              />
            )}
          </Show>
        </div>
      </div>
    </section>
  );
};

export default EvaluationWorkspace;
