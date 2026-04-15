import { useCallback, useEffect, useState } from 'react';
import SourceLogo from '../../../../components/SourceLogo';
import { socialMediaSources } from '../../../../data/onevoData';
import {
  disconnectLinkedIn,
  fetchLinkedInAuthorizationUrl,
  fetchLinkedInStatus,
} from '../../../../features/integrations/linkedinIntegrationApi.js';
import { cloneConnectionData } from '../../../../lib/workspaceUtils';

export default function SocialAccountsEditPanel({ connectionData, onConnectionChange }) {
  const [draft, setDraft] = useState(() => cloneConnectionData(connectionData));
  const [connectBusy, setConnectBusy] = useState(false);
  const [disconnectBusy, setDisconnectBusy] = useState(false);
  const [linkedinStatusLoading, setLinkedinStatusLoading] = useState(false);
  const [linkedinConnected, setLinkedinConnected] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    setDraft(cloneConnectionData(connectionData));
  }, [connectionData]);

  const refreshLinkedInStatus = useCallback(async () => {
    setLinkedinStatusLoading(true);
    const result = await fetchLinkedInStatus();
    setLinkedinStatusLoading(false);
    if (!result.ok) {
      setActionError(result.error);
      return;
    }
    setLinkedinConnected(Boolean(result.status.isConnected));
  }, []);

  useEffect(() => {
    void refreshLinkedInStatus();
  }, [refreshLinkedInStatus]);

  function toggleConnection(sourceId) {
    setDraft((current) => ({ ...current, [sourceId]: !current[sourceId] }));
  }

  function handleSave() {
    onConnectionChange(cloneConnectionData(draft));
  }

  function handleCancel() {
    setDraft(cloneConnectionData(connectionData));
  }

  async function handleLinkedInConnect() {
    setActionError('');
    setConnectBusy(true);
    const result = await fetchLinkedInAuthorizationUrl();
    setConnectBusy(false);
    if (!result.ok) {
      setActionError(result.error);
      return;
    }
    window.location.assign(result.authorizationUrl);
  }

  async function handleLinkedInDisconnect() {
    setActionError('');
    setDisconnectBusy(true);
    const result = await disconnectLinkedIn();
    setDisconnectBusy(false);
    if (!result.ok) {
      setActionError(result.error);
      return;
    }
    await refreshLinkedInStatus();
  }

  return (
    <div className="dashboard-edit">
      <header className="dashboard-edit__head">
        <p className="eyebrow">Workspace</p>
        <h1 className="dashboard-edit__title">Social accounts</h1>
        <p className="dashboard-edit__lede">LinkedIn is live. Facebook and Instagram are visible as coming soon.</p>
      </header>
      <div className="onboarding-panel dashboard-edit__panel">
        {actionError ? (
          <p className="onboarding-inline-alert" role="alert">
            {actionError}
          </p>
        ) : null}
        <div className="onboarding-connection-grid onboarding-connection-grid--social">
          {socialMediaSources.map((source) => {
            const active = draft[source.id];
            const isLinkedIn = source.id === 'linkedin';
            const isComingSoon = !isLinkedIn;
            const linkedInActionBusy = linkedinStatusLoading || connectBusy || disconnectBusy;
            const cardActive = isLinkedIn ? linkedinConnected : active;
            return (
              <article
                key={source.id}
                className={`onboarding-connection-card ${cardActive ? 'active' : ''} ${isComingSoon ? 'is-disabled' : ''}`}
              >
                <div className="onboarding-connection-top">
                  <SourceLogo id={source.id} name={source.name} />
                  <span className={`onboarding-source-badge ${cardActive ? 'active' : ''}`}>
                    {isComingSoon ? 'Coming soon' : linkedinStatusLoading ? 'Checking…' : linkedinConnected ? 'Connected' : 'Not connected'}
                  </span>
                </div>
                <div className="onboarding-connection-copy">
                  <p>{source.type}</p>
                  <h3>{source.name}</h3>
                  <small>{source.signal}</small>
                </div>
                <button
                  type="button"
                  className={isLinkedIn ? 'primary-btn' : active ? 'secondary-btn' : 'primary-btn'}
                  onClick={
                    isLinkedIn
                      ? linkedinConnected
                        ? () => void handleLinkedInDisconnect()
                        : () => void handleLinkedInConnect()
                      : () => toggleConnection(source.id)
                  }
                  disabled={isComingSoon || linkedInActionBusy}
                  title={isComingSoon ? `${source.name} integration is coming soon.` : undefined}
                >
                  {isComingSoon
                    ? 'Coming soon'
                    : linkedinStatusLoading
                      ? 'Checking…'
                      : linkedinConnected
                        ? disconnectBusy
                          ? 'Disconnecting…'
                          : 'Disconnect LinkedIn'
                        : connectBusy
                          ? 'Redirecting…'
                          : 'Connect LinkedIn'}
                </button>
              </article>
            );
          })}
        </div>

        <div className="dashboard-edit__actions">
          <button type="button" className="secondary-btn" onClick={handleCancel}>
            Cancel
          </button>
          <button type="button" className="primary-btn dashboard-edit__save" onClick={handleSave}>
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
