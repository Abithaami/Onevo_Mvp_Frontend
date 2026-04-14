import { useCallback, useEffect, useState } from 'react';
import { fetchNotifications, markNotificationRead } from './notificationsApi.js';

/**
 * Loads notifications from GET /api/notifications and marks read via PATCH.
 * @param {{ autoLoad?: boolean }} opts
 */
export function useNotifications(opts = {}) {
  const { autoLoad = true } = opts;
  const [items, setItems] = useState(/** @type {Array<{ id: string, channel: string, message: string, status: string, sentAtUtc: string }>} */ ([]));
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState('');
  const [markBusyId, setMarkBusyId] = useState('');
  const [markErrorById, setMarkErrorById] = useState(/** @type {Record<string, string>} */ ({}));

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const r = await fetchNotifications({ take: 50 });
    setLoading(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setItems(r.items);
  }, []);

  useEffect(() => {
    if (autoLoad) {
      void load();
    }
  }, [autoLoad, load]);

  const markRead = useCallback(async (id) => {
    setMarkErrorById((m) => {
      const next = { ...m };
      delete next[id];
      return next;
    });
    setMarkBusyId(id);
    const r = await markNotificationRead(id);
    setMarkBusyId('');
    if (!r.ok) {
      setMarkErrorById((m) => ({ ...m, [id]: r.error }));
      return;
    }
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: 'read' } : it)));
  }, []);

  return {
    items,
    loading,
    error,
    load,
    markRead,
    markBusyId,
    markErrorById,
  };
}
