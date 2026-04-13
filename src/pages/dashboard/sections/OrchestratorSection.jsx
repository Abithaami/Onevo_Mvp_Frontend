/**
 * MVP orchestrator tools: route, plan, run lookup, generated images (read + delete).
 * All data comes from API responses — nothing synthesized client-side.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  deleteOrchestratorImage,
  fetchOrchestratorImages,
  getOrchestrationRun,
  postOrchestratorPlan,
  postOrchestratorRoute,
} from '../../../features/orchestrator/orchestratorApi.js';
import './content-studio.css';
import './orchestrator.css';

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

function RoutingPlanBlock({ plan }) {
  if (!plan) return null;
  return (
    <div className="orch-block">
      <p className="orch-block__summary">{plan.summary || '—'}</p>
      <dl className="orch-dl">
        <div>
          <dt>Primary handoff</dt>
          <dd>
            {plan.primaryHandoff.agentName || '—'}
            {plan.primaryHandoff.rationale ? (
              <span className="orch-muted"> — {plan.primaryHandoff.rationale}</span>
            ) : null}
          </dd>
        </div>
        {plan.additionalAgents?.length ? (
          <div>
            <dt>Additional agents</dt>
            <dd>
              <ul className="orch-list-plain">
                {plan.additionalAgents.map((a, i) => (
                  <li key={`${a.agentName}-${i}`}>
                    <strong>{a.agentName || '—'}</strong>
                    {a.rationale ? <span className="orch-muted"> — {a.rationale}</span> : null}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ) : null}
        {plan.suggestedSequence?.length ? (
          <div>
            <dt>Suggested sequence</dt>
            <dd>{plan.suggestedSequence.join(' → ')}</dd>
          </div>
        ) : null}
        {plan.notesOrRisks ? (
          <div>
            <dt>Notes / risks</dt>
            <dd>{plan.notesOrRisks}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

export default function OrchestratorSection() {
  const [message, setMessage] = useState('');

  const [routeBusy, setRouteBusy] = useState(false);
  const [routeError, setRouteError] = useState('');
  const [workflow, setWorkflow] = useState(null);

  const [planBusy, setPlanBusy] = useState(false);
  const [planError, setPlanError] = useState('');
  const [planOnly, setPlanOnly] = useState(null);

  const [runIdInput, setRunIdInput] = useState('');
  const [runBusy, setRunBusy] = useState(false);
  const [runError, setRunError] = useState('');
  const [runDetail, setRunDetail] = useState(null);

  const [imagesLoading, setImagesLoading] = useState(true);
  const [imagesError, setImagesError] = useState('');
  const [images, setImages] = useState([]);
  const [deletingId, setDeletingId] = useState('');

  const loadImages = useCallback(async () => {
    setImagesLoading(true);
    setImagesError('');
    const r = await fetchOrchestratorImages({ take: 40 });
    setImagesLoading(false);
    if (r.ok) {
      setImages(r.items);
    } else {
      setImagesError(r.error);
      setImages([]);
    }
  }, []);

  useEffect(() => {
    void loadImages();
  }, [loadImages]);

  async function handleRoute() {
    setRouteError('');
    setWorkflow(null);
    setRouteBusy(true);
    const r = await postOrchestratorRoute(message);
    setRouteBusy(false);
    if (!r.ok) {
      setRouteError(r.error);
      return;
    }
    setWorkflow(r.data);
    if (r.data.runId) {
      setRunIdInput(r.data.runId);
    }
  }

  async function handlePlanOnly() {
    setPlanError('');
    setPlanOnly(null);
    setPlanBusy(true);
    const r = await postOrchestratorPlan(message);
    setPlanBusy(false);
    if (!r.ok) {
      setPlanError(r.error);
      return;
    }
    setPlanOnly(r.data);
  }

  async function handleFetchRun() {
    setRunError('');
    setRunDetail(null);
    setRunBusy(true);
    const r = await getOrchestrationRun(runIdInput);
    setRunBusy(false);
    if (!r.ok) {
      setRunError(r.error);
      return;
    }
    setRunDetail(r.data);
  }

  async function handleDeleteImage(id) {
    if (!window.confirm('Delete this generated image? This cannot be undone.')) {
      return;
    }
    setDeletingId(id);
    const r = await deleteOrchestratorImage(id);
    setDeletingId('');
    if (!r.ok) {
      setImagesError(r.error);
      return;
    }
    setImages((prev) => prev.filter((x) => x.id !== id));
    setImagesError('');
  }

  const busy = routeBusy || planBusy;

  return (
    <div className="content-studio">
      <header className="content-studio__header">
        <h1 className="content-studio__title">Orchestrator</h1>
        <p className="content-studio__lede">
          Run routing and full workflows against the real orchestrator API. Responses and images below are exactly what the
          server returns — nothing is simulated in the browser.
        </p>
      </header>

      <section className="content-studio-panel" aria-labelledby="orch-actions-title">
        <h2 id="orch-actions-title" className="content-studio-panel__title">
          Route &amp; plan
        </h2>
        <p className="content-studio-muted">
          <strong>Run full route</strong> persists a run and executes specialist handoffs. <strong>Routing plan only</strong>{' '}
          returns an LLM routing JSON plan without creating a run.
        </p>
        <div className="content-studio-field">
          <label htmlFor="orch-message">Message</label>
          <textarea
            id="orch-message"
            className="content-studio-textarea"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe what you want the orchestrator to handle…"
            disabled={busy}
          />
        </div>
        <div className="content-studio-actions">
          <button type="button" className="primary-btn" disabled={busy} onClick={() => void handleRoute()}>
            {routeBusy ? 'Running workflow…' : 'Run full route (workflow)'}
          </button>
          <button type="button" className="secondary-btn" disabled={busy} onClick={() => void handlePlanOnly()}>
            {planBusy ? 'Getting plan…' : 'Routing plan only'}
          </button>
        </div>
        {routeError ? (
          <p className="content-studio-error" role="alert">
            {routeError}
          </p>
        ) : null}
        {planError ? (
          <p className="content-studio-error" role="alert">
            {planError}
          </p>
        ) : null}
      </section>

      {workflow ? (
        <section className="content-studio-panel" aria-labelledby="orch-wf-title">
          <h2 id="orch-wf-title" className="content-studio-panel__title">
            Last workflow result
          </h2>
          <dl className="orch-dl orch-dl--compact">
            <div>
              <dt>Run id</dt>
              <dd className="orch-mono">{workflow.runId}</dd>
            </div>
            <div>
              <dt>Correlation id</dt>
              <dd className="orch-mono">{workflow.correlationId}</dd>
            </div>
            <div>
              <dt>Routing attempts used</dt>
              <dd>{workflow.routingAttemptsUsed}</dd>
            </div>
          </dl>
          <h3 className="orch-subheading">Routing plan</h3>
          <RoutingPlanBlock plan={workflow.routingPlan} />
          {workflow.handoffs?.length ? (
            <>
              <h3 className="orch-subheading">Specialist handoffs</h3>
              <ul className="orch-handoff-list">
                {workflow.handoffs.map((h, i) => (
                  <li key={`${h.agentName}-${i}`} className="orch-handoff">
                    <strong>{h.agentName || '—'}</strong>
                    <span className="orch-tag">{h.status || '—'}</span>
                    <p className="orch-handoff__summary">{h.resultSummary || '—'}</p>
                    {h.structuredJson ? (
                      <details className="orch-details">
                        <summary>Structured JSON</summary>
                        <pre className="content-studio-pre">{h.structuredJson}</pre>
                      </details>
                    ) : null}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="content-studio-muted">No handoff rows in this response.</p>
          )}
          {workflow.finalOrchestratorResponse ? (
            <>
              <h3 className="orch-subheading">Final orchestrator response</h3>
              <pre className="content-studio-pre">{workflow.finalOrchestratorResponse}</pre>
            </>
          ) : null}
          {workflow.orchestratorLearningSummaryJson ? (
            <>
              <h3 className="orch-subheading">Orchestrator learning summary (JSON)</h3>
              <pre className="content-studio-pre">{workflow.orchestratorLearningSummaryJson}</pre>
            </>
          ) : null}
        </section>
      ) : null}

      {planOnly ? (
        <section className="content-studio-panel" aria-labelledby="orch-plan-title">
          <h2 id="orch-plan-title" className="content-studio-panel__title">
            Last routing plan (plan-only)
          </h2>
          <p className="content-studio-muted">
            Attempts used: <strong>{planOnly.attemptsUsed}</strong>
          </p>
          <RoutingPlanBlock plan={planOnly.plan} />
        </section>
      ) : null}

      <section className="content-studio-panel" aria-labelledby="orch-run-title">
        <h2 id="orch-run-title" className="content-studio-panel__title">
          Run details
        </h2>
        <p className="content-studio-muted">
          Fetch a persisted orchestration run by id (use the run id from a successful workflow, or paste a known id).
        </p>
        <div className="orch-run-row">
          <label htmlFor="orch-run-id" className="visually-hidden">
            Run id
          </label>
          <input
            id="orch-run-id"
            className="content-studio-input orch-run-input"
            value={runIdInput}
            onChange={(e) => setRunIdInput(e.target.value)}
            placeholder="Run GUID"
            disabled={runBusy}
          />
          <button type="button" className="secondary-btn" disabled={runBusy} onClick={() => void handleFetchRun()}>
            {runBusy ? 'Loading…' : 'Fetch run'}
          </button>
        </div>
        {runError ? (
          <p className="content-studio-error" role="alert">
            {runError}
          </p>
        ) : null}
        {runDetail ? (
          <div className="orch-run-detail">
            <dl className="orch-dl">
              <div>
                <dt>Status</dt>
                <dd>{runDetail.status}</dd>
              </div>
              <div>
                <dt>Initiated by</dt>
                <dd>{runDetail.initiatedByAgentRole}</dd>
              </div>
              <div>
                <dt>User message</dt>
                <dd className="orch-pre-wrap">{runDetail.userMessage || '—'}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{formatWhen(runDetail.createdAtUtc)}</dd>
              </div>
              <div>
                <dt>Completed</dt>
                <dd>{formatWhen(runDetail.completedAtUtc)}</dd>
              </div>
              <div>
                <dt>Routing attempts</dt>
                <dd>{runDetail.routingAttemptCount}</dd>
              </div>
              {runDetail.lastRoutingError ? (
                <div>
                  <dt>Last routing error</dt>
                  <dd>{runDetail.lastRoutingError}</dd>
                </div>
              ) : null}
              {runDetail.failureReason ? (
                <div>
                  <dt>Failure reason</dt>
                  <dd>{runDetail.failureReason}</dd>
                </div>
              ) : null}
            </dl>
            <h3 className="orch-subheading">Routing plan (stored JSON)</h3>
            <pre className="content-studio-pre">{runDetail.routingPlanJson || '—'}</pre>
            {runDetail.finalOrchestratorResponse ? (
              <>
                <h3 className="orch-subheading">Final orchestrator response</h3>
                <pre className="content-studio-pre">{runDetail.finalOrchestratorResponse}</pre>
              </>
            ) : null}
            {runDetail.steps?.length ? (
              <>
                <h3 className="orch-subheading">Steps</h3>
                <ul className="orch-step-list">
                  {runDetail.steps.map((s) => (
                    <li key={s.stepOrder} className="orch-step">
                      <div className="orch-step__head">
                        <strong>Step {s.stepOrder}</strong>
                        <span className="orch-tag">{s.status}</span>
                      </div>
                      <p className="orch-muted">
                        {s.agentName}
                        {s.specialistAgentRole ? ` · ${s.specialistAgentRole}` : ''}
                      </p>
                      {s.lastHandoffError ? <p className="content-studio-error">Handoff error: {s.lastHandoffError}</p> : null}
                      {s.handoffResult ? (
                        <details className="orch-details">
                          <summary>Handoff result</summary>
                          <pre className="content-studio-pre">{s.handoffResult}</pre>
                        </details>
                      ) : null}
                      <p className="orch-muted orch-step__time">
                        {formatWhen(s.startedAtUtc)} — {formatWhen(s.completedAtUtc)}
                      </p>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="content-studio-muted">No steps on this run.</p>
            )}
          </div>
        ) : null}
      </section>

      <section className="content-studio-panel" aria-labelledby="orch-img-title">
        <h2 id="orch-img-title" className="content-studio-panel__title">
          Generated images
        </h2>
        <div className="content-studio-actions">
          <button type="button" className="secondary-btn content-studio__refresh" onClick={() => void loadImages()} disabled={imagesLoading}>
            {imagesLoading ? 'Loading…' : 'Refresh list'}
          </button>
        </div>
        {imagesError ? (
          <p className="content-studio-error" role="alert">
            {imagesError}
          </p>
        ) : null}
        {imagesLoading ? (
          <p className="content-studio-muted" role="status">
            Loading images…
          </p>
        ) : null}
        {!imagesLoading && !imagesError && images.length === 0 ? (
          <p className="content-studio-muted">No generated images yet.</p>
        ) : null}
        {!imagesLoading && images.length > 0 ? (
          <ul className="orch-image-grid" role="list">
            {images.map((img) => (
              <li key={img.id} className="orch-image-card">
                <div className="orch-image-card__thumb">
                  {img.imageUrl ? (
                    <img src={img.imageUrl} alt="" loading="lazy" width={200} height={200} />
                  ) : (
                    <span className="orch-muted">No URL</span>
                  )}
                </div>
                <dl className="orch-image-meta">
                  <div>
                    <dt>State</dt>
                    <dd>{img.contentState}</dd>
                  </div>
                  <div>
                    <dt>Channel</dt>
                    <dd>{img.channel}</dd>
                  </div>
                  <div>
                    <dt>Created</dt>
                    <dd>{formatWhen(img.createdAtUtc)}</dd>
                  </div>
                  {img.orchestrationRunId ? (
                    <div>
                      <dt>Run id</dt>
                      <dd className="orch-mono">{img.orchestrationRunId}</dd>
                    </div>
                  ) : null}
                  {img.cloudinaryPublicId ? (
                    <div>
                      <dt>Cloudinary id</dt>
                      <dd className="orch-mono">{img.cloudinaryPublicId}</dd>
                    </div>
                  ) : null}
                </dl>
                <button
                  type="button"
                  className="secondary-btn orch-image-del"
                  disabled={deletingId === img.id}
                  onClick={() => void handleDeleteImage(img.id)}
                >
                  {deletingId === img.id ? 'Deleting…' : 'Delete'}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
