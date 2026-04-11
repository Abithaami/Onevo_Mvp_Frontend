import { useCallback, useEffect, useState } from 'react';
import { getMockDashboardModel } from '../mockDashboardModel.js';

/**
 * Dashboard screen state — swap mock for API when backend is ready.
 */
export function useDashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [model, setModel] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const run = async () => {
      try {
        await new Promise((r) => setTimeout(r, 350));
        const next = getMockDashboardModel();
        setModel(next);
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Could not load dashboard'));
        setModel(null);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { loading, error, model, retry: load };
}
