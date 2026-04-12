import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.jsx';
import { useWorkspaceState } from '../auth/WorkspaceStateProvider.jsx';
import LoginForm from '../components/auth/LoginForm.jsx';
import RegisterForm from '../components/auth/RegisterForm.jsx';
import ToastAlert from '../components/auth/ToastAlert.jsx';
import { OnevoLogo } from '../components/auth/AuthIcons.jsx';

/**
 * Real auth: Google OAuth (cookie session) + `GET /api/auth/google/session` via `AuthProvider`.
 * Email/password are not offered as live flows — Google only.
 */
export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { status, error, refreshSession } = useAuth();
  const ws = useWorkspaceState();
  const [mode, setMode] = useState('sign-in');
  const [toast, setToast] = useState(null);
  const prevPathRef = useRef(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const googleLoginReturnUrl = `${origin}/app/dashboard`;
  const googleRegisterReturnUrl = `${origin}/app/onboarding`;

  function showToast(message, type = 'info') {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 4000);
  }

  function selectMode(nextMode) {
    setMode(nextMode);
    setToast(null);
  }

  /** Default to Sign in when navigating onto /auth (e.g. after sign-out); keep mode while staying on the page. */
  useEffect(() => {
    const path = location.pathname;
    if (path === '/auth' && prevPathRef.current !== '/auth') {
      setMode('sign-in');
      setToast(null);
    }
    prevPathRef.current = path;
  }, [location.pathname]);

  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }
    if (ws.status === 'idle' || ws.status === 'loading') {
      return;
    }
    if (ws.status === 'ready') {
      navigate(ws.serverOnboardingComplete ? '/app/dashboard' : '/app/onboarding', { replace: true });
      return;
    }
    navigate('/app/dashboard', { replace: true });
  }, [status, ws.status, ws.serverOnboardingComplete, navigate]);

  if (status === 'loading') {
    return (
      <div className="auth-page auth-page--loading" aria-busy="true" aria-label="Checking session">
        <div className="auth-page__ambient" aria-hidden="true" />
        <div className="auth-page__loading-inner">
          <OnevoLogo className="auth-page__loading-logo" />
          <p className="auth-page__loading-text">Checking your session…</p>
        </div>
      </div>
    );
  }

  if (status === 'authenticated') {
    return (
      <div className="auth-page auth-page--loading" aria-busy="true" aria-label="Loading workspace">
        <div className="auth-page__ambient" aria-hidden="true" />
        <div className="auth-page__loading-inner">
          <OnevoLogo className="auth-page__loading-logo" />
          <p className="auth-page__loading-text">Loading your workspace…</p>
        </div>
      </div>
    );
  }

  const isSignIn = mode === 'sign-in';

  return (
    <>
      <div className="auth-page">
        <div className="auth-page__ambient" aria-hidden="true" />

        <header className="auth-page__header">
          <Link to="/" className="auth-page__logo-link" aria-label="Onevo home">
            <OnevoLogo className="auth-page__logo-mark" />
            <span className="auth-page__logo-text">ONEVO</span>
          </Link>
        </header>

        <div className="auth-page__grid">
          <div className="auth-page__brand">
            <p className="auth-page__eyebrow">Workspace access</p>
            <h1 className="auth-page__title">{isSignIn ? 'Welcome back' : 'Create your workspace'}</h1>
            <p className="auth-page__lede">
              {isSignIn
                ? 'Pick up where you left off—continue with Google to return to your dashboard.'
                : 'Start with Google. New workspaces open in onboarding so ONEVO can learn your business.'}
            </p>
            <ul className="auth-page__bullets">
              {isSignIn ? (
                <>
                  <li>Resume your dashboard and saved setup</li>
                  <li>One sign-in—no extra password for ONEVO yet</li>
                </>
              ) : (
                <>
                  <li>Guided onboarding in a few focused steps</li>
                  <li>Google keeps sign-in simple and familiar</li>
                </>
              )}
            </ul>
            <Link to="/" className="auth-page__back-link">
              ← Back to marketing site
            </Link>
          </div>

          <div className="auth-page__panel-wrap">
            {error === 'session_network' ? (
              <div className="auth-page__alert" role="status">
                <strong>Can’t reach the API.</strong> Start the backend and check <code>VITE_API_BASE_URL</code> / the dev
                proxy, then{' '}
                <button type="button" className="auth-page__alert-retry" onClick={() => refreshSession()}>
                  retry
                </button>
                .
              </div>
            ) : null}

            <div className="auth-panel">
              <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
                <button
                  className={`auth-tab ${isSignIn ? 'auth-tab--active' : ''}`}
                  type="button"
                  role="tab"
                  aria-selected={isSignIn}
                  aria-controls="login-panel"
                  id="tab-login"
                  onClick={() => selectMode('sign-in')}
                >
                  Sign in
                </button>
                <button
                  className={`auth-tab ${!isSignIn ? 'auth-tab--active' : ''}`}
                  type="button"
                  role="tab"
                  aria-selected={!isSignIn}
                  aria-controls="register-panel"
                  id="tab-register"
                  onClick={() => selectMode('create-account')}
                >
                  Create account
                </button>
              </div>

              {isSignIn ? (
                <LoginForm googleReturnUrl={googleLoginReturnUrl} onShowToast={showToast} />
              ) : (
                <RegisterForm googleReturnUrl={googleRegisterReturnUrl} onShowToast={showToast} />
              )}
            </div>

            <p className="auth-page__session-note">Session cookie on your API host after Google—standard for this app.</p>
          </div>
        </div>
      </div>

      <ToastAlert toast={toast} />
    </>
  );
}
