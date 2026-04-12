import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiUrl, googleSessionProbeUrl } from '../lib/apiBase.js';
import { clearWorkspaceOnlyAfterLogout, signOutClientSession } from '../features/onboarding/onboardingStorage.js';

/**
 * Mirrors `GoogleAuthUserResponse` from ONEVO_MVP.API (camelCase JSON from ASP.NET).
 * @typedef {{ userId: string, tenantId: string, name: string | null, email: string | null, givenName: string | null, surname: string | null }} AuthUser
 */

/** @typedef {{ preserveOnboardingDraft?: boolean }} LogoutOptions */

/** @type {React.Context<{ status: 'loading' | 'anonymous' | 'authenticated', user: AuthUser | null, error: string | null, refreshSession: () => Promise<void>, logout: (opts?: LogoutOptions) => Promise<void> } | null>} */
const AuthContext = createContext(null);

async function postLogout() {
  const res = await fetch(apiUrl('/api/auth/google/logout'), {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  return res.ok;
}

function parseSessionUser(payload) {
  if (!payload || typeof payload !== 'object') return null;
  return {
    userId: String(payload.userId ?? payload.UserId ?? ''),
    tenantId: String(payload.tenantId ?? payload.TenantId ?? ''),
    name: payload.name ?? payload.Name ?? null,
    email: payload.email ?? payload.Email ?? null,
    givenName: payload.givenName ?? payload.GivenName ?? null,
    surname: payload.surname ?? payload.Surname ?? null,
  };
}

export function AuthProvider({ children }) {
  const [status, setStatus] = useState(/** @type {'loading' | 'anonymous' | 'authenticated'} */ ('loading'));
  const [user, setUser] = useState(/** @type {AuthUser | null} */ (null));
  const [error, setError] = useState(/** @type {string | null} */ (null));

  const refreshSession = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(googleSessionProbeUrl(), {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      if (res.status === 401) {
        setUser(null);
        setStatus('anonymous');
        return;
      }
      if (!res.ok) {
        setUser(null);
        setStatus('anonymous');
        setError(`session_http_${res.status}`);
        return;
      }
      const json = await res.json();
      const parsed = parseSessionUser(json);
      if (!parsed?.userId) {
        setUser(null);
        setStatus('anonymous');
        setError('session_invalid_payload');
        return;
      }
      setUser(parsed);
      setStatus('authenticated');
    } catch {
      setUser(null);
      setStatus('anonymous');
      setError('session_network');
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const logout = useCallback(async (/** @type {LogoutOptions | undefined} */ opts) => {
    try {
      await postLogout();
    } catch {
      /* still clear client */
    }
    if (opts?.preserveOnboardingDraft) {
      clearWorkspaceOnlyAfterLogout();
    } else {
      signOutClientSession();
    }
    setUser(null);
    setStatus('anonymous');
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      status,
      user,
      error,
      refreshSession,
      logout,
    }),
    [status, user, error, refreshSession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
