/**
 * Manual comment-intent scan + recent alerts from LinkedIn integration APIs.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  fetchLinkedInCommentIntentAlerts,
  runLinkedInCommentIntentScan,
} from '../linkedinIntegrationApi.js';

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

export default function LinkedInCommentIntentSection() {
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alertsError, setAlertsError] = useState('');
  const [alerts, setAlerts] = useState([]);

  const [scanBusy, setScanBusy] = useState(false);
  const [scanError, setScanError] = useState('');
  /** @type {{ postsScanned: number, commentsProcessed: number, duplicatesSkipped: number, highIntentAlertsCreated: number, message: string } | null} */
  const [lastScanSummary, setLastScanSummary] = useState(null);

  const loadAlerts = useCallback(async () => {
    setAlertsLoading(true);
    setAlertsError('');
    const r = await fetchLinkedInCommentIntentAlerts();
    setAlertsLoading(false);
    if (r.ok) {
      setAlerts(r.alerts);
    } else {
      setAlertsError(r.error);
      setAlerts([]);
    }
  }, []);

  useEffect(() => {
    void loadAlerts();
  }, [loadAlerts]);

  async function handleScan() {
    setScanError('');
    setLastScanSummary(null);
    setScanBusy(true);
    const r = await runLinkedInCommentIntentScan();
    setScanBusy(false);
    if (!r.ok) {
      setScanError(r.error);
      return;
    }
    setLastScanSummary({
      postsScanned: r.scan.postsScanned,
      commentsProcessed: r.scan.commentsProcessed,
      duplicatesSkipped: r.scan.duplicatesSkipped,
      highIntentAlertsCreated: r.scan.highIntentAlertsCreated,
      message: r.scan.message,
    });
    void loadAlerts();
  }

  return (
    <section className="int-comment-intent" aria-labelledby="int-comment-intent-title">
      <h2 id="int-comment-intent-title" className="int-comment-intent__title">
        LinkedIn comment intent
      </h2>
      <p className="int-comment-intent__lede">
        Run a manual scan to fetch comments on your published LinkedIn posts and surface high-intent replies. This is an
        on-demand action — nothing runs in the background unless you trigger it here.
      </p>

      <div className="int-comment-intent__actions">
        <button type="button" className="int-btn int-btn--secondary" disabled={scanBusy} onClick={() => void handleScan()}>
          {scanBusy ? 'Scanning…' : 'Run comment-intent scan'}
        </button>
        <button
          type="button"
          className="int-btn int-btn--ghost"
          disabled={alertsLoading}
          onClick={() => void loadAlerts()}
        >
          {alertsLoading ? 'Refreshing alerts…' : 'Refresh alerts'}
        </button>
      </div>

      {scanError ? (
        <p className="int-card-detail" role="alert">
          Scan failed: {scanError}
        </p>
      ) : null}

      {lastScanSummary ? (
        <div className="int-comment-intent__scan-result" role="status">
          <strong>Last scan</strong>
          <ul className="int-comment-intent__scan-list">
            <li>Posts scanned: {lastScanSummary.postsScanned}</li>
            <li>Comments processed: {lastScanSummary.commentsProcessed}</li>
            <li>Duplicates skipped: {lastScanSummary.duplicatesSkipped}</li>
            <li>High-intent alerts created: {lastScanSummary.highIntentAlertsCreated}</li>
            {lastScanSummary.message ? <li>{lastScanSummary.message}</li> : null}
          </ul>
        </div>
      ) : null}

      <h3 className="int-comment-intent__subheading">Recent alerts</h3>
      {alertsError ? (
        <p className="int-card-detail" role="alert">
          Could not load alerts: {alertsError}
        </p>
      ) : null}
      {alertsLoading && !alertsError ? (
        <p className="int-card-placeholder-msg" role="status">
          Loading alerts…
        </p>
      ) : null}
      {!alertsLoading && !alertsError && alerts.length === 0 ? (
        <p className="int-card-placeholder-msg">No comment-intent alerts yet.</p>
      ) : null}
      {!alertsLoading && alerts.length > 0 ? (
        <ul className="int-comment-intent__alert-list" role="list">
          {alerts.map((a) => (
            <li key={a.id} className="int-comment-intent__alert">
              <p className="int-comment-intent__alert-text">{a.commentText || '(empty comment)'}</p>
              <dl className="int-comment-intent__alert-meta">
                {a.intentLabel ? (
                  <div>
                    <dt>Label</dt>
                    <dd>{a.intentLabel}</dd>
                  </div>
                ) : null}
                {a.intentScore != null && Number.isFinite(a.intentScore) ? (
                  <div>
                    <dt>Intent score</dt>
                    <dd>{a.intentScore}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Processed</dt>
                  <dd>{formatWhen(a.processedAtUtc)}</dd>
                </div>
                {a.linkedInPostUrn ? (
                  <div>
                    <dt>Post URN</dt>
                    <dd className="int-comment-intent__urn">{a.linkedInPostUrn}</dd>
                  </div>
                ) : null}
                {a.contentItemId ? (
                  <div>
                    <dt>Content item</dt>
                    <dd className="int-comment-intent__mono">{a.contentItemId}</dd>
                  </div>
                ) : null}
                {a.notificationId ? (
                  <div>
                    <dt>Notification</dt>
                    <dd className="int-comment-intent__mono">{a.notificationId}</dd>
                  </div>
                ) : null}
              </dl>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
