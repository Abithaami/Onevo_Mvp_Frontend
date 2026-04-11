import { Link } from 'react-router-dom';

export default function UrgentAlertCard({ title, detail, actionLabel, to, variant = 'action' }) {
  return (
    <div className={`db-alert-card db-alert-card--${variant}`}>
      <div className="db-alert-card-copy">
        <h3 className="db-alert-card-title">{title}</h3>
        <p className="db-alert-card-detail">{detail}</p>
      </div>
      {actionLabel && to ? (
        <Link className="db-alert-card-action" to={to}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
