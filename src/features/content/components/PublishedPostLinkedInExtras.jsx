/**
 * On-demand LinkedIn analytics + performance outcome capture for a published content item.
 */
import { useState } from 'react';
import {
  captureContentPerformanceOutcome,
  fetchLinkedInPostAnalytics,
} from '../contentDraftsApi.js';

/**
 * @param {{ contentItemId: string, linkedInPostUrn: string | null }} props
 */
export default function PublishedPostLinkedInExtras({ contentItemId, linkedInPostUrn }) {
  const [analyticsBusy, setAnalyticsBusy] = useState(false);
  const [analyticsError, setAnalyticsError] = useState('');
  const [analytics, setAnalytics] = useState(null);

  const [captureBusy, setCaptureBusy] = useState(false);
  const [captureError, setCaptureError] = useState('');
  const [captureSuccess, setCaptureSuccess] = useState('');

  async function loadAnalytics() {
    setAnalyticsError('');
    setAnalytics(null);
    setAnalyticsBusy(true);
    const r = await fetchLinkedInPostAnalytics(contentItemId);
    setAnalyticsBusy(false);
    if (!r.ok) {
      setAnalyticsError(r.error);
      return;
    }
    setAnalytics(r.data);
  }

  async function runCapture() {
    setCaptureError('');
    setCaptureSuccess('');
    setCaptureBusy(true);
    const r = await captureContentPerformanceOutcome(contentItemId);
    setCaptureBusy(false);
    if (!r.ok) {
      setCaptureError(r.error);
      return;
    }
    const parts = [];
    if (r.outcomeId) parts.push(`Outcome ${r.outcomeId}`);
    if (r.message) parts.push(r.message);
    setCaptureSuccess(parts.join(' — ') || 'Performance outcome saved.');
  }

  const metricEntries =
    analytics?.metrics && typeof analytics.metrics === 'object'
      ? Object.entries(analytics.metrics).sort(([a], [b]) => a.localeCompare(b))
      : [];

  return (
    <div className="content-studio-published-extras">
      <p className="content-studio-published-extras__label">LinkedIn (this post)</p>
      {!linkedInPostUrn ? (
        <p className="content-studio-muted content-studio-published-extras__hint">
          No LinkedIn post URN on this row yet — analytics may still work if the server resolves the post from the draft.
        </p>
      ) : null}

      <div className="content-studio-published-extras__actions">
        <button
          type="button"
          className="secondary-btn content-studio-published-extras__btn"
          disabled={analyticsBusy}
          onClick={() => void loadAnalytics()}
        >
          {analyticsBusy ? 'Loading analytics…' : 'Load LinkedIn analytics'}
        </button>
        <button
          type="button"
          className="secondary-btn content-studio-published-extras__btn"
          disabled={captureBusy}
          onClick={() => void runCapture()}
        >
          {captureBusy ? 'Capturing…' : 'Capture performance outcome'}
        </button>
      </div>

      {analyticsError ? (
        <p className="content-studio-error content-studio-published-extras__msg" role="alert">
          {analyticsError}
        </p>
      ) : null}

      {analytics && !analyticsError ? (
        <div className="content-studio-published-extras__block" role="region" aria-label="LinkedIn analytics from API">
          {analytics.linkedInPostUrn ? (
            <p className="content-studio-muted content-studio-published-extras__meta">
              Post URN: <span className="content-studio-urn">{analytics.linkedInPostUrn}</span>
            </p>
          ) : null}
          {metricEntries.length > 0 ? (
            <dl className="content-studio-published-metrics">
              {metricEntries.map(([key, val]) => (
                <div key={key} className="content-studio-published-metrics__row">
                  <dt>{key}</dt>
                  <dd>{val}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="content-studio-muted">No metric keys returned for this post.</p>
          )}
          {analytics.message ? <p className="content-studio-muted">{analytics.message}</p> : null}
        </div>
      ) : null}

      {captureError ? (
        <p className="content-studio-error content-studio-published-extras__msg" role="alert">
          {captureError}
        </p>
      ) : null}
      {captureSuccess ? (
        <p className="content-studio-success content-studio-published-extras__msg" role="status">
          {captureSuccess}
        </p>
      ) : null}
    </div>
  );
}
