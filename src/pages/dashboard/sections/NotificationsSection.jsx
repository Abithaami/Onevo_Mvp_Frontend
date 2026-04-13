import NotificationsPanel from '../../../features/notifications/NotificationsPanel.jsx';
import { useNotifications } from '../../../features/notifications/useNotifications.js';

/**
 * Full-width notifications view for `/app/dashboard/notifications`.
 */
export default function NotificationsSection() {
  const { items, loading, error, load, markRead, markBusyId, markErrorById } = useNotifications({
    autoLoad: true,
  });

  return (
    <NotificationsPanel
      variant="page"
      items={items}
      loading={loading}
      error={error}
      onRetry={() => void load()}
      onMarkRead={markRead}
      markBusyId={markBusyId}
      markErrorById={markErrorById}
    />
  );
}
