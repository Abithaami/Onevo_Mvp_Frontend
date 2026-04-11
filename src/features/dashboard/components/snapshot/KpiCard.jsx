import { KPI_LABELS } from '../../contracts.js';

export default function KpiCard({ id, value, hint, trend }) {
  const label = KPI_LABELS[id] ?? id;
  const trendLabel = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';

  return (
    <div className="db-kpi-card">
      <p className="db-kpi-label">{label}</p>
      <p className="db-kpi-value">
        <span>{value}</span>
        <span className={`db-kpi-trend db-kpi-trend--${trend}`} aria-hidden="true">
          {trendLabel}
        </span>
      </p>
      {hint ? <p className="db-kpi-hint">{hint}</p> : null}
    </div>
  );
}
