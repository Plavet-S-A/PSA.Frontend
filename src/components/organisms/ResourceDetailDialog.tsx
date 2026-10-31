/**
 * ResourceDetailDialog — consulta completa de un registro.
 *
 * Capa: organism
 * Props: open, config, row, size, onClose, onEdit, preview, children,
 * footerActions
 * Efectos: ninguno; presenta los atributos declarados en el catálogo, el
 * contenido destacado, el contenido adicional de la ficha y las acciones que
 * recibe del contenedor.
 */
import type { Component, JSX } from 'solid-js';
import { createMemo, For, Show } from 'solid-js';

import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Modal from '@/components/molecules/Modal';
import { formatDateInput } from '@/lib/format/date';
import { statusTone } from '@/lib/ui/status';
import type {
  ResourceConfig,
  ResourceDetailField,
  ResourceDetailFormat,
  ResourceRow,
} from '@/types/resource';

interface DetailEntry {
  label: string;
  value: string;
  kind: ResourceDetailFormat;
}

interface DetailSection {
  title: string;
  entries: DetailEntry[];
}

export interface ResourceDetailDialogProps {
  /** Controla la visibilidad del diálogo. */
  open: boolean;
  /** Configuración del módulo. */
  config: ResourceConfig;
  /** Fila que se consulta. */
  row?: ResourceRow;
  /** Ancho del diálogo. Default: lg. */
  size?: 'md' | 'lg' | 'xl';
  /** Cierra el diálogo. */
  onClose: () => void;
  /** Abre la edición del registro; se omite en modo consulta. */
  onEdit?: (row: ResourceRow) => void;
  /** Contenido destacado antes de los atributos, por ejemplo una vista previa. */
  preview?: JSX.Element;
  /** Contenido adicional después de los atributos, por ejemplo asignaciones. */
  children?: JSX.Element;
  /** Acciones propias del módulo, antes de la edición. */
  footerActions?: JSX.Element;
}

/** Convierte una llave técnica en una etiqueta legible. */
function humanize(key: string): string {
  const text = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();
  return text.charAt(0).toLocaleUpperCase('es-MX') + text.slice(1);
}

/** Obtiene la etiqueta declarada para una llave. */
function labelFor(config: ResourceConfig, key: string): string {
  return (
    config.detailFields?.find((field) => field.key === key)?.label ??
    config.fields.find((field) => field.key === key)?.label ??
    config.columns.find((column) => column.key === key)?.label ??
    humanize(key)
  );
}

/** Determina cómo se presenta un valor de respaldo. */
function kindFor(config: ResourceConfig, key: string): ResourceDetailFormat {
  if (key === config.statusKey) return 'status';

  const field = config.fields.find((item) => item.key === key);
  if (field?.type === 'date') return 'date';
  if (field?.type === 'number') return 'number';

  const column = config.columns.find((item) => item.key === key);
  if (column?.format === 'status') return 'status';
  if (column?.format === 'number' || column?.format === 'mono') return 'mono';
  return 'text';
}

/** Oculta llaves internas de la base de datos en la interfaz. */
function isInternalKey(key: string): boolean {
  return key === 'id' || key.startsWith('id_');
}

/** Convierte la declaración del catálogo en una entrada de detalle. */
function entryFromField(
  field: ResourceDetailField,
  row: ResourceRow,
): DetailEntry {
  return {
    label: field.label,
    value: String(row[field.key] ?? ''),
    kind: field.format ?? 'text',
  };
}

/**
 * Construye las entradas visibles sin duplicar el encabezado del diálogo.
 *
 * Si el catálogo declara `detailFields`, respeta ese orden y esas etiquetas.
 * En caso contrario usa las llaves de la fila como respaldo.
 */
