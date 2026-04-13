import { useMemo, useState } from 'react';
import ConnectionCard from './components/ConnectionCard.jsx';
import LinkedInCommentIntentSection from './components/LinkedInCommentIntentSection.jsx';
import LinkedInIntegrationSection from './components/LinkedInIntegrationSection.jsx';
import { getPlaceholderIntegrationsRows } from './placeholderIntegrationsModel.js';
import './integrations.css';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'attention', label: 'Needs attention' },
  { id: 'connected', label: 'Connected' },
];

function needsAttention(row) {
  return row.status === 'expired' || row.status === 'error';
}

export default function IntegrationsView() {
  const rows = useMemo(() => getPlaceholderIntegrationsRows(), []);
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

  return (
    <div className="int-page">
      <header className="int-page-header">
        <h1 className="int-page-title">Integrations</h1>
        <p className="int-page-lead">
          Connect channels Onevo can use for signals and actions. <strong>LinkedIn</strong> below uses live OAuth; other
          listings are placeholders until those channels ship.
        </p>
      </header>

      <LinkedInIntegrationSection />

      <LinkedInCommentIntentSection />

      {attentionCount > 0 ? (
        <div className="int-banner" role="status">
          <strong>{attentionCount}</strong> integration{attentionCount === 1 ? '' : 's'} need attention — fix connections
          to unlock live recommendations.
        </div>
      ) : null}

      <h2 className="int-page-subheading">Other channels</h2>
      <p className="int-page-subnote">OAuth for these is not enabled in the MVP — connect controls are disabled.</p>

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
            <p className="int-empty-hint">
              {filter === 'connected'
                ? 'Only LinkedIn can be live-connected in this MVP — see the section above.'
                : 'Try another filter.'}
            </p>
          </div>
        ) : (
          visible.map((row) => (
            <ConnectionCard
              key={row.id}
              integration={row}
              onConnect={() => {}}
              onReconnect={() => {}}
              onDisconnect={() => {}}
            />
          ))
        )}
      </div>
    </div>
  );
}
