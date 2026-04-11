function formatRelative(iso) {
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 48) return `${hrs}h ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export default function ActivityItem({ title, detail, at, type }) {
  return (
    <li className="db-activity-item">
      <div className="db-activity-dot" aria-hidden="true" />
      <div className="db-activity-body">
        <p className="db-activity-title">{title}</p>
        <p className="db-activity-detail">{detail}</p>
        <p className="db-activity-meta">
          <time dateTime={at}>{formatRelative(at)}</time>
          <span className="db-activity-type">{type.replace(/_/g, ' ')}</span>
        </p>
      </div>
    </li>
  );
}
