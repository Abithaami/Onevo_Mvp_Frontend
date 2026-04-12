import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthProvider.jsx';
import {
  mergeWorkspaceLocalAndServer,
  putUserWorkspaceState,
  fetchUserWorkspaceState,
  loadWorkspacePayloadFromStorage,
  WORKSPACE_STORAGE_KEY,
} from '../lib/workspaceServerApi.js';
import {
  clearOnboardingCompleteFlag,
  setOnboardingComplete,
} from '../features/onboarding/onboardingStorage.js';

/** @typedef {'idle' | 'loading' | 'ready' | 'error'} WorkspaceBootstrapStatus */

/** @type {React.Context<null | { status: WorkspaceBootstrapStatus, serverOnboardingComplete: boolean | null, onboardingDraftJson: string | null, refresh: () => Promise<void>, saveWorkspaceState: (opts: { onboardingComplete?: boolean, workspaceSnapshot?: Record<string, unknown> | null, onboardingDraftJson?: string | null, clearOnboardingDraft?: boolean, skipWorkspaceRefresh?: boolean }) => Promise<boolean> }>} */
const WorkspaceStateContext = createContext(null);

function applyServerOnboardingFlagToCache(complete) {
  if (complete) {
    setOnboardingComplete();
  } else {
    clearOnboardingCompleteFlag();
  }
}

export function WorkspaceStateProvider({ children }) {
  const { status: authStatus } = useAuth();
  const [status, setStatus] = useState(/** @type {WorkspaceBootstrapStatus} */ ('idle'));
  const [serverOnboardingComplete, setServerOnboardingComplete] = useState(/** @type {boolean | null} */ (null));
  const [onboardingDraftJson, setOnboardingDraftJson] = useState(/** @type {string | null} */ (null));

  const refresh = useCallback(async () => {
    if (authStatus !== 'authenticated') {
      setStatus('idle');
      setServerOnboardingComplete(null);
      setOnboardingDraftJson(null);
      return;
    }
    setStatus('loading');
    try {
      const data = await fetchUserWorkspaceState();
      if (data === null) {
        setStatus('error');
        return;
      }
      const complete = Boolean(data.onboardingComplete ?? data.OnboardingComplete);
      setServerOnboardingComplete(complete);
      const snap = data.workspaceSnapshotJson ?? data.WorkspaceSnapshotJson ?? null;
      const draft = data.onboardingDraftJson ?? data.OnboardingDraftJson ?? null;
      setOnboardingDraftJson(draft);

      applyServerOnboardingFlagToCache(complete);

      const local = loadWorkspacePayloadFromStorage();
      let merged = local;
      if (snap) {
        try {
          const serverObj = JSON.parse(snap);
          merged = mergeWorkspaceLocalAndServer(local, serverObj);
        } catch {
          merged = local;
        }
      }
      try {
        window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(merged));
      } catch {
        // quota
      }

      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [authStatus]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveWorkspaceState = useCallback(
    async ({
      onboardingComplete,
      workspaceSnapshot,
      onboardingDraftJson: draft,
      clearOnboardingDraft,
      skipWorkspaceRefresh,
    }) => {
      const workspaceSnapshotJson =
        workspaceSnapshot !== undefined && workspaceSnapshot !== null
          ? JSON.stringify(workspaceSnapshot)
          : undefined;
      const ok = await putUserWorkspaceState({
        onboardingComplete,
        workspaceSnapshotJson,
        onboardingDraftJson: draft,
        clearOnboardingDraft: Boolean(clearOnboardingDraft),
      });
      if (ok && onboardingComplete === true) {
        applyServerOnboardingFlagToCache(true);
      }
      if (ok && onboardingComplete === false) {
        applyServerOnboardingFlagToCache(false);
      }
      if (ok && workspaceSnapshot && typeof workspaceSnapshot === 'object') {
        try {
          const local = loadWorkspacePayloadFromStorage();
          const merged = mergeWorkspaceLocalAndServer(local, workspaceSnapshot);
          window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(merged));
        } catch {
          // ignore
        }
      }
      if (ok) {
        const draftOnlyAutosave =
          skipWorkspaceRefresh === true &&
          draft !== undefined &&
          onboardingComplete === undefined &&
          workspaceSnapshot === undefined &&
          !clearOnboardingDraft;

        if (draftOnlyAutosave) {
          setOnboardingDraftJson(draft ?? null);
        } else {
          await refresh();
        }
      }
      return ok;
    },
    [refresh],
  );

  const value = useMemo(
    () => ({
      status,
      serverOnboardingComplete,
      onboardingDraftJson,
      refresh,
      saveWorkspaceState,
    }),
    [status, serverOnboardingComplete, onboardingDraftJson, refresh, saveWorkspaceState],
  );

  return <WorkspaceStateContext.Provider value={value}>{children}</WorkspaceStateContext.Provider>;
}

export function useWorkspaceState() {
  const ctx = useContext(WorkspaceStateContext);
  if (!ctx) {
    throw new Error('useWorkspaceState must be used within WorkspaceStateProvider');
  }
  return ctx;
}
