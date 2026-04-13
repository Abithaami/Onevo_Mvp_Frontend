import { useCallback, useEffect, useState } from 'react';
import { getMockDashboardModel } from '../mockDashboardModel.js';

/**
 * Legacy mock dashboard model (workbench KPIs). The main workspace overview uses
 * `DashboardWorkspaceContent` + real setup data instead — this hook is only for the unused `DashboardView` prototype.
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
