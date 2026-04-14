import { useEffect, useRef, useState } from 'react';
import NotificationsPanel from './NotificationsPanel.jsx';
import { useNotifications } from './useNotifications.js';
import './notifications.css';

/**
 * Topbar bell: loads notifications for real unread badge + dropdown list.
 */
export default function NotificationsBell() {
  const { items, loading, error, load, markRead, markBusyId, markErrorById } = useNotifications({
    autoLoad: true,
  });
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(/** @type {HTMLDivElement | null} */ (null));

  const unreadCount = items.filter((n) => n.status === 'unread').length;

  useEffect(() => {
    if (open) {
      void load();
    }
  }, [open, load]);

  useEffect(() => {
    if (!open) return undefined;
    function onDocMouseDown(e) {
      const el = wrapRef.current;
      if (el && !el.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [open]);

  return (
    <div className="notifications-bell-wrap" ref={wrapRef}>
      <button
        type="button"
        className="dashboard-icon-btn"
        aria-label={open ? 'Close notifications' : 'Open notifications'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22ZM18 16v-5a6 6 0 0 0-5-5.91V8a1 1 0 1 0-2 0v.09A6 6 0 0 0 6 11v5l-2 2v1h16v-1l-2-2Z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
        </svg>
        <span
          className={`dashboard-icon-btn__dot ${unreadCount === 0 ? 'dashboard-icon-btn__dot--off' : ''}`}
          aria-hidden={unreadCount === 0}
        />
      </button>
      {open ? (
        <div className="notifications-bell-dropdown" role="dialog" aria-label="Notifications">
          <NotificationsPanel
            variant="dropdown"
            items={items}
            loading={loading}
            error={error}
            onRetry={() => void load()}
            onMarkRead={markRead}
            markBusyId={markBusyId}
            markErrorById={markErrorById}
          />
        </div>
      ) : null}
    </div>
  );
}
