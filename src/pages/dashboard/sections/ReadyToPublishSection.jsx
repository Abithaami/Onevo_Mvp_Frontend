import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  cancelLinkedInSchedule,
  fetchReadyToPublishDrafts,
  mapReadyToPublishDraftRow,
  publishLinkedInContentDraft,
  scheduleLinkedInContentDraft,
} from '../../../features/content/contentDraftsApi.js';
import { formatContentStatusLabel } from '../../../features/content/contentStatusLabels.js';

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

function localScheduleToUtcIso(value) {
  if (!value?.trim()) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function statusLine(statusRaw) {
  const label = formatContentStatusLabel(statusRaw);
  const s = String(statusRaw ?? '')
    .trim()
    .toLowerCase();
  if (s === 'approved') return `${label} — ready to publish or schedule`;
  if (s === 'scheduled') return `${label} — not live yet (waiting for publish time)`;
  return label;
}

/**
 * @param {{
 *   linkedinConnected: boolean,
 *   linkedinLoading: boolean,
 *   onOpenConnections: () => void,
 *   reloadSignal: number,
 *   onPublishingHandoffChanged: () => void,
 * }} props
 */
export default function ReadyToPublishSection({
  linkedinConnected,
  linkedinLoading,
  onOpenConnections,
  reloadSignal,
  onPublishingHandoffChanged,
}) {
  const [rawItems, setRawItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyId, setBusyId] = useState(/** @type {string | null} */ (null));
  /** @type {[Record<string, string>, (v: Record<string, string> | ((p: Record<string, string>) => Record<string, string>)) => void]} */
  const [scheduleLocalById, setScheduleLocalById] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    const r = await fetchReadyToPublishDrafts();
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
  }, [load, reloadSignal]);

  const items = useMemo(
    () => rawItems.map(mapReadyToPublishDraftRow).filter((row) => row && row.id),
    [rawItems],
  );

  const actionsDisabled = !linkedinConnected || linkedinLoading;

  async function handlePublish(id) {
    setBusyId(id);
    setActionError('');
    const r = await publishLinkedInContentDraft(id);
    setBusyId(null);
    if (!r.ok) {
      setActionError(r.error);
      return;
    }
    onPublishingHandoffChanged();
  }

  async function handleSchedule(id) {
    const iso = localScheduleToUtcIso(scheduleLocalById[id]);
    if (!iso) {
      setActionError('Pick a valid date and time for scheduling (local time is sent as UTC to the API).');
      return;
    }
    setBusyId(id);
    setActionError('');
    const r = await scheduleLinkedInContentDraft(id, iso);
    setBusyId(null);
    if (!r.ok) {
      setActionError(r.error);
      return;
    }
    setScheduleLocalById((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    onPublishingHandoffChanged();
  }

  async function handleCancelSchedule(id) {
    setBusyId(id);
    setActionError('');
    const r = await cancelLinkedInSchedule(id);
    setBusyId(null);
    if (!r.ok) {
      setActionError(r.error);
      return;
    }
    onPublishingHandoffChanged();
  }

  return (
    <section className="content-studio-panel" aria-labelledby="cs-ready-title">
      <h2 id="cs-ready-title" className="content-studio-panel__title">
        Ready to publish
      </h2>
      <p className="content-studio-workflow-hint">
        <strong>Draft</strong> needs approval first (Approval queue or below). <strong>Approved</strong> means you can publish or
        schedule here. <strong>Scheduled</strong> is waiting for the set time. <strong>Published</strong> moves to the list
        below — not mixed with this queue.
      </p>

      {linkedinLoading ? (
        <p className="content-studio-muted" role="status">
          Checking LinkedIn…
        </p>
      ) : !linkedinConnected ? (
        <p className="content-studio-muted" role="status">
          Connect LinkedIn to publish or schedule from this list.{' '}
          <button type="button" className="content-studio-linklike" onClick={onOpenConnections}>
            Open Integrations
          </button>
        </p>
      ) : null}

      {loading ? (
        <p className="content-studio-muted" role="status">
          Loading drafts…
        </p>
      ) : null}

      {!loading && fetchError ? (
        <p className="content-studio-error" role="alert">
          {fetchError}
        </p>
      ) : null}

      {!loading && !fetchError && actionError ? (
        <p className="content-studio-error" role="alert">
          {actionError}
        </p>
      ) : null}

      {!loading && !fetchError && items.length === 0 ? (
        <p className="content-studio-muted">
          Nothing here yet. When a draft is approved (in Content Studio or on the Approval page), it shows up here until you
          publish it or schedule it. There is no hidden queue.
        </p>
      ) : null}

      {!loading && !fetchError && items.length > 0 ? (
        <ul className="content-studio-ready-list" role="list">
          {items.map((row) => {
            const st = row.status.trim().toLowerCase();
            const isApproved = st === 'approved';
            const isScheduled = st === 'scheduled';
            const busy = busyId === row.id;

            return (
              <li key={row.id} className="content-studio-ready-item">
                <div className="content-studio-ready-item__head">
                  <strong className="content-studio-ready-item__title">{row.title.trim() || 'Untitled'}</strong>
                  <span className="content-studio-ready-item__ch">{row.channel}</span>
                </div>
                <p className="content-studio-ready-item__status">{statusLine(row.status)}</p>
                {row.bodyPreview ? <p className="content-studio-ready-item__preview">{row.bodyPreview}</p> : null}
                <p className="content-studio-ready-item__meta">
                  Created {formatWhen(row.createdAtUtc)}
                  {row.updatedAtUtc ? <> · Updated {formatWhen(row.updatedAtUtc)}</> : null}
                </p>
                {isScheduled && row.scheduledPublishAtUtc ? (
                  <p className="content-studio-ready-item__schedule">
                    Posts at <strong>{formatWhen(row.scheduledPublishAtUtc)}</strong>
                  </p>
                ) : null}

                <div className="content-studio-ready-item__actions">
                  {isApproved ? (
                    <>
                      <button
                        type="button"
                        className="primary-btn"
                        disabled={actionsDisabled || busy}
                        onClick={() => void handlePublish(row.id)}
                      >
                        {busy ? 'Working…' : 'Publish now'}
                      </button>
                      <div className="content-studio-schedule content-studio-schedule--inline">
                        <label className="content-studio-schedule__label" htmlFor={`cs-ready-sched-${row.id}`}>
                          Schedule
                        </label>
                        <input
                          id={`cs-ready-sched-${row.id}`}
                          type="datetime-local"
                          className="content-studio-input content-studio-schedule__input"
                          value={scheduleLocalById[row.id] ?? ''}
                          onChange={(e) =>
                            setScheduleLocalById((prev) => ({ ...prev, [row.id]: e.target.value }))
                          }
                          disabled={actionsDisabled || busy}
                        />
                        <button
                          type="button"
                          className="secondary-btn"
                          disabled={actionsDisabled || busy || !scheduleLocalById[row.id]}
                          onClick={() => void handleSchedule(row.id)}
                        >
                          {busy ? '…' : 'Schedule'}
                        </button>
                      </div>
                    </>
                  ) : null}
                  {isScheduled ? (
                    <button
                      type="button"
                      className="secondary-btn"
                      disabled={actionsDisabled || busy}
                      onClick={() => void handleCancelSchedule(row.id)}
                    >
                      {busy ? 'Working…' : 'Cancel scheduled publish'}
                    </button>
                  ) : null}
                </div>
                <p className="content-studio-muted content-studio-ready-item__open">
                  <Link
                    className="content-studio-linklike"
                    to={`/app/dashboard/content-studio?draft=${encodeURIComponent(row.id)}`}
                  >
                    Open in Content Studio
                  </Link>{' '}
                  (full text, read-only after approval)
                </p>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
