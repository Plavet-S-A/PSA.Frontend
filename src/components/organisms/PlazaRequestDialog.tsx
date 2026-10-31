/**
 * PlazaRequestDialog — solicitud de plaza de tutoría empresarial.
 *
 * Capa: organism
 * Props: open, taller, center, onClose, onSubmit
 * Efectos: precarga el centro de trabajo de la plaza vigente y envía la
 * solicitud con las características capturadas; el estado lo fija el contenedor.
 */
import type { Component } from 'solid-js';
import { createMemo } from 'solid-js';

import ResourceFormDialog from '@/components/organisms/ResourceFormDialog';
import { plazasConfig } from '@/lib/catalog/plazas';
import type { ResourceConfig } from '@/types/resource';

/**
 * Base del formulario: las mismas características de la plaza, sin el taller
 * (lo resuelve la vista) ni el estado (siempre entra como «En revisión»).
 */
const requestBase: ResourceConfig = {
  ...plazasConfig,
  singular: 'solicitud de plaza',
  plural: 'Solicitudes de plaza',
  createLabel: 'Solicitar plaza',
  fields: plazasConfig.fields.filter(
    (field) => field.key !== 'taller' && field.key !== 'estado',
  ),
};

export interface PlazaRequestDialogProps {
  /** Controla la visibilidad del diálogo. */
  open: boolean;
  /** Taller al que pertenece la solicitud. */
  taller: string;
  /** Centro de trabajo de la plaza vigente, para precargar el formulario. */
  center: string;
  /** Cierra el diálogo sin enviar. */
  onClose: () => void;
  /** Entrega las características capturadas. */
  onSubmit: (values: Record<string, string>) => void;
}

export const PlazaRequestDialog: Component<PlazaRequestDialogProps> = (props) => {
  const config = createMemo<ResourceConfig>(() => ({
    ...requestBase,
    fields: requestBase.fields.map((field) =>
      field.key === 'centroTrabajo'
        ? { ...field, defaultValue: props.center || field.defaultValue }
        : field,
    ),
  }));

  return (
    <ResourceFormDialog
      open={props.open}
      config={config()}
      idPrefix="plaza-request"
      onClose={props.onClose}
      onSave={props.onSubmit}
      submitLabel="Enviar solicitud"
      description={`Completa las características de la plaza que necesitas para ${props.taller}. Se enviará a vinculación con estado En revisión.`}
    />
  );
};

export default PlazaRequestDialog;
