import { DASHBOARD_KPI_ORDER } from '../contracts.js';
import KpiCard from '../components/snapshot/KpiCard.jsx';

export default function BusinessSnapshotZone({ kpis }) {
  const byId = Object.fromEntries((kpis ?? []).map((k) => [k.id, k]));

  return (
    <section className="db-zone db-zone--3" data-zone="snapshot" aria-labelledby="db-zone-3-title">
      <div className="db-zone-header db-zone-header--compact">
        <h2 id="db-zone-3-title" className="db-zone-title">
          Business snapshot
        </h2>
        <p className="db-zone-sub">Four signals — context for your next decision.</p>
      </div>
      <div className="db-kpi-grid">
        {DASHBOARD_KPI_ORDER.map((id) => {
          const k = byId[id];
          if (!k) {
            return (
              <div key={id} className="db-kpi-card db-kpi-card--placeholder">
                <p className="db-kpi-label">—</p>
                <p className="db-kpi-value">—</p>
              </div>
            );
          }
          return <KpiCard key={id} id={k.id} value={k.value} hint={k.hint} trend={k.trend} />;
        })}
      </div>
    </section>
  );
}
