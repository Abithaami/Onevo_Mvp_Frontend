import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.jsx';
import { useWorkspaceState } from '../auth/WorkspaceStateProvider.jsx';
import OnevoLogo from '../components/OnevoLogo.jsx';
import { normalizeWorkspaceSetup } from '../data/setupData.js';
import { isOnboardingComplete } from '../features/onboarding/onboardingStorage.js';
import {
  WORKSPACE_STORAGE_KEY,
  fetchBusinessProfiles,
  loadWorkspacePayloadFromStorage,
  mergeServerProfilesIntoLocalPayload,
} from '../lib/workspaceServerApi.js';
import { dashboardSidebarSections } from '../pages/dashboard/dashboardNav.js';

const ONBOARDING_PATH = '/app/onboarding';
const WORKSPACE_SAVE_DEBOUNCE_MS = 1200;

function railClassName({ isActive }, item) {
  return [
    'dashboard-rail-item',
    isActive && 'dashboard-rail-item--active',
    item.tone === 'cream' && 'dashboard-rail-item--cream',
    item.tone === 'outline' && 'dashboard-rail-item--outline',
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * Primary authenticated shell: legacy dashboard top bar + left rail + main content (`Outlet`).
 * Setup mode (`/app/onboarding`): minimal top bar, no sidebar, no full app chrome.
 *
 * Route guards: backend session (`AuthProvider`) + onboarding completion from `WorkspaceStateProvider`
 * (GET `/api/me/workspace-state`), with localStorage fallback if the workspace bootstrap request fails.
 */
export default function WorkspaceLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const { status: authStatus, user, logout } = useAuth();
  const ws = useWorkspaceState();
  const authed = authStatus === 'authenticated';

  const workspaceBootstrapPending = authed && (ws.status === 'loading' || ws.status === 'idle');
  const onboardingDone =
    ws.status === 'ready'
      ? Boolean(ws.serverOnboardingComplete)
      : isOnboardingComplete();

  const [workspacePayload, setWorkspacePayload] = useState(() => loadWorkspacePayloadFromStorage());
  const setup = normalizeWorkspaceSetup(workspacePayload);
  const businessLabel = setup.brandData.businessName?.trim() || 'Your workspace';
  const contactLine = setup.growthData.approvalOwner?.trim() || '';
  const authDisplayName = user?.name?.trim() || user?.email?.trim() || '';
  const userChipLabel = contactLine || authDisplayName || 'Account';
  const avatarLetter = (contactLine ? contactLine.split('·')[0] : authDisplayName || businessLabel)
    .trim()
    .slice(0, 1)
    .toUpperCase() || 'U';

  const exitSetupRef = useRef(() => {
    navigate('/app/dashboard');
  });
  const registerExitSetup = useCallback((fn) => {
    exitSetupRef.current = typeof fn === 'function' ? fn : () => navigate('/app/dashboard');
  }, [navigate]);

  const saveWorkspaceTimerRef = useRef(null);

  useEffect(() => {
    setWorkspacePayload(loadWorkspacePayloadFromStorage());
  }, [location.pathname, ws.status]);

  useEffect(() => {
    if (authStatus !== 'authenticated' || !user?.userId || ws.status !== 'ready') {
      return undefined;
    }
    let cancelled = false;
    (async () => {
      const profiles = await fetchBusinessProfiles();
      if (cancelled) {
        return;
      }
      const raw = loadWorkspacePayloadFromStorage();
      const merged = mergeServerProfilesIntoLocalPayload(raw, profiles);
      setWorkspacePayload(merged);
      try {
        window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(merged));
      } catch {
        // quota / private mode
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authStatus, user?.userId, ws.status]);

  const handleSetupChange = useCallback(
    (next) => {
      setWorkspacePayload(next);
      try {
        window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // quota / private mode
      }
      window.clearTimeout(saveWorkspaceTimerRef.current);
      saveWorkspaceTimerRef.current = window.setTimeout(() => {
        void ws.saveWorkspaceState({ workspaceSnapshot: next });
      }, WORKSPACE_SAVE_DEBOUNCE_MS);
    },
    [ws],
  );

  useEffect(
    () => () => {
      window.clearTimeout(saveWorkspaceTimerRef.current);
    },
    [],
  );

  const handleSignOut = useCallback(async () => {
    await logout();
    navigate('/auth', { replace: true });
  }, [logout, navigate]);

  const onOpenConnections = useCallback(() => navigate('/app/integrations'), [navigate]);

  const outletContext = {
    setup,
    onSetupChange: handleSetupChange,
    onOpenConnections,
    onSignOut: handleSignOut,
  };

  const setupOutletContext = {
    ...outletContext,
    registerExitSetup,
  };

  const isSetupMode = pathname === ONBOARDING_PATH;

  if (authStatus === 'loading' || workspaceBootstrapPending) {
    return (
      <div className="dashboard-page" role="status" aria-busy="true" aria-label="Loading session">
        <div className="dashboard-page__ambient" aria-hidden="true" />
        <p className="dashboard-hero__lede" style={{ padding: '2.5rem' }}>
          Loading your workspace…
        </p>
      </div>
    );
  }

  if (!authed) {
    return <Navigate to="/auth" replace state={{ from: pathname }} />;
  }
  if (onboardingDone && pathname === ONBOARDING_PATH) {
    return <Navigate to="/app/dashboard" replace />;
  }
  if (!onboardingDone && pathname !== ONBOARDING_PATH) {
    return <Navigate to={ONBOARDING_PATH} replace />;
  }

  if (isSetupMode) {
    return (
      <div className="dashboard-page dashboard-page--setup" id="workspace-setup" aria-label="Setup">
        <div className="dashboard-page__ambient" aria-hidden="true" />
        <header className="workspace-setup-topbar">
          <div className="workspace-setup-brand">
            <div className="workspace-setup-logo-wrap">
              <OnevoLogo className="dashboard-logo" />
            </div>
            <span className="workspace-setup-product">ONEVO</span>
          </div>
          <button type="button" className="workspace-setup-exit" onClick={() => exitSetupRef.current()}>
            Exit setup
          </button>
        </header>
        <main className="dashboard-main dashboard-main--setup">
          <Outlet context={setupOutletContext} />
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-page" id="dashboard" aria-label="Workspace">
      <div className="dashboard-page__ambient" aria-hidden="true" />

      <header className="dashboard-topbar">
        <div className="dashboard-topbar__brand">
          <div className="dashboard-topbar__logo-wrap">
            <OnevoLogo className="dashboard-logo" />
          </div>
          <div className="dashboard-topbar__titles">
            <span className="dashboard-product-name">ONEVO</span>
            <span className="dashboard-workspace-name">{businessLabel}</span>
          </div>
        </div>

        <div className="dashboard-topbar__search" role="search">
          <label htmlFor="dashboard-search" className="visually-hidden">
            Search workspace
          </label>
          <span className="dashboard-search__icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15ZM21 21l-4.2-4.2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <input id="dashboard-search" type="search" placeholder="Search opportunities, people, tags…" autoComplete="off" />
        </div>

        <div className="dashboard-topbar__actions">
          <button type="button" className="dashboard-icon-btn" aria-label="Notifications (coming soon)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22ZM18 16v-5a6 6 0 0 0-5-5.91V8a1 1 0 1 0-2 0v.09A6 6 0 0 0 6 11v5l-2 2v1h16v-1l-2-2Z"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinejoin="round"
              />
            </svg>
            <span className="dashboard-icon-btn__dot" />
          </button>
          <span className="dashboard-user-chip" title={contactLine || undefined}>
            <span className="dashboard-user-chip__avatar" aria-hidden="true">
              {avatarLetter}
            </span>
            <span className="dashboard-user-chip__label">{userChipLabel}</span>
          </span>
        </div>
      </header>

      <div className="dashboard-body">
        <aside className="dashboard-sidebar dashboard-sidebar--rail" aria-label="Workspace navigation">
          {dashboardSidebarSections.map((section) => (
            <div key={section.id} className="dashboard-sidebar__group">
              <h3 className="dashboard-sidebar__group-title">{section.title}</h3>
              <ul className="dashboard-rail-list" role="list">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <NavLink
                      to={item.to}
                      end={item.to === '/app/dashboard'}
                      className={({ isActive }) => railClassName({ isActive }, item)}
                    >
                      <span className="dashboard-rail-item__abbr">{item.abbr}</span>
                      <span className="dashboard-rail-item__label">{item.label}</span>
                      {item.pro ? (
                        <span className="dashboard-rail-item__pro" title="Pro feature">
                          Pro
                        </span>
                      ) : null}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="dashboard-sidebar__signout">
            <button type="button" className="dashboard-signout-btn" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        </aside>

        <main className="dashboard-main">
          <Outlet context={outletContext} />
        </main>
      </div>
    </div>
  );
}
