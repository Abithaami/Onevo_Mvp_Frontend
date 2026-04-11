import { useEffect, useState } from 'react';
import SourceLogo from '../../../../components/SourceLogo';
import { socialMediaSources } from '../../../../data/onevoData';
import { cloneConnectionData } from '../../../../lib/workspaceUtils';

export default function SocialAccountsEditPanel({ connectionData, onConnectionChange }) {
  const [draft, setDraft] = useState(() => cloneConnectionData(connectionData));

  useEffect(() => {
    setDraft(cloneConnectionData(connectionData));
  }, [connectionData]);

  function toggleConnection(sourceId) {
    setDraft((current) => ({ ...current, [sourceId]: !current[sourceId] }));
  }

  function handleSave() {
    onConnectionChange(cloneConnectionData(draft));
  }

  function handleCancel() {
    setDraft(cloneConnectionData(connectionData));
  }

  return (
    <div className="dashboard-edit">
      <header className="dashboard-edit__head">
        <p className="eyebrow">Workspace</p>
        <h1 className="dashboard-edit__title">Social accounts</h1>
        <p className="dashboard-edit__lede">Facebook, Instagram, and LinkedIn only—same scope as onboarding step 3.</p>
      </header>
      <div className="onboarding-panel dashboard-edit__panel">
        <div className="onboarding-connection-grid onboarding-connection-grid--social">
          {socialMediaSources.map((source) => {
            const active = draft[source.id];
            return (
              <article key={source.id} className={`onboarding-connection-card ${active ? 'active' : ''}`}>
                <div className="onboarding-connection-top">
                  <SourceLogo id={source.id} name={source.name} />
                  <span className={`onboarding-source-badge ${active ? 'active' : ''}`}>{active ? 'Selected' : 'Later'}</span>
                </div>
                <div className="onboarding-connection-copy">
                  <p>{source.type}</p>
                  <h3>{source.name}</h3>
                  <small>{source.signal}</small>
                </div>
                <button type="button" className={active ? 'secondary-btn' : 'primary-btn'} onClick={() => toggleConnection(source.id)}>
                  {active ? 'Remove' : 'Add source'}
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