function detailSections(config: ResourceConfig, row: ResourceRow): DetailSection[] {
  const declared = config.detailFields;
  if (declared && declared.length > 0) {
    const sections = new Map<string, DetailEntry[]>();
    for (const field of declared) {
      if (isInternalKey(field.key) || field.key === config.primaryKey) continue;
      if (field.key === config.statusKey) continue;
      const value = String(row[field.key] ?? '');
      if (field.hideWhenEmpty && value.trim() === '') continue;
      const title = field.section ?? 'Información';
      const entries = sections.get(title) ?? [];
      entries.push(entryFromField(field, row));
      sections.set(title, entries);
    }
    return [...sections].map(([title, entries]) => ({ title, entries }));
  }

  const keys = Object.keys(row).filter(
    (key) =>
      !isInternalKey(key) &&
      key !== config.primaryKey &&
      key !== config.statusKey,
  );

  for (const field of config.fields) {
    if (
      !keys.includes(field.key) &&
      field.key !== config.primaryKey &&
      field.key !== config.statusKey
    ) {
      keys.push(field.key);
    }
  }

  return [
    {
      title: 'Información',
      entries: keys.map((key) => ({
        label: labelFor(config, key),
        value: String(row[key] ?? ''),
        kind: kindFor(config, key),
      })),
    },
  ];
}

/** Renderiza un valor según su tipo. */
function detailValue(entry: DetailEntry): JSX.Element {
  if (entry.value.trim() === '') {
    return <span class="resource-detail__missing">Sin registrar</span>;
  }
  if (entry.kind === 'status') {
    return <Badge tone={statusTone(entry.value)}>{entry.value}</Badge>;
  }
  if (entry.kind === 'date') {
    return <span>{formatDateInput(entry.value)}</span>;
  }
  if (entry.kind === 'number' || entry.kind === 'mono') {
    return <span class={entry.kind === 'mono' ? 'mono' : undefined}>{entry.value}</span>;
  }
  return <span>{entry.value}</span>;
}

export const ResourceDetailDialog: Component<ResourceDetailDialogProps> = (props) => {
  const title = () => `Detalle de ${props.config.singular}`;
  const primary = () =>
    String(props.row?.[props.config.primaryKey] ?? 'Sin información');
  const status = () => String(props.row?.[props.config.statusKey] ?? '');
  const sections = createMemo(() =>
    props.row ? detailSections(props.config, props.row) : [],
  );

  const edit = () => {
    const row = props.row;
    if (row) props.onEdit?.(row);
  };

  return (
    <Modal
      open={props.open}
      title={title()}
      description="Consulta la información completa del registro."
      size={props.size ?? 'lg'}
      onClose={props.onClose}
      footer={
        <>
          <Button variant="secondary" onClick={props.onClose}>Cerrar</Button>
          {props.footerActions}
          <Show when={props.onEdit}>
            <Button variant="primary" onClick={edit}>
              <Icon name="edit" size={16} />
              Editar información
            </Button>
          </Show>
        </>
      }
    >
      {props.row ? (
        <div class="resource-detail">
          <header class="resource-detail__summary">
            <div>
              <p class="resource-detail__eyebrow">{props.config.singular}</p>
              <h3 class="resource-detail__title">{primary()}</h3>
            </div>
            <Show when={status()}>
              <Badge tone={statusTone(status())}>{status()}</Badge>
            </Show>
          </header>

          <Show when={props.preview}>
            <div class="resource-detail__preview">{props.preview}</div>
          </Show>

          <For each={sections()}>
            {(section) => (
              <section class="resource-detail__section">
                <h4 class="resource-detail__section-title">{section.title}</h4>
                <dl
                  class="resource-detail__grid"
                  aria-label={`${section.title} de ${primary()}`}
                >
                  <For each={section.entries}>
                    {(entry) => (
                      <div class="resource-detail__item">
                        <dt class="resource-detail__label">{entry.label}</dt>
                        <dd class="resource-detail__value">{detailValue(entry)}</dd>
                      </div>
                    )}
                  </For>
                </dl>
              </section>
            )}
          </For>
          {props.children}
        </div>
      ) : null}
    </Modal>
  );
};

export default ResourceDetailDialog;
