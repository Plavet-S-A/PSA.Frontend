/**
 * MetricCard — tarjeta de métrica individual para reportes.
 *
 * Capa: molecule
 * Props: value, label, tone
 * Efectos: ninguno.
 */
import type { Component } from 'solid-js';

export interface MetricCardProps {
  value: string | number;
  label: string;
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

export const MetricCard: Component<MetricCardProps> = (props) => (
  <div class="reportes__card">
    <div class="reportes__card-value">{props.value}</div>
    <div class="reportes__card-label">{props.label}</div>
  </div>
);

export default MetricCard;
