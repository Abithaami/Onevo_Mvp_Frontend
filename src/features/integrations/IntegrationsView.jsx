import { useMemo, useState } from 'react';
import ConnectionCard from './components/ConnectionCard.jsx';
import { getMockIntegrationsViewModel } from './mockIntegrationsModel.js';
import './integrations.css';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'attention', label: 'Needs attention' },
  { id: 'connected', label: 'Connected' }
];

function needsAttention(row) {
  return row.status === 'expired' || row.status === 'error';
}

export default function IntegrationsView() {
  const rows = useMemo(() => getMockIntegrationsViewModel(), []);
  const [filter, setFilter] = useState('all');

  const visible = useMemo(() => {
    if (filter === 'attention') {
      return rows.filter(needsAttention);
    }
    if (filter === 'connected') {
      return rows.filter((r) => r.status === 'connected');
    }
    return rows;
  }, [rows, filter]);

  const attentionCount = rows.filter(needsAttention).length;

  function handleConnect(id) {
    void id;
    // TODO: OAuth / connect flow
  }

  function handleReconnect(id) {
    void id;
    // TODO: reconnect flow
  }

  function handleDisconnect(id) {
    void id;
    // TODO: disconnect API
  }

  return (
    <div className="int-page">
      <header className="int-page-header">
        <h1 className="int-page-title">Integrations</h1>
        <p className="int-page-lead">
          Connect the channels and tools Onevo uses for signals, recommendations, and approvals. Reconnect anytime if a token
          expires.
        </p>
      </header>

      {attentionCount > 0 ? (
        <div className="int-banner" role="status">
          <strong>{attentionCount}</strong> integration{attentionCount === 1 ? '' : 's'} need attention — fix connections to
          unlock live recommendations.
        </div>
      ) : null}

      <div className="int-toolbar" role="toolbar" aria-label="Filter integrations">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`int-filter ${filter === f.id ? 'active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="int-grid">
        {visible.length === 0 ? (
          <div className="int-empty">
            <p>No integrations in this view.</p>
            <p className="int-empty-hint">Try another filter.</p>
          </div>
        ) : (
          visible.map((row) => (
            <ConnectionCard
              key={row.id}
              integration={row}
              onConnect={handleConnect}
              onReconnect={handleReconnect}
              onDisconnect={handleDisconnect}
            />
          ))
        )}
      </div>
    </div>
  );
}
