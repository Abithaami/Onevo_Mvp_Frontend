import { useState } from 'react';
import SourceLogo from '../../../components/SourceLogo';
import { socialSources } from '../../../data/onevoData';

export default function SocialConnectionsPage({ embedded = false, onBackToLanding, showToast }) {
  const [connections, setConnections] = useState({
    instagram: 'not-connected',
    facebook: 'not-connected',
    'google-business': 'not-connected',
    website: 'not-connected',
    pos: 'not-connected',
    'manual-upload': 'not-connected',
  });

  const connectedCount = Object.values(connections).filter((status) => status === 'connected').length;
  const pendingCount = Object.values(connections).filter((status) => status === 'pending').length;
  const readySignals = socialSources.filter((source) => connections[source.id] === 'connected').map((source) => source.signal);
  const PageTag = embedded ? 'section' : 'main';

  function handleConnect(source) {
    setConnections((current) => {
      if (current[source.id] === 'connected') {
        return { ...current, [source.id]: 'not-connected' };
      }

      return { ...current, [source.id]: 'connected' };
    });

    showToast(
      connections[source.id] === 'connected' ? `${source.name} disconnected from this local setup.` : `${source.name} marked connected. Real provider OAuth is Not Yet Defined.`,
      connections[source.id] === 'connected' ? 'info' : 'success',
    );
  }

  function markPending(source) {
    setConnections((current) => ({ ...current, [source.id]: 'pending' }));
    showToast(`${source.name} connection request saved as pending. Provider flow is Not Yet Defined.`, 'info');
  }

  return (
    <PageTag className={`connections-page ${embedded ? 'connections-page--embedded' : ''}`} id="connections" aria-label="Social media connections page">
      <section className="connections-hero" aria-labelledby="connections-title">
        <div className="connections-intro">
          {!embedded && (
            <button type="button" className="back-link" onClick={() => onBackToLanding('#home')}>
              Back to landing
            </button>
          )}
          <p className="eyebrow">Source connections</p>
          <h1 id="connections-title">Connect the channels where your customers already talk.</h1>
          <p>Onevo uses connected source signals to detect intent, rank opportunities, and prepare actions for review.</p>
        </div>

        <aside className="connection-summary" aria-label="Connection readiness summary">
          <span className="summary-label">Signal readiness</span>
          <strong>{connectedCount} connected</strong>
          <p>{pendingCount} pending setup</p>
          <div className="summary-meter" aria-label={`${connectedCount} of ${socialSources.length} sources connected`}>
            <span style={{ width: `${(connectedCount / socialSources.length) * 100}%` }} />
          </div>
        </aside>
      </section>

      <section className="connection-layout" aria-label="Available source connections">
        <div className="connection-grid">
          {socialSources.map((source) => {
            const status = connections[source.id];
            const connected = status === 'connected';
            const pending = status === 'pending';

            return (
              <article className={`connection-card ${connected ? 'connected' : ''}`} key={source.id}>
                <div className="connection-card-top">
                  <SourceLogo id={source.id} name={source.name} />
                  <span className={`status-badge status-badge--${status}`}>{connected ? 'Connected' : pending ? 'Pending' : 'Not connected'}</span>
                </div>
                <div>
                  <p className="source-type">{source.type}</p>
                  <h2>{source.name}</h2>
                  <p>{source.description}</p>
                </div>
                <div className="source-signal">
                  <span>Signals</span>
                  <strong>{source.signal}</strong>
                </div>
                <div className="connection-actions">
                  <button type="button" className={connected ? 'secondary-btn' : 'primary-btn'} onClick={() => handleConnect(source)}>
                    {connected ? 'Disconnect' : 'Connect'}
                  </button>
                  {!connected && (
                    <button type="button" className="secondary-btn" onClick={() => markPending(source)}>
                      Set pending
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <aside className="signal-review" aria-label="Connected signal review">
          <h2>What Onevo can use next</h2>
          {readySignals.length > 0 ? (
            <ul>
              {readySignals.map((signal) => (
                <li key={signal}>{signal}</li>
              ))}
            </ul>
          ) : (
            <div className="empty-source-state">
              <strong>No accounts connected yet</strong>
              <p>Connect your first source so Onevo can start building the signal-to-recommendation loop.</p>
            </div>
          )}
          <div className="approval-preview">
            <h3>Approval stays first</h3>
            <p>Connected channels feed recommendations. Onevo still asks for review before high-impact actions move forward.</p>
          </div>
        </aside>
      </section>
    </PageTag>
  );
}
