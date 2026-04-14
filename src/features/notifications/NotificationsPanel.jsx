import { Link } from 'react-router-dom';
import './notifications.css';

/**
 * @param {{ sentAtUtc: string }} n
 */
function formatSentAt(sentAtUtc) {
  const s = String(sentAtUtc ?? '').trim();
  if (!s) return '—';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/** @typedef {{ id: string, channel: string, message: string, status: string, sentAtUtc: string }} NotificationRow */

/**
 * @param {{
 *   variant?: 'page' | 'dropdown',
 *   items: NotificationRow[],
 *   loading: boolean,
 *   error: string,
 *   onRetry: () => void,
 *   onMarkRead: (id: string) => void,
 *   markBusyId: string,
 *   markErrorById: Record<string, string>,
 * }} props
 */
export default function NotificationsPanel({
  variant = 'page',
  items,
  loading,
  error,
  onRetry,
  onMarkRead,
  markBusyId,
  markErrorById,
}) {
  const dropdown = variant === 'dropdown';

  return (
    <section
      className={`notifications-panel ${dropdown ? 'notifications-panel--dropdown' : ''}`}
      aria-labelledby={dropdown ? 'notifications-dropdown-title' : 'notifications-page-title'}
    >
      <div className="notifications-panel__head">
        <div>
          <h2
            className="notifications-panel__title"
            id={dropdown ? 'notifications-dropdown-title' : 'notifications-page-title'}
          >
            Notifications
          </h2>
          {!loading && !error ? (
            <p className="notifications-panel__meta">
              {items.length === 0 ? 'No notifications yet.' : `${items.length} shown (newest first).`}
            </p>
          ) : null}
        </div>
        <div className="notifications-panel__toolbar">
          {error ? (
            <button type="button" className="notifications-panel__retry" onClick={onRetry}>
              Retry
            </button>
          ) : null}
          {dropdown ? (
            <Link className="notifications-panel__view-all" to="/app/dashboard/notifications">
              View all
            </Link>
          ) : null}
        </div>
      </div>

      {loading ? <p className="notifications-panel__status">Loading notifications…</p> : null}

      {!loading && error ? (
        <p className="notifications-panel__status notifications-panel__status--error" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <p className="notifications-panel__status">You have no notifications yet.</p>
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <ul className="notifications-list">
          {items.map((n) => {
            const unread = n.status === 'unread';
            const busy = markBusyId === n.id;
            const err = markErrorById[n.id];
            return (
              <li key={n.id}>
                <article className={`notifications-item ${unread ? 'notifications-item--unread' : ''}`}>
                  <div className="notifications-item__body">
                    <div className="notifications-item__row">
                      {n.channel ? (
                        <span className="notifications-item__channel">{n.channel}</span>
                      ) : null}
                      <span
                        className={`notifications-item__status ${unread ? 'notifications-item__status--unread' : ''}`}
                      >
                        {unread ? 'Unread' : 'Read'}
                      </span>
                    </div>
                    <p className="notifications-item__message">{n.message || '—'}</p>
                    <p className="notifications-item__time">{formatSentAt(n.sentAtUtc)}</p>
                    {err ? (
                      <p className="notifications-item__mark-err" role="alert">
                        {err}
                      </p>
                    ) : null}
                  </div>
                  {unread ? (
                    <div className="notifications-item__actions">
                      <button
                        type="button"
                        className="notifications-item__read-btn"
                        disabled={busy}
                        onClick={() => onMarkRead(n.id)}
                      >
                        {busy ? 'Marking…' : 'Mark read'}
                      </button>
                    </div>
                  ) : null}
                </article>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
