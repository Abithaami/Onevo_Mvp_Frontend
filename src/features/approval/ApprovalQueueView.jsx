import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ToastAlert from '../../components/auth/ToastAlert.jsx';
import {
  approveContentDraft,
  fetchPendingApprovalDrafts,
  mapPendingApprovalDraftRow,
} from '../content/contentDraftsApi.js';
import { formatContentStatusLabel } from '../content/contentStatusLabels.js';
import './approval.css';

function formatWhen(iso) {
  if (iso == null) return '—';
  try {
    const d = new Date(/** @type {string} */ (iso));
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return '—';
  }
}

export default function ApprovalQueueView() {
  const [rawItems, setRawItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [approvingId, setApprovingId] = useState(null);
  const [approveError, setApproveError] = useState('');
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    setApproveError('');
    const r = await fetchPendingApprovalDrafts();
    setLoading(false);
    if (!r.ok) {
      setFetchError(r.error);
      setRawItems([]);
      return;
    }
    setRawItems(r.items);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }
    const t = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const items = useMemo(
    () => rawItems.map(mapPendingApprovalDraftRow).filter((row) => row && row.id),
    [rawItems],
  );

  function showToast(message, type = 'info') {
    setToast({ message, type });
  }

  async function handleApprove(id) {
    setApprovingId(id);
    setApproveError('');
    const r = await approveContentDraft(id);
    setApprovingId(null);
    if (!r.ok) {
      setApproveError(r.error);
      return;
    }
    setRawItems((prev) => prev.filter((row) => String(row.id ?? row.Id) !== id));
    showToast('Draft approved. In Content Studio, use Ready to publish to post or schedule.', 'success');
  }

  return (
    <div className="ap-page">
      <header className="ap-page-header">
        <h1 className="ap-page-title">Approval queue</h1>
        <p className="ap-page-lead">
          LinkedIn drafts with status <strong>Draft</strong> appear here. Approve to move them to <strong>Approved</strong>,
          then publish or schedule from Content Studio (Ready to publish).
        </p>
      </header>

      <div className="ap-toolbar" role="toolbar" aria-label="Queue actions">
        <span className="ap-pending-label">
          Pending
          <span className="ap-filter-count" aria-live="polite">
            {loading ? '…' : items.length}
          </span>
        </span>
        <button type="button" className="ap-filter" onClick={() => void load()} disabled={loading}>
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="ap-status" role="status">
          Loading approval queue…
        </p>
      ) : null}

      {!loading && fetchError ? (
        <p className="ap-error" role="alert">
          {fetchError}
        </p>
      ) : null}

      {!loading && !fetchError && approveError ? (
        <p className="ap-error" role="alert">
          {approveError}
        </p>
      ) : null}

      {!loading && !fetchError && items.length === 0 ? (
        <div className="db-empty">
          <p>Nothing waiting for approval.</p>
          <p className="db-empty-hint">
            Create a LinkedIn draft in{' '}
            <Link className="ap-inline-link" to="/app/dashboard/content-studio">
              Content Studio
            </Link>
            . It will show up here until you approve it.
          </p>
        </div>
      ) : null}

      {!loading && !fetchError && items.length > 0 ? (
        <div className="ap-queue">
          {items.map((item) => (
            <article key={item.id} className="ap-draft-card">
              <div className="ap-draft-card__head">
                <strong className="ap-draft-card__title">{item.title.trim() || 'Untitled'}</strong>
                <span className="ap-draft-card__ch">{item.channel}</span>
              </div>
              {item.bodyPreview ? <p className="ap-draft-card__preview">{item.bodyPreview}</p> : null}
              <p className="ap-draft-card__meta">
                Created {formatWhen(item.createdAtUtc)} · Status: {formatContentStatusLabel(item.status)}
              </p>
              <div className="ap-draft-card__actions">
                <button
                  type="button"
                  className="ap-draft-card__approve"
                  onClick={() => void handleApprove(item.id)}
                  disabled={approvingId === item.id}
                >
                  {approvingId === item.id ? 'Approving…' : 'Approve'}
                </button>
                <Link
                  className="ap-inline-link"
                  to={`/app/dashboard/content-studio?draft=${encodeURIComponent(item.id)}`}
                >
                  Open in Content Studio
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <ToastAlert toast={toast} />
    </div>
  );
}
