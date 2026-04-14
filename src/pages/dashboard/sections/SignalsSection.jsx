/**
 * MVP signal ingest: POST /api/signals/ingest. Displays only API response fields on success.
 */
import { useMemo, useState } from 'react';
import { postIngestSignal } from '../../../features/signals/signalsApi.js';
import './content-studio.css';

function defaultOccurredIso() {
  try {
    return new Date().toISOString();
  } catch {
    return '';
  }
}

export default function SignalsSection() {
  const [sourceType, setSourceType] = useState('');
  const [signalType, setSignalType] = useState('');
  const [payloadJson, setPayloadJson] = useState('{}');
  const [occurredAtUtc, setOccurredAtUtc] = useState(() => defaultOccurredIso());
  const [correlationId, setCorrelationId] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [parseError, setParseError] = useState('');
  const [apiError, setApiError] = useState('');
  const [lastResult, setLastResult] = useState(null);

  const canSubmit = useMemo(() => {
    return Boolean(sourceType.trim() && signalType.trim() && occurredAtUtc.trim()) && !submitting;
  }, [sourceType, signalType, occurredAtUtc, submitting]);

  async function handleSubmit(e) {
    e.preventDefault();
    setParseError('');
    setApiError('');
    setLastResult(null);

    let payload = /** @type {Record<string, unknown>} */ ({});
    const raw = payloadJson.trim() || '{}';
    try {
      const parsed = JSON.parse(raw);
      if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        setParseError('Payload must be a JSON object (e.g. {}).');
        return;
      }
      payload = /** @type {Record<string, unknown>} */ (parsed);
    } catch {
      setParseError('Payload must be valid JSON.');
      return;
    }

    setSubmitting(true);
    const r = await postIngestSignal({
      sourceType,
      signalType,
      payload,
      occurredAtUtc,
      correlationId: correlationId.trim() || null,
    });
    setSubmitting(false);

    if (!r.ok) {
      setApiError(r.error);
      return;
    }
    setLastResult(r.data);
  }

  return (
    <div className="content-studio">
      <header className="content-studio__header">
        <h1 className="content-studio__title">Signals</h1>
        <p className="content-studio__lede">
          Ingest a single signal event for your tenant. Fields match the API contract; the response below is exactly what the
          server returns — nothing is invented client-side.
        </p>
      </header>

      <section className="content-studio-panel" aria-labelledby="sig-ingest-title">
        <h2 id="sig-ingest-title" className="content-studio-panel__title">
          Ingest signal
        </h2>

        <form className="content-studio-form" onSubmit={(e) => void handleSubmit(e)}>
          <div className="content-studio-field">
            <label htmlFor="sig-source-type">Source type</label>
            <input
              id="sig-source-type"
              className="content-studio-input"
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              autoComplete="off"
              placeholder="e.g. linkedin, manual"
              disabled={submitting}
              required
            />
          </div>
          <div className="content-studio-field">
            <label htmlFor="sig-signal-type">Signal type</label>
            <input
              id="sig-signal-type"
              className="content-studio-input"
              value={signalType}
              onChange={(e) => setSignalType(e.target.value)}
              autoComplete="off"
              placeholder="e.g. engagement, comment"
              disabled={submitting}
              required
            />
          </div>
          <div className="content-studio-field">
            <label htmlFor="sig-payload">Payload (JSON object)</label>
            <textarea
              id="sig-payload"
              className="content-studio-textarea"
              rows={6}
              value={payloadJson}
              onChange={(e) => setPayloadJson(e.target.value)}
              spellCheck={false}
              disabled={submitting}
            />
          </div>
          <div className="content-studio-field">
            <label htmlFor="sig-occurred">Occurred at (UTC, ISO 8601)</label>
            <input
              id="sig-occurred"
              className="content-studio-input"
              value={occurredAtUtc}
              onChange={(e) => setOccurredAtUtc(e.target.value)}
              autoComplete="off"
              disabled={submitting}
              required
            />
            <p className="content-studio-hint">Example: {defaultOccurredIso()}</p>
          </div>
          <div className="content-studio-field">
            <label htmlFor="sig-correlation">Correlation id (optional)</label>
            <input
              id="sig-correlation"
              className="content-studio-input"
              value={correlationId}
              onChange={(e) => setCorrelationId(e.target.value)}
              autoComplete="off"
              disabled={submitting}
            />
          </div>

          {parseError ? (
            <p className="content-studio-error" role="alert">
              {parseError}
            </p>
          ) : null}

          <div className="content-studio-actions">
            <button type="submit" className="primary-btn" disabled={!canSubmit}>
              {submitting ? 'Submitting…' : 'Submit ingest'}
            </button>
          </div>
        </form>

        {apiError ? (
          <p className="content-studio-error" role="alert">
            {apiError}
          </p>
        ) : null}

        {lastResult ? (
          <div className="content-studio-readonly" role="status" aria-label="Ingest response">
            <p className="content-studio-readonly__label">Response</p>
            <dl style={{ margin: 'var(--spacing-sm) 0 0', display: 'grid', gap: 'var(--spacing-sm)' }}>
              <div>
                <dt className="content-studio-readonly__label">signalEventId</dt>
                <dd className="content-studio-readonly__text content-studio-code">{lastResult.signalEventId || '—'}</dd>
              </div>
              <div>
                <dt className="content-studio-readonly__label">correlationId</dt>
                <dd className="content-studio-readonly__text content-studio-code">{lastResult.correlationId || '—'}</dd>
              </div>
              <div>
                <dt className="content-studio-readonly__label">status</dt>
                <dd className="content-studio-readonly__text">{lastResult.status || '—'}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </section>
    </div>
  );
}
