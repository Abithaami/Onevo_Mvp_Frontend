import AttentionBanner from '../components/attention/AttentionBanner.jsx';
import UrgentAlertCard from '../components/attention/UrgentAlertCard.jsx';

export default function AttentionZone({ coach, alerts }) {
  return (
    <section className="db-zone db-zone--1" data-zone="attention" aria-labelledby="db-zone-1-title">
      <div className="db-zone-header db-zone-header--primary">
        <h2 id="db-zone-1-title" className="db-zone-title">
          What needs attention
        </h2>
        <p className="db-zone-sub">Urgent or blocked — clear these first.</p>
      </div>

      {coach ? <AttentionBanner title={coach.title} body={coach.body} /> : null}

      <div className="db-alert-stack">
        {alerts?.length ? (
          alerts.map((a) => <UrgentAlertCard key={a.id} {...a} />)
        ) : (
          <div className="db-empty db-empty--inline">
            <p>Nothing urgent right now.</p>
          </div>
        )}
      </div>
    </section>
  );
}
