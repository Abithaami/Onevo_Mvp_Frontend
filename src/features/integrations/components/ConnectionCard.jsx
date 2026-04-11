function formatSynced(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  } catch {
    return null;
  }
}

const STATUS_LABEL = {
  connected: 'Connected',
  expired: 'Needs reconnect',
  error: 'Sync issue',
  not_connected: 'Not connected'
};

export default function ConnectionCard({ integration, onConnect, onReconnect, onDisconnect }) {
  const { id, label, description, status, lastSyncedAt, detail } = integration;
  const syncedLabel = formatSynced(lastSyncedAt);

  return (
    <article className={`int-card int-card--${status}`} aria-label={`${label} integration`}>
      <div className="int-card-head">
        <div className="int-card-icon" aria-hidden="true">
          {label.slice(0, 1)}
        </div>
        <div className="int-card-titles">
          <h3 className="int-card-title">{label}</h3>
          <p className="int-card-desc">{description}</p>
        </div>
        <span className={`int-badge int-badge--${status}`}>{STATUS_LABEL[status] ?? status}</span>
      </div>

      {detail ? <p className="int-card-detail">{detail}</p> : null}
      {syncedLabel && status === 'connected' ? (
        <p className="int-card-meta">Last synced {syncedLabel}</p>
      ) : null}
      {syncedLabel && status !== 'connected' && status !== 'not_connected' ? (
        <p className="int-card-meta">Last attempt {syncedLabel}</p>
      ) : null}

      <div className="int-card-actions">
        {status === 'not_connected' ? (
          <button type="button" className="int-btn int-btn--primary" onClick={() => onConnect?.(id)}>
            Connect {label}
          </button>
        ) : null}
        {status === 'expired' || status === 'error' ? (
          <>
            <button type="button" className="int-btn int-btn--primary" onClick={() => onReconnect?.(id)}>
              Reconnect
            </button>
            <button type="button" className="int-btn int-btn--ghost" onClick={() => onDisconnect?.(id)}>
              Disconnect
            </button>
          </>
        ) : null}
        {status === 'connected' ? (
          <>
            <button type="button" className="int-btn int-btn--secondary" onClick={() => onReconnect?.(id)}>
              Refresh connection
            </button>
            <button type="button" className="int-btn int-btn--ghost" onClick={() => onDisconnect?.(id)}>
              Disconnect
            </button>
          </>
        ) : null}
      </div>
    </article>
  );
}
