import { useMemo, useState } from 'react';
import RecommendationCard from '../../components/workbench/RecommendationCard.jsx';
import { getMockApprovalQueue } from './mockApprovalQueue.js';
import './approval.css';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'urgent', label: 'Urgent' },
  { id: 'normal', label: 'Standard' }
];

export default function ApprovalQueueView() {
  const allItems = useMemo(() => getMockApprovalQueue(), []);
  const [filter, setFilter] = useState('all');

  const items = useMemo(() => {
    if (filter === 'urgent') {
      return allItems.filter((i) => i.urgency === 'high');
    }
    if (filter === 'normal') {
      return allItems.filter((i) => i.urgency === 'normal');
    }
    return allItems;
  }, [allItems, filter]);

  function handleAction(id, action) {
    void id;
    void action;
    // TODO: PATCH approval API
  }

  return (
    <div className="ap-page">
      <header className="ap-page-header">
        <h1 className="ap-page-title">Approval queue</h1>
        <p className="ap-page-lead">
          Review what Onevo drafted. Approve, edit, or reject — nothing goes out without you.
        </p>
      </header>

      <div className="ap-toolbar" role="toolbar" aria-label="Filter queue">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`ap-filter ${filter === f.id ? 'active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
            {f.id === 'all' ? (
              <span className="ap-filter-count">{allItems.length}</span>
            ) : f.id === 'urgent' ? (
              <span className="ap-filter-count">{allItems.filter((i) => i.urgency === 'high').length}</span>
            ) : (
              <span className="ap-filter-count">{allItems.filter((i) => i.urgency === 'normal').length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="ap-queue">
        {items.length === 0 ? (
          <div className="db-empty">
            <p>Nothing in this view.</p>
            <p className="db-empty-hint">Try another filter or check back when new drafts arrive.</p>
          </div>
        ) : (
          items.map((item) => (
            <RecommendationCard key={item.id} item={item} onAction={(action) => handleAction(item.id, action)} />
          ))
        )}
      </div>
    </div>
  );
}
