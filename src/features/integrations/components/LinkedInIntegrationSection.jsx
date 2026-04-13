/**
 * LinkedIn: live OAuth status from GET /api/integrations/linkedin/status.
 * Onboarding "selected" comes from workspace snapshot only — never treated as connected.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { normalizeWorkspaceSetup } from '../../../data/setupData.js';
import { loadWorkspacePayloadFromStorage } from '../../../lib/workspaceServerApi.js';
import {
  disconnectLinkedIn,
  fetchLinkedInAuthorizationUrl,
  fetchLinkedInStatus,
} from '../linkedinIntegrationApi.js';

export default function LinkedInIntegrationSection() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(/** @type {null | { isConnected: boolean, linkedInName: string | null, linkedInEmail: string | null }} */ (null));
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [connectBusy, setConnectBusy] = useState(false);
  const [disconnectBusy, setDisconnectBusy] = useState(false);

  const onboardingLinkedInSelected = useMemo(() => {
    const raw = loadWorkspacePayloadFromStorage();
    return Boolean(normalizeWorkspaceSetup(raw).connectionData?.linkedin);
  }, [location.pathname]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    const r = await fetchLinkedInStatus();
    setLoading(false);
    if (r.ok) {
      setStatus(r.status);
    } else {
      setLoadError(r.error);
      setStatus(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /** Same query cleanup as onboarding when backend redirects after OAuth. */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const li = params.get('linkedin');
    const liErr = params.get('linkedin_error');
    if (li === 'connected') {
      params.delete('linkedin');
      const next = params.toString();
      navigate({ pathname: location.pathname, search: next ? `?${next}` : '' }, { replace: true });
      void refresh();
      return;
    }
    if (liErr != null && liErr !== '') {
      params.delete('linkedin_error');
      const next = params.toString();
      navigate({ pathname: location.pathname, search: next ? `?${next}` : '' }, { replace: true });
      setActionError(decodeURIComponent(liErr.replace(/\+/g, ' ')));
    }
  }, [location.search, location.pathname, navigate, refresh]);

  async function handleConnect() {
    setActionError('');
    setConnectBusy(true);
    const r = await fetchLinkedInAuthorizationUrl();
    setConnectBusy(false);
    if (!r.ok) {
      setActionError(r.error);
      return;
    }
    window.location.assign(r.authorizationUrl);
  }

  async function handleDisconnect() {
    setActionError('');
    setDisconnectBusy(true);
    const r = await disconnectLinkedIn();
    setDisconnectBusy(false);
    if (!r.ok) {
      setActionError(r.error);
      return;
    }
    await refresh();
  }

  const liveConnected = Boolean(status?.isConnected);
  const profileHint = [status?.linkedInName, status?.linkedInEmail].filter(Boolean).join(' · ');
  const busy = loading || connectBusy || disconnectBusy;

  return (
    <section className="int-linkedin-panel" aria-labelledby="int-linkedin-title">
      <div className="int-linkedin-panel__head">
        <div className="int-card-icon int-linkedin-panel__logo" aria-hidden="true">
          in
        </div>
        <div>
          <h2 id="int-linkedin-title" className="int-linkedin-panel__title">
            LinkedIn
          </h2>
          <p className="int-linkedin-panel__lede">
            Live connection uses OAuth. This is separate from checking &quot;LinkedIn&quot; during onboarding—that only records
            intent.
          </p>
        </div>
        <span className={`int-badge int-badge--${liveConnected ? 'connected' : 'not_connected'}`}>
          {loading ? 'Checking…' : liveConnected ? 'Connected' : 'Not connected'}
        </span>
      </div>

      <dl className="int-linkedin-panel__facts">
        <div className="int-linkedin-panel__fact">
          <dt>Onboarding</dt>
          <dd>{onboardingLinkedInSelected ? 'You selected LinkedIn in setup' : 'Not selected in setup'}</dd>
        </div>
        <div className="int-linkedin-panel__fact">
          <dt>Live OAuth</dt>
          <dd>
            {loading
              ? '—'
              : liveConnected
                ? profileHint || 'Connected'
                : 'Not connected — connect to link your LinkedIn account.'}
          </dd>
        </div>
      </dl>

      {onboardingLinkedInSelected && !liveConnected && !loading ? (
        <p className="int-linkedin-panel__hint" role="status">
          You chose LinkedIn during onboarding, but OAuth is not complete yet. Use Connect to sign in with LinkedIn.
        </p>
      ) : null}

      {loadError ? (
        <p className="int-card-detail" role="alert">
          Could not load LinkedIn status: {loadError}
        </p>
      ) : null}
      {actionError ? (
        <p className="int-card-detail" role="alert">
          {actionError}
        </p>
      ) : null}

      <div className="int-card-actions int-linkedin-panel__actions">
        {liveConnected ? (
          <>
            <button
              type="button"
              className="int-btn int-btn--primary"
              disabled={busy}
              onClick={() => void handleConnect()}
            >
              {connectBusy ? 'Redirecting…' : 'Reconnect'}
            </button>
            <button
              type="button"
              className="int-btn int-btn--ghost"
              disabled={busy}
              onClick={() => void handleDisconnect()}
            >
              {disconnectBusy ? 'Disconnecting…' : 'Disconnect'}
            </button>
          </>
        ) : (
          <button type="button" className="int-btn int-btn--primary" disabled={busy} onClick={() => void handleConnect()}>
            {connectBusy ? 'Redirecting…' : 'Connect LinkedIn'}
          </button>
        )}
      </div>
    </section>
  );
}
