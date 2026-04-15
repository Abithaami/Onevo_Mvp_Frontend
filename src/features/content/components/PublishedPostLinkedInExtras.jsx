/**
 * On-demand LinkedIn analytics + performance outcome capture for a published content item.
 * Published Posts can temporarily disable analytics (coming soon) and offer manual hide-from-list.
 */
import { useState } from 'react';
import {
  captureContentPerformanceOutcome,
  fetchLinkedInPostAnalytics,
  hidePublishedLinkedInPostFromFeed,
} from '../contentDraftsApi.js';

/**
 * @param {{
 *   contentItemId: string,
 *   linkedInPostUrn: string | null,
 *   linkedInLiveAnalyticsAllowed?: boolean,
 *   analyticsDisabledReason?: string,
 *   analyticsComingSoon?: boolean,
 *   onPostHidden?: () => void,
 * }} props
 */
export default function PublishedPostLinkedInExtras({
  contentItemId,
  linkedInPostUrn,
  linkedInLiveAnalyticsAllowed = false,
  analyticsDisabledReason: _analyticsDisabledReason = '',
  analyticsComingSoon = false,
  onPostHidden,
}) {
  const [analyticsBusy, setAnalyticsBusy] = useState(false);
  const [analyticsError, setAnalyticsError] = useState('');
  const [analytics, setAnalytics] = useState(null);

  const [captureBusy, setCaptureBusy] = useState(false);
  const [captureError, setCaptureError] = useState('');
  const [captureSuccess, setCaptureSuccess] = useState('');

  const [hideBusy, setHideBusy] = useState(false);
  const [hideError, setHideError] = useState('');

  const analyticsShelfLocked = Boolean(analyticsComingSoon);
  /** Show coming-soon shelf even if parent omits `analyticsComingSoon` but analytics is not ready to use. */
  const showComingSoonShelf = analyticsShelfLocked || !linkedInLiveAnalyticsAllowed;
  const analyticsActionsDisabled =
    showComingSoonShelf || analyticsBusy || captureBusy || !linkedInLiveAnalyticsAllowed;
  const actionTitle = analyticsBusy
    ? 'Loading…'
    : captureBusy
      ? 'Capturing…'
      : analyticsActionsDisabled
        ? 'Coming soon'
        : undefined;

  async function loadAnalytics() {
    if (analyticsActionsDisabled) {
      return;
    }
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
    if (analyticsActionsDisabled) {
      return;
    }
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

  async function runHideFromUi() {
    setHideError('');
    setHideBusy(true);
    const r = await hidePublishedLinkedInPostFromFeed(contentItemId);
    setHideBusy(false);
    if (!r.ok) {
      setHideError(r.error);
      return;
    }
    onPostHidden?.();
  }

  const metricEntries =
    analytics?.metrics && typeof analytics.metrics === 'object'
      ? Object.entries(analytics.metrics).sort(([a], [b]) => a.localeCompare(b))
      : [];

  const analyticsBody = (
    <>
      <div className="content-studio-published-extras__actions">
        <button
          type="button"
          className="secondary-btn content-studio-published-extras__btn"
          disabled={analyticsBusy || analyticsActionsDisabled}
          title={actionTitle}
          tabIndex={showComingSoonShelf ? -1 : undefined}
          onClick={() => {
            if (analyticsActionsDisabled) return;
            void loadAnalytics();
          }}
        >
          {analyticsBusy ? 'Loading analytics…' : 'Load LinkedIn analytics'}
        </button>
        <button
          type="button"
          className="secondary-btn content-studio-published-extras__btn"
          disabled={captureBusy || analyticsActionsDisabled}
          title={actionTitle}
          tabIndex={showComingSoonShelf ? -1 : undefined}
          onClick={() => {
            if (analyticsActionsDisabled) return;
            void runCapture();
          }}
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
    </>
  );

  return (
    <div className="content-studio-published-extras">
      <p className="content-studio-published-extras__label">LinkedIn (this post)</p>
      {!linkedInPostUrn ? (
        <p className="content-studio-muted content-studio-published-extras__hint">
          No LinkedIn post URN on this row yet — analytics may still work if the server resolves the post from the draft.
        </p>
      ) : null}

      <div className="content-studio-published-extras__hide-row">
        <button
          type="button"
          className="secondary-btn content-studio-published-extras__hide-btn"
          disabled={hideBusy}
          onClick={() => void runHideFromUi()}
        >
          {hideBusy ? 'Deleting…' : 'Delete'}
        </button>
        <p className="content-studio-muted content-studio-published-extras__hide-hint">
          Removes this post from the default list. ONEVO keeps your copy and publish history.
        </p>
      </div>
      {hideError ? (
        <p className="content-studio-error content-studio-published-extras__msg" role="alert">
          {hideError}
        </p>
      ) : null}

      {showComingSoonShelf ? (
        <p className="content-studio-analytics-coming-soon-label" role="status">
          Coming soon
        </p>
      ) : (
        analyticsBody
      )}
    </div>
  );
}
