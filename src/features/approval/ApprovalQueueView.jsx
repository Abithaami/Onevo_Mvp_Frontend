import { useEffect, useMemo, useState } from 'react';
import ToastAlert from '../../components/auth/ToastAlert.jsx';
import RejectDraftModal from '../../components/workbench/RejectDraftModal.jsx';
import RecommendationCard from '../../components/workbench/RecommendationCard.jsx';
import { getMockApprovalQueue } from './mockApprovalQueue.js';
import './approval.css';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'urgent', label: 'Urgent' },
  { id: 'normal', label: 'Standard' }
];

export default function ApprovalQueueView() {
  const [queueItems, setQueueItems] = useState(() => getMockApprovalQueue());
  const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }
    const t = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [toast]);

  function showToast(message, type = 'info') {
    setToast({ message, type });
  }

  const items = useMemo(() => {
    if (filter === 'urgent') {
      return queueItems.filter((i) => i.urgency === 'high');
    }
    if (filter === 'normal') {
      return queueItems.filter((i) => i.urgency === 'normal');
    }
    return queueItems;
  }, [queueItems, filter]);

  function removeItem(id) {
    setQueueItems((prev) => prev.filter((i) => i.id !== id));
  }

  function handleAction(id, action) {
    const item = queueItems.find((i) => i.id === id);
    const title = item?.title ?? 'This item';

    if (action === 'reject') {
      setRejectTarget({ id, title });
      return;
    }

    if (action === 'approve') {
      removeItem(id);
      showToast(`Approved: ${title}`, 'success');
      return;
    }

    if (action === 'later') {
      removeItem(id);
      showToast(`Saved for later — ${title}`, 'info');
      return;
    }

    if (action === 'edit') {
      showToast('Editor will open here when the draft API is connected.', 'info');
      return;
    }

    if (action === 'details') {
      showToast('Full details view — coming with API wiring.', 'info');
    }
  }

  function confirmReject() {
    if (!rejectTarget) {
      return;
    }
    removeItem(rejectTarget.id);
    showToast(`Rejected — ${rejectTarget.title}`, 'error');
    setRejectTarget(null);
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
              <span className="ap-filter-count">{queueItems.length}</span>
            ) : f.id === 'urgent' ? (
              <span className="ap-filter-count">{queueItems.filter((i) => i.urgency === 'high').length}</span>
            ) : (
              <span className="ap-filter-count">{queueItems.filter((i) => i.urgency === 'normal').length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="ap-queue">
        {items.length === 0 ? (
          <div className="db-empty">
            <p>{queueItems.length === 0 ? 'Your queue is clear.' : 'Nothing in this view.'}</p>
            <p className="db-empty-hint">
              {queueItems.length === 0
                ? 'New drafts will show up here when Onevo generates them.'
                : 'Try another filter or check back when new drafts arrive.'}
            </p>
          </div>
        ) : (
          items.map((item) => (
            <RecommendationCard key={item.id} item={item} onAction={(action) => handleAction(item.id, action)} />
          ))
        )}
      </div>

      <RejectDraftModal
        open={!!rejectTarget}
        title={rejectTarget?.title ?? ''}
        onCancel={() => setRejectTarget(null)}
        onConfirm={confirmReject}
      />

      <ToastAlert toast={toast} />
    </div>
  );
}
