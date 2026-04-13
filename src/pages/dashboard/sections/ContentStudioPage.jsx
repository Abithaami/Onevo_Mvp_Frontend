import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  approveContentDraft,
  cancelLinkedInSchedule,
  createContentDraft,
  fetchContentDraftById,
  fetchPublishedPosts,
  mapContentDraftDetail,
  publishLinkedInContentDraft,
  scheduleLinkedInContentDraft,
  updateContentDraft,
} from '../../../features/content/contentDraftsApi.js';
import { formatContentStatusLabel } from '../../../features/content/contentStatusLabels.js';
import { fetchLinkedInStatus } from '../../../features/integrations/linkedinIntegrationApi.js';
import PublishedPostsList from './PublishedPostsList.jsx';
import ReadyToPublishSection from './ReadyToPublishSection.jsx';
import './content-studio.css';

/**
 * @param {string | undefined} status
 * @returns {'idle'|'created'|'approved'|'scheduled'|'published'}
 */
function phaseFromStatus(status) {
  const s = String(status ?? '')
    .trim()
    .toLowerCase();
  if (s === 'draft') return 'created';
  if (s === 'approved') return 'approved';
  if (s === 'scheduled') return 'scheduled';
  if (s === 'published') return 'published';
  return 'created';
}

/**
 * @param {{ onOpenConnections: () => void }} props
 */
