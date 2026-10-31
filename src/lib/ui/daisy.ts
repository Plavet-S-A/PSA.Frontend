/**
 * Mapeo de la API de PSA a las clases de daisyUI.
 *
 * Capa: lib/ui
 * Un solo lugar traduce las props propias (variant, tone, size) a las clases
 * del sistema visual, para que las pantallas no inventen nombres ni mezclen
 * dos vocabularios.
 */
import type { StatusTone } from '@/lib/ui/status';

/** Jerarquía visual y semántica de una acción. */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'success' | 'danger';

/** Altura del control. */
export type ButtonSize = 'sm' | 'md' | 'lg';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-outline',
  ghost: 'btn-ghost',
  success: 'btn-success',
  danger: 'btn-error',
};

/**
 * Devuelve la clase de daisyUI para una jerarquía de acción.
 *
 * @param variant Jerarquía visual solicitada.
 * @returns Clase del componente; secundaria si la variante no existe.
 */
export function buttonVariantClass(variant: ButtonVariant): string {
  return BUTTON_VARIANTS[variant] ?? BUTTON_VARIANTS.secondary;
}

const BADGE_TONES: Record<StatusTone, string> = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-error',
  info: 'badge-info',
  neutral: 'badge-neutral',
};

/**
 * Devuelve la clase de daisyUI para un tono de badge.
 *
 * @param tone Tono semántico del estado.
 * @returns Clase del componente; neutral si el tono no existe.
 */
export function badgeToneClass(tone: StatusTone): string {
  return BADGE_TONES[tone] ?? BADGE_TONES.neutral;
}

/** Tonos admitidos por los avisos en línea. */
export type AlertTone = 'error' | 'info' | 'success';

const ALERT_TONES: Record<AlertTone, string> = {
  error: 'alert-error',
  info: 'alert-info',
  success: 'alert-success',
};

/**
 * Devuelve la clase de daisyUI para un tono de aviso.
 *
 * @param tone Tono semántico del aviso.
 * @returns Clase del componente; info si el tono no existe.
 */
export function alertToneClass(tone: AlertTone): string {
  return ALERT_TONES[tone] ?? ALERT_TONES.info;
}

/** Tonos admitidos por los avisos breves. */
export type ToastTone = 'success' | 'error' | 'info';
