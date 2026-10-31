/**
 * Mapeo de estados de dominio a tonos visuales.
 *
 * Capa: lib/ui
 * Un solo lugar decide el color semántico de un badge; las pantallas no
 * inventan colores por módulo.
 */

/** Tonos permitidos para badges y avisos. */
export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const STATUS_TONES: Record<string, StatusTone> = {
  activo: 'success',
  activa: 'success',
  abierto: 'success',
  abierta: 'success',
  'en práctica': 'success',
  aceptada: 'success',
  aprobado: 'success',
  aprobada: 'success',
  validado: 'success',
  'en tiempo': 'success',
  'en búsqueda': 'info',
  'en proceso': 'info',
  'en curso': 'info',
  recibido: 'info',
  entrevista: 'info',
  prospecto: 'info',
  'invitación pendiente': 'warning',
  'en revisión': 'warning',
  'en planeación': 'warning',
  pendiente: 'warning',
  'por vencer': 'warning',
  suspendido: 'danger',
  rechazada: 'danger',
  rechazado: 'danger',
  reprobada: 'danger',
  'en riesgo': 'danger',
  inactivo: 'neutral',
  inactiva: 'neutral',
  cerrado: 'neutral',
  cerrada: 'neutral',
  cubierta: 'neutral',
  egresado: 'neutral',
  finalizada: 'neutral',
  concluido: 'neutral',
  cancelada: 'neutral',
};

/**
 * Devuelve el tono visual de un estado de dominio.
 *
 * @param status Texto del estado tal como se muestra en la tabla.
 * @returns Tono semántico; neutral si el estado no está mapeado.
 */
export function statusTone(status: string): StatusTone {
  const key = status.trim().toLocaleLowerCase('es-MX');
  return STATUS_TONES[key] ?? 'neutral';
}
