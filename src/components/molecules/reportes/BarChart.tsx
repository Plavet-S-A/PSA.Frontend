/**
 * BarChart — gráfico de barras sencillo para reportes.
 *
 * Capa: molecule
 * Props: title, rows, max
 * Efectos: ninguno.
 */
import type { Component } from 'solid-js';

interface GroupRow {
  key: string;
  count: number;
}

export interface BarChartProps {
  title: string;
  rows: GroupRow[];
  max: number;
}

export const BarChart: Component<BarChartProps> = (props) => (
  <div class="reportes__chart">
    <h3 class="reportes__chart-title">{props.title}</h3>
    <ul class="reportes__chart-list">
      {props.rows.map((row) => {
        const pct = props.max > 0 ? (row.count / props.max) * 100 : 0;
        return (
          <li class="reportes__chart-item">
            <span class="reportes__chart-key">{row.key}</span>
            <span class="reportes__chart-bar-wrap">
              <span
                class="reportes__chart-bar"
                style={{ width: `${pct}%` }}
              ></span>
            </span>
            <span class="reportes__chart-val">{row.count}</span>
          </li>
        );
      })}
    </ul>
  </div>
);

export default BarChart;