export default function ContentStudioPage({ onOpenConnections }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [title, setTitle] = useState('');
  const [bodyText, setBodyText] = useState('');

  const [linkedinLoading, setLinkedinLoading] = useState(true);
  const [linkedinConnected, setLinkedinConnected] = useState(false);
  const [linkedinStatusError, setLinkedinStatusError] = useState('');

  const [phase, setPhase] = useState(/** @type {'idle'|'created'|'approved'|'scheduled'|'published'} */ ('idle'));
  const [contentItemId, setContentItemId] = useState('');
  const [draftStatusLabel, setDraftStatusLabel] = useState('');
  const [draftCanEdit, setDraftCanEdit] = useState(false);

  const [createBusy, setCreateBusy] = useState(false);
  const [approveBusy, setApproveBusy] = useState(false);
  const [publishBusy, setPublishBusy] = useState(false);
  const [scheduleBusy, setScheduleBusy] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [saveEditBusy, setSaveEditBusy] = useState(false);

  const [openDraftIdInput, setOpenDraftIdInput] = useState('');
  const [loadDraftBusy, setLoadDraftBusy] = useState(false);
  const [loadDraftError, setLoadDraftError] = useState('');

  const [scheduleLocal, setScheduleLocal] = useState('');

  const [actionError, setActionError] = useState('');
  const [successLine, setSuccessLine] = useState('');

  const [publishedItems, setPublishedItems] = useState(/** @type {unknown[]} */ ([]));
  const [publishedLoading, setPublishedLoading] = useState(true);
  const [publishedError, setPublishedError] = useState('');

  /** Bumps Ready to publish + refreshes published list after workflow changes. */
  const [readyReloadSignal, setReadyReloadSignal] = useState(0);

  const refreshLinkedIn = useCallback(async () => {
    setLinkedinLoading(true);
    setLinkedinStatusError('');
    const r = await fetchLinkedInStatus();
    setLinkedinLoading(false);
    if (r.ok) {
      setLinkedinConnected(r.status.isConnected);
    } else {
      setLinkedinConnected(false);
      setLinkedinStatusError(r.error);
    }
  }, []);

  const refreshPublished = useCallback(async () => {
    setPublishedLoading(true);
    setPublishedError('');
    const r = await fetchPublishedPosts();
    setPublishedLoading(false);
    if (r.ok) {
      setPublishedItems(r.items);
    } else {
      setPublishedError(r.error);
      setPublishedItems([]);
    }
  }, []);

  const syncPublishingState = useCallback(() => {
    setReadyReloadSignal((s) => s + 1);
    void refreshPublished();
  }, [refreshPublished]);

  useEffect(() => {
    void refreshLinkedIn();
    void refreshPublished();
  }, [refreshLinkedIn, refreshPublished]);

  const loadDraftById = useCallback(async (rawId) => {
    const trimmed = rawId?.trim();
    if (!trimmed) {
      setLoadDraftError('Enter a draft id.');
      return;
    }
    setLoadDraftBusy(true);
    setLoadDraftError('');
    setActionError('');
    const r = await fetchContentDraftById(trimmed);
    setLoadDraftBusy(false);
    if (!r.ok) {
      setLoadDraftError(r.error);
      return;
    }
    const d = mapContentDraftDetail(r.data);
    if (!d?.id) {
      setLoadDraftError('Invalid response from server.');
      return;
    }
    setTitle(d.title);
    setBodyText(d.body);
    setContentItemId(d.id);
    setDraftStatusLabel(d.status);
    setDraftCanEdit(d.canEdit);
    setPhase(phaseFromStatus(d.status));
    setScheduleLocal('');
    setSuccessLine('Draft loaded.');
  }, []);

  const draftIdFromUrl = searchParams.get('draft')?.trim() ?? '';
  useEffect(() => {
    if (!draftIdFromUrl) {
      return undefined;
    }
    setOpenDraftIdInput(draftIdFromUrl);
    void loadDraftById(draftIdFromUrl);
    return undefined;
  }, [draftIdFromUrl, loadDraftById]);

  function resetSession() {
    setPhase('idle');
    setContentItemId('');
    setDraftStatusLabel('');
    setDraftCanEdit(false);
    setTitle('');
    setBodyText('');
    setOpenDraftIdInput('');
    setScheduleLocal('');
    setActionError('');
    setSuccessLine('');
    setLoadDraftError('');
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('draft');
        return next;
      },
      { replace: true },
    );
  }

  function localScheduleToUtcIso(value) {
    if (!value?.trim()) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  }

  async function handleCreateDraft(e) {
    e.preventDefault();
    setActionError('');
    setSuccessLine('');
    if (!title.trim() || !bodyText.trim()) {
      setActionError('Title and body are required.');
      return;
    }
    setCreateBusy(true);
    const r = await createContentDraft({ title, bodyText, channel: 'linkedin' });
    setCreateBusy(false);
    if (!r.ok) {
      setActionError(r.error);
      return;
    }
    const data = r.data;
    const id = String(data?.id ?? data?.Id ?? '');
    if (!id) {
      setActionError('Server did not return a draft id.');
      return;
    }
    setContentItemId(id);
    setDraftStatusLabel(String(data?.status ?? data?.Status ?? 'draft'));
    setDraftCanEdit(true);
    setPhase('created');
    setSuccessLine('Draft saved. Review below, then mark it ready to publish.');
  }

  async function handleSaveDraftEdits(e) {
    e.preventDefault();
    if (!contentItemId || !draftCanEdit) return;
    setActionError('');
    setSuccessLine('');
    setSaveEditBusy(true);
    const r = await updateContentDraft(contentItemId, { title, bodyText });
    setSaveEditBusy(false);
    if (!r.ok) {
      setActionError(r.error);
      return;
    }
    const d = mapContentDraftDetail(r.data);
    if (d) {
      setDraftCanEdit(d.canEdit);
      setDraftStatusLabel(d.status);
    }
    setSuccessLine('Draft saved.');
  }

  async function handleApprove() {
    if (!contentItemId) return;
    setActionError('');
    setSuccessLine('');
    setApproveBusy(true);
    const r = await approveContentDraft(contentItemId);
    setApproveBusy(false);
    if (!r.ok) {
      setActionError(r.error);
      return;
    }
    setPhase('approved');
    setDraftStatusLabel('Approved');
    setDraftCanEdit(false);
    setSuccessLine('Draft approved. Publish or schedule below, or use Ready to publish for any approved draft.');
    syncPublishingState();
  }

  async function handlePublish() {
    if (!contentItemId) return;
    setActionError('');
    setSuccessLine('');
    setPublishBusy(true);
    const r = await publishLinkedInContentDraft(contentItemId);
    setPublishBusy(false);
    if (!r.ok) {
      setActionError(r.error);
      return;
    }
    setPhase('published');
    setDraftCanEdit(false);
    setSuccessLine(
      r.message
        ? `${r.message}${r.linkedInPostUrn ? ` · ${r.linkedInPostUrn}` : ''}`
        : r.linkedInPostUrn
          ? `Published. Post: ${r.linkedInPostUrn}`
          : 'Published to LinkedIn.',
    );
    syncPublishingState();
  }

  async function handleSchedule() {
    if (!contentItemId) return;
    const iso = localScheduleToUtcIso(scheduleLocal);
    if (!iso) {
      setActionError('Pick a valid date and time for scheduling (your local time is converted to UTC for the API).');
      return;
    }
    setActionError('');
    setSuccessLine('');
    setScheduleBusy(true);
    const r = await scheduleLinkedInContentDraft(contentItemId, iso);
    setScheduleBusy(false);
    if (!r.ok) {
      setActionError(r.error);
      return;
    }
    setPhase('scheduled');
    setDraftStatusLabel('Scheduled');
    setDraftCanEdit(false);
    setSuccessLine(
      r.message ||
        (r.scheduledPublishAtUtc
          ? `Scheduled for ${new Date(r.scheduledPublishAtUtc).toLocaleString()}.`
          : 'Scheduled for LinkedIn.'),
    );
    syncPublishingState();
  }

  async function handleCancelSchedule() {
    if (!contentItemId) return;
    setActionError('');
    setSuccessLine('');
    setCancelBusy(true);
    const r = await cancelLinkedInSchedule(contentItemId);
    setCancelBusy(false);
    if (!r.ok) {
      setActionError(r.error);
      return;
    }
    setPhase('approved');
    setDraftStatusLabel('Approved');
    setDraftCanEdit(false);
    setSuccessLine(r.message || 'Schedule cancelled. Draft is approved again.');
    syncPublishingState();
  }

  const showReview = phase !== 'idle' && contentItemId;
  const canApprove = phase === 'created';
  const canPublishOrSchedule = phase === 'approved' && linkedinConnected;
  const showScheduleCancel = phase === 'scheduled' && linkedinConnected;
  const publishDisabled = !linkedinConnected || linkedinLoading || publishBusy || scheduleBusy || cancelBusy;
  const scheduleDisabled = !linkedinConnected || linkedinLoading || publishBusy || scheduleBusy || cancelBusy;
  const showEditableReview = showReview && draftCanEdit && phase === 'created';

  return (
    <div className="content-studio">
      <header className="content-studio__header">
        <h1 className="content-studio__title">Content Studio · LinkedIn</h1>
        <p className="content-studio__lede">
          Create a new draft, or open an existing one by id. While status is <strong>Draft</strong>, you can edit title and
          body; after approval, copy is locked and you publish or schedule. Anything approved but not live yet appears in{' '}
          <strong>Ready to publish</strong> below.
        </p>
      </header>

      {linkedinLoading ? (
        <p className="content-studio-muted" role="status">
          Checking LinkedIn connection…
        </p>
      ) : null}
      {!linkedinLoading && linkedinStatusError ? (
        <p className="content-studio-error" role="alert">
          Could not verify LinkedIn status: {linkedinStatusError} You can still edit drafts; try refreshing the page or open{' '}
          <button type="button" className="content-studio-linklike" onClick={onOpenConnections}>
            Integrations
          </button>
          .
        </p>
      ) : null}
      {!linkedinLoading && !linkedinStatusError && !linkedinConnected ? (
        <div className="content-studio-banner content-studio-banner--warn" role="status">
          <strong>LinkedIn is not connected.</strong> Publish and schedule require a live OAuth connection.{' '}
          <button type="button" className="content-studio-linklike" onClick={onOpenConnections}>
            Open Integrations
          </button>{' '}
          to connect LinkedIn, then return here.
        </div>
      ) : null}
      {!linkedinLoading && !linkedinStatusError && linkedinConnected ? (
        <p className="content-studio-muted" role="status">
          LinkedIn OAuth: <strong>connected</strong> — publish and schedule are available after a draft is approved.
        </p>
      ) : null}

      {actionError ? (
        <p className="content-studio-error" role="alert">
          {actionError}
        </p>
      ) : null}
      {successLine ? (
        <p className="content-studio-success" role="status">
          {successLine}
        </p>
      ) : null}

      <section className="content-studio-panel" aria-labelledby="cs-open-title">
        <h2 id="cs-open-title" className="content-studio-panel__title">
          Open existing draft
        </h2>
        <p className="content-studio-muted">
          Paste a draft id (UUID) from the Approval queue, Ready to publish, or your notes. You can also open Content Studio
          with <code className="content-studio-code">?draft=…</code> in the URL.
        </p>
        <div className="content-studio-field">
          <label htmlFor="cs-open-id">Draft id</label>
          <input
            id="cs-open-id"
            className="content-studio-input"
            value={openDraftIdInput}
            onChange={(e) => setOpenDraftIdInput(e.target.value)}
            disabled={loadDraftBusy}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <div className="content-studio-actions">
          <button
            type="button"
            className="secondary-btn"
            disabled={loadDraftBusy}
            onClick={() => void loadDraftById(openDraftIdInput)}
          >
            {loadDraftBusy ? 'Loading…' : 'Load draft'}
          </button>
        </div>
        {loadDraftError ? (
          <p className="content-studio-error" role="alert">
            {loadDraftError}
          </p>
        ) : null}
      </section>

      <section className="content-studio-panel" aria-labelledby="cs-new-title">
        <h2 id="cs-new-title" className="content-studio-panel__title">
          New draft
        </h2>
        {phase !== 'idle' ? (
          <p className="content-studio-muted">
            Use <strong>Review</strong> below for this draft.{' '}
            <button type="button" className="content-studio-linklike" onClick={resetSession}>
              Start over
            </button>{' '}
            to clear and compose a new draft here.
          </p>
        ) : null}
        <form className="content-studio-form" onSubmit={handleCreateDraft}>
          <div className="content-studio-field">
            <label htmlFor="cs-title">Title</label>
            <input
              id="cs-title"
              className="content-studio-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={500}
              disabled={createBusy || phase !== 'idle'}
              autoComplete="off"
            />
          </div>
          <div className="content-studio-field">
            <label htmlFor="cs-body">Post body (plain text, LinkedIn limit applies)</label>
            <textarea
              id="cs-body"
              className="content-studio-textarea"
              rows={8}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              disabled={createBusy || phase !== 'idle'}
            />
          </div>
          <div className="content-studio-actions">
            <button type="submit" className="primary-btn" disabled={createBusy || phase !== 'idle'}>
              {createBusy ? 'Saving…' : 'Save draft'}
            </button>
            {phase !== 'idle' ? (
              <button type="button" className="secondary-btn" onClick={resetSession} disabled={createBusy}>
                Start over
              </button>
            ) : null}
          </div>
        </form>
      </section>

      {showReview ? (
        <section className="content-studio-panel" aria-labelledby="cs-review-title">
          <h2 id="cs-review-title" className="content-studio-panel__title">
            Review
          </h2>
          <p className="content-studio-muted">
            Status: <strong>{formatContentStatusLabel(draftStatusLabel)}</strong> · Id:{' '}
            <code className="content-studio-code">{contentItemId}</code>
          </p>
          <p className="content-studio-muted content-studio-status-legend">
            <strong>Labels:</strong> Draft (editable, needs approval) → Approved (locked copy) → Scheduled or Published. Published
            posts appear in the list at the bottom of this page.
          </p>

          {showEditableReview ? (
            <form className="content-studio-form" onSubmit={(e) => void handleSaveDraftEdits(e)}>
              <div className="content-studio-field">
                <label htmlFor="cs-review-title-input">Title</label>
                <input
                  id="cs-review-title-input"
                  className="content-studio-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={500}
                  disabled={saveEditBusy}
                  autoComplete="off"
                />
              </div>
              <div className="content-studio-field">
                <label htmlFor="cs-review-body-input">Post body</label>
                <textarea
                  id="cs-review-body-input"
                  className="content-studio-textarea"
                  rows={10}
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  disabled={saveEditBusy}
                />
              </div>
              <div className="content-studio-actions">
                <button type="submit" className="secondary-btn" disabled={saveEditBusy || !title.trim() || !bodyText.trim()}>
                  {saveEditBusy ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="content-studio-readonly">
                <p className="content-studio-readonly__label">Title</p>
                <p className="content-studio-readonly__text">{title}</p>
                <p className="content-studio-readonly__label">Body</p>
                <pre className="content-studio-pre">{bodyText}</pre>
              </div>
              <p className="content-studio-hint">
                {phase === 'created' && !draftCanEdit
                  ? 'This draft cannot be edited in the current state.'
                  : 'Only drafts in Draft status are editable. After approval, use publish or schedule below.'}
              </p>
            </>
          )}

          <div className="content-studio-actions content-studio-actions--stack">
            {canApprove ? (
              <button type="button" className="primary-btn" onClick={() => void handleApprove()} disabled={approveBusy}>
                {approveBusy ? 'Approving…' : 'Mark ready to publish (approve)'}
              </button>
            ) : null}

            {canPublishOrSchedule ? (
              <>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => void handlePublish()}
                  disabled={publishDisabled}
                >
                  {publishBusy ? 'Publishing…' : 'Publish now to LinkedIn'}
                </button>
                <div className="content-studio-schedule">
                  <label htmlFor="cs-schedule" className="content-studio-schedule__label">
                    Schedule (local time → sent as UTC)
                  </label>
                  <input
                    id="cs-schedule"
                    type="datetime-local"
                    className="content-studio-input content-studio-schedule__input"
                    value={scheduleLocal}
                    onChange={(e) => setScheduleLocal(e.target.value)}
                    disabled={scheduleDisabled}
                  />
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => void handleSchedule()}
                    disabled={scheduleDisabled || !scheduleLocal}
                  >
                    {scheduleBusy ? 'Scheduling…' : 'Schedule for LinkedIn'}
                  </button>
                </div>
              </>
            ) : null}

            {phase === 'approved' && !linkedinConnected ? (
              <p className="content-studio-muted">Connect LinkedIn to publish or schedule this draft.</p>
            ) : null}

            {showScheduleCancel ? (
              <button type="button" className="secondary-btn" onClick={() => void handleCancelSchedule()} disabled={cancelBusy}>
                {cancelBusy ? 'Cancelling…' : 'Cancel scheduled publish'}
              </button>
            ) : null}

            {phase === 'published' ? (
              <p className="content-studio-muted">This draft was published. Start over to create another.</p>
            ) : null}
          </div>
        </section>
      ) : null}

      <ReadyToPublishSection
        linkedinConnected={linkedinConnected}
        linkedinLoading={linkedinLoading}
        onOpenConnections={onOpenConnections}
        reloadSignal={readyReloadSignal}
        onPublishingHandoffChanged={syncPublishingState}
      />

      <section className="content-studio-panel" aria-labelledby="cs-published-title">
        <div className="content-studio-published-head">
          <h2 id="cs-published-title" className="content-studio-panel__title">
            Published posts
          </h2>
          <button type="button" className="secondary-btn" onClick={() => void refreshPublished()} disabled={publishedLoading}>
            {publishedLoading ? 'Loading…' : 'Refresh list'}
          </button>
        </div>
        <PublishedPostsList
          items={publishedItems}
          loading={publishedLoading}
          error={publishedError}
        />
      </section>
    </div>
  );
}
