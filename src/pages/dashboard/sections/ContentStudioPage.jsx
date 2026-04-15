import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  approveContentDraft,
  cancelLinkedInSchedule,
  createContentDraft,
  fetchContentDraftById,
  mapContentDraftDetail,
  publishLinkedInContentDraft,
  scheduleLinkedInContentDraft,
} from '../../../features/content/contentDraftsApi.js';
import { formatContentStatusLabel } from '../../../features/content/contentStatusLabels.js';
import { fetchLinkedInStatus } from '../../../features/integrations/linkedinIntegrationApi.js';
import { postOrchestratorRoute } from '../../../features/orchestrator/orchestratorApi.js';
import ReadyToPublishSection from './ReadyToPublishSection.jsx';
import './content-studio.css';

function tryParseJsonObject(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function findStructuredHandoffByAgent(workflow, agentName) {
  const handoff = workflow?.handoffs?.find((h) => String(h?.agentName ?? '').trim() === agentName);
  return tryParseJsonObject(handoff?.structuredJson);
}

function pickLinkedInDraft(contentPayload) {
  const rows = Array.isArray(contentPayload?.contentDrafts) ? contentPayload.contentDrafts : [];
  if (!rows.length) return null;
  return rows.find((d) => String(d?.channel ?? '').toLowerCase() === 'linkedin') ?? rows[0] ?? null;
}

function collectDraftHashtags(draft) {
  const explicit = Array.isArray(draft?.hashtags)
    ? draft.hashtags.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim())
    : [];
  if (explicit.length) return explicit;
  const text = String(draft?.textDraft ?? '');
  const matches = text.match(/#[\p{L}\p{N}_]+/gu) ?? [];
  return [...new Set(matches)].slice(0, 12);
}

function normalizeHashtagList(tags) {
  return (Array.isArray(tags) ? tags : [])
    .map((x) => String(x ?? '').trim())
    .filter(Boolean)
    .map((x) => (x.startsWith('#') ? x : `#${x}`));
}

function deriveContentPlan(rawPlan, draft, caption) {
  const hook = String(rawPlan?.hook ?? '').trim() || String(draft?.outline ?? '').trim().split('\n')[0] || 'Hook pending';
  const message = String(rawPlan?.message ?? '').trim() || String(draft?.outline ?? '').trim() || 'Message pending';
  const cta =
    String(rawPlan?.cta ?? '').trim() ||
    String(caption ?? '')
      .split('\n')
      .map((x) => x.trim())
      .filter(Boolean)
      .find((line) => /comment|dm|learn more|book|reach out|visit/i.test(line)) ||
    'Tell us your thoughts in the comments.';
  return { hook, message, cta };
}

function phaseFromStatus(status) {
  const s = String(status ?? '').toLowerCase();
  if (s === 'draft') return 'created';
  if (s === 'approved') return 'approved';
  if (s === 'scheduled') return 'scheduled';
  if (s === 'published') return 'published';
  return 'idle';
}

function normalizedDraftWorkflowStatus(raw) {
  const s = String(raw ?? '').trim().toLowerCase();
  if (s === 'draft' || s === 'approved' || s === 'scheduled' || s === 'published' || s === 'unsaved') return s;
  return 'draft';
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

  const [approveBusy, setApproveBusy] = useState(false);
  const [publishBusy, setPublishBusy] = useState(false);
  const [scheduleBusy, setScheduleBusy] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);

  const [scheduleLocal, setScheduleLocal] = useState('');
  const [generationPrompt, setGenerationPrompt] = useState('');
  const [generationBusy, setGenerationBusy] = useState(false);
  const [generatedActionBusy, setGeneratedActionBusy] = useState('');
  const [generatedScheduleLocal, setGeneratedScheduleLocal] = useState('');
  const [generatedWorkflow, setGeneratedWorkflow] = useState(
    /** @type {null | {
     *   runId: string,
     *   handoffAgents: string[],
     *   contentPlan: { hook: string, message: string, cta: string },
     *   caption: string,
     *   hashtags: string[],
     *   imageUrl: string,
     *   title: string,
     *   channel: string,
     *   targetObjective: string | null,
     *   mediaUrls: string[],
     *   draftId: string | null,
     *   draftStatus: 'unsaved'|'draft'|'approved'|'scheduled'|'published',
     * }} */ (null),
  );

  const [actionError, setActionError] = useState('');
  const [successLine, setSuccessLine] = useState('');

  /** Bumps Ready to publish + refreshes published list after workflow changes. */
  const [readyReloadSignal, setReadyReloadSignal] = useState(0);

  const logPublishDiagnostics = useCallback((event, payload) => {
    try {
      // Keep diagnostics visible in browser console for publish-flow debugging.
      console.info(`[ContentStudio publish] ${event}`, payload);
    } catch {
      // no-op in restricted environments
    }
  }, []);

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

  const syncPublishingState = useCallback(() => {
    setReadyReloadSignal((s) => s + 1);
  }, []);

  const setDraftIdInUrl = useCallback(
    (draftId) => {
      const id = String(draftId ?? '').trim();
      if (!id) return;
      const next = new URLSearchParams(searchParams);
      next.set('draftId', id);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const hydrateFromSavedDraft = useCallback((savedDraft) => {
    const imageUrl = Array.isArray(savedDraft.mediaUrls) && savedDraft.mediaUrls.length ? savedDraft.mediaUrls[0] : '';
    const hashtags = normalizeHashtagList(collectDraftHashtags({ textDraft: savedDraft.body }));
    const plan = deriveContentPlan(null, { outline: savedDraft.title }, savedDraft.body);
    const statusLower = String(savedDraft.status ?? '').toLowerCase();
    const mappedStatus =
      statusLower === 'draft' || statusLower === 'approved' || statusLower === 'scheduled' || statusLower === 'published'
        ? statusLower
        : 'draft';

    setGeneratedWorkflow({
      runId: savedDraft.orchestrationRunId ? String(savedDraft.orchestrationRunId) : '',
      handoffAgents: [],
      contentPlan: plan,
      caption: savedDraft.body,
      hashtags,
      imageUrl,
      title: savedDraft.title,
      channel: savedDraft.channel || 'linkedin',
      targetObjective: typeof savedDraft.targetObjective === 'string' ? savedDraft.targetObjective : null,
      mediaUrls: Array.isArray(savedDraft.mediaUrls) ? savedDraft.mediaUrls : [],
      draftId: savedDraft.id,
      draftStatus: mappedStatus,
    });
    setTitle(savedDraft.title);
    setBodyText(savedDraft.body);
    setContentItemId(savedDraft.id);
    setDraftStatusLabel(String(savedDraft.status ?? 'Draft'));
    setPhase(phaseFromStatus(savedDraft.status));
  }, []);

  useEffect(() => {
    void refreshLinkedIn();
  }, [refreshLinkedIn]);

  useEffect(() => {
    const draftId = String(searchParams.get('draftId') ?? searchParams.get('draft') ?? '').trim();
    if (!draftId) return;

    if (!String(searchParams.get('draftId') ?? '').trim() && String(searchParams.get('draft') ?? '').trim()) {
      const next = new URLSearchParams(searchParams);
      next.delete('draft');
      next.set('draftId', draftId);
      setSearchParams(next, { replace: true });
    }

    let active = true;
    (async () => {
      setActionError('');
      const response = await fetchContentDraftById(draftId);
      if (!active) return;
      if (!response.ok) {
        setActionError(response.error || 'Could not load the saved draft from URL.');
        return;
      }
      const mapped = mapContentDraftDetail(response.data);
      if (!mapped?.id) {
        setActionError('Could not parse saved draft data.');
        return;
      }
      hydrateFromSavedDraft(mapped);
      setSuccessLine('Loaded saved draft from URL.');
    })();

    return () => {
      active = false;
    };
  }, [searchParams, hydrateFromSavedDraft, setSearchParams]);

  async function ensureGeneratedDraftExists() {
    if (!generatedWorkflow) {
      setActionError('No generated content is available yet.');
      return null;
    }
    if (generatedWorkflow.draftId) {
      return generatedWorkflow.draftId;
    }

    const created = await createContentDraft({
      title: generatedWorkflow.title,
      bodyText: generatedWorkflow.caption,
      channel: generatedWorkflow.channel || 'linkedin',
      mediaUrls: generatedWorkflow.mediaUrls,
      hashtags: generatedWorkflow.hashtags,
      imageUrl: generatedWorkflow.imageUrl,
      targetObjective: generatedWorkflow.targetObjective,
      source: 'agent',
      orchestrationRunId: generatedWorkflow.runId || null,
    });
    if (!created.ok) {
      setActionError(created.error);
      return null;
    }

    const newId = String(created.data?.id ?? created.data?.Id ?? '').trim();
    if (!newId) {
      setActionError('Draft save succeeded but server did not return an id.');
      return null;
    }

    const status = String(created.data?.status ?? created.data?.Status ?? 'draft');
    setGeneratedWorkflow((prev) =>
      prev
        ? {
            ...prev,
            draftId: newId,
            draftStatus: 'draft',
          }
        : prev,
    );
    setTitle(generatedWorkflow.title);
    setBodyText(generatedWorkflow.caption);
    setContentItemId(newId);
    setDraftStatusLabel(status);
    setPhase('created');
    setScheduleLocal('');
    setDraftIdInUrl(newId);
    syncPublishingState();
    return newId;
  }

  async function handleGenerateFromPrompt(e) {
    e.preventDefault();
    const prompt = generationPrompt.trim();
    if (!prompt) {
      setActionError('Enter a prompt so the orchestrator can generate content.');
      return;
    }

    setActionError('');
    setSuccessLine('');
    setGenerationBusy(true);
    const orchestration = await postOrchestratorRoute(prompt);
    setGenerationBusy(false);
    if (!orchestration.ok) {
      setActionError(orchestration.error);
      return;
    }

    const workflow = orchestration.data;
    const contentPayload = findStructuredHandoffByAgent(workflow, 'Content Management Agent');
    const imagePayload = findStructuredHandoffByAgent(workflow, 'Image Generation Agent');
    const draft = pickLinkedInDraft(contentPayload);
    const imageDraft = pickLinkedInDraft(imagePayload);
    const preview = workflow.generatedLinkedInPreview ?? null;

    if (!draft && !String(preview?.caption ?? '').trim()) {
      setActionError('Orchestrator finished, but no valid LinkedIn caption draft was returned.');
      return;
    }

    const captionCandidate = String(preview?.caption ?? '').trim() || String(draft?.textDraft ?? '').trim();
    const titleCandidate = String(draft?.outline ?? '').trim() || prompt;
    const normalizedTitle = titleCandidate.length > 500 ? `${titleCandidate.slice(0, 497)}...` : titleCandidate;
    const generatedImageUrl =
      String(preview?.imageUrl ?? '').trim() ||
      (typeof imageDraft?.generatedImageUrl === 'string' && imageDraft.generatedImageUrl.trim()
        ? imageDraft.generatedImageUrl.trim()
        : '');
    const normalizedHashtags = normalizeHashtagList(preview?.hashtags?.length ? preview.hashtags : collectDraftHashtags(draft));
    const contentPlan = deriveContentPlan(preview?.contentPlan, draft, captionCandidate);

    const workflowState = {
      runId: workflow.runId,
      handoffAgents: (workflow.handoffs ?? []).map((h) => String(h.agentName ?? '').trim()).filter(Boolean),
      contentPlan,
      caption: captionCandidate,
      hashtags: normalizedHashtags,
      imageUrl: generatedImageUrl,
      title: normalizedTitle,
      channel: String(draft?.channel ?? 'linkedin').trim().toLowerCase() || 'linkedin',
      targetObjective: String(contentPayload?.executiveSummary ?? '').trim() || null,
      mediaUrls: generatedImageUrl ? [generatedImageUrl] : [],
      draftId: null,
      draftStatus: 'unsaved',
    };
    setGeneratedWorkflow(workflowState);
    setGeneratedScheduleLocal('');
    const created = await createContentDraft({
      title: workflowState.title,
      bodyText: workflowState.caption,
      hashtags: workflowState.hashtags,
      imageUrl: workflowState.imageUrl,
      channel: workflowState.channel || 'linkedin',
      mediaUrls: workflowState.mediaUrls,
      targetObjective: workflowState.targetObjective,
      source: 'agent',
      orchestrationRunId: workflowState.runId || null,
    });
    if (!created.ok) {
      setActionError(
        `${created.error || 'Draft persistence failed.'} Generated content is still available below; use "Save as Draft" to retry.`,
      );
      setSuccessLine('');
      setGeneratedWorkflow((prev) => (prev ? { ...prev, draftStatus: 'unsaved', draftId: null } : prev));
      return;
    }

    const savedId = String(created.data?.id ?? created.data?.Id ?? '').trim();
    const savedStatus = String(created.data?.status ?? created.data?.Status ?? 'draft').trim() || 'draft';
    if (!savedId) {
      setActionError('Draft saved response was invalid (missing id). Generated content is still available; please retry save.');
      setSuccessLine('');
      setGeneratedWorkflow((prev) => (prev ? { ...prev, draftStatus: 'unsaved', draftId: null } : prev));
      return;
    }
    setGeneratedWorkflow((prev) => (prev ? { ...prev, draftId: savedId, draftStatus: 'draft' } : prev));
    setTitle(workflowState.title);
    setBodyText(workflowState.caption);
    setContentItemId(savedId);
    setDraftStatusLabel(savedStatus);
    setPhase('created');
    setScheduleLocal('');
    setDraftIdInUrl(savedId);
    setSuccessLine('Generation complete and saved to Drafts. Choose what to do next: approve, schedule, or publish.');
    syncPublishingState();
  }

  async function handleGeneratedSaveDraft() {
    setActionError('');
    setSuccessLine('');
    setGeneratedActionBusy('save');
    const id = await ensureGeneratedDraftExists();
    setGeneratedActionBusy('');
    if (!id) return;
    setSuccessLine('Saved as draft. You can continue in Review or use the actions here.');
  }

  async function handleGeneratedApprove() {
    setActionError('');
    setSuccessLine('');
    setGeneratedActionBusy('approve');
    const id = await ensureGeneratedDraftExists();
    if (!id) {
      setGeneratedActionBusy('');
      return;
    }
    const r = await approveContentDraft(id);
    setGeneratedActionBusy('');
    if (!r.ok) {
      setActionError(r.error);
      return;
    }
    setGeneratedWorkflow((prev) => (prev ? { ...prev, draftStatus: 'approved', draftId: id } : prev));
    setPhase('approved');
    setDraftStatusLabel('Approved');
    setSuccessLine('Draft approved and ready for scheduling or publishing.');
    syncPublishingState();
  }

  async function handleGeneratedSchedule() {
    const iso = localScheduleToUtcIso(generatedScheduleLocal);
    if (!iso) {
      setActionError('Pick a valid schedule date and time.');
      return;
    }
    setActionError('');
    setSuccessLine('');
    setGeneratedActionBusy('schedule');
    const id = await ensureGeneratedDraftExists();
    if (!id) {
      setGeneratedActionBusy('');
      return;
    }
    const approved = await approveContentDraft(id);
    if (!approved.ok && !String(approved.error ?? '').toLowerCase().includes('approved')) {
      setGeneratedActionBusy('');
      setActionError(approved.error);
      return;
    }
    const r = await scheduleLinkedInContentDraft(id, iso);
    setGeneratedActionBusy('');
    if (!r.ok) {
      setActionError(r.error);
      return;
    }
    setGeneratedWorkflow((prev) => (prev ? { ...prev, draftStatus: 'scheduled', draftId: id } : prev));
    setPhase('scheduled');
    setDraftStatusLabel('Scheduled');
    setSuccessLine(r.message || 'Scheduled successfully.');
    syncPublishingState();
  }

  async function handleGeneratedPublish() {
    setActionError('');
    setSuccessLine('');
    setGeneratedActionBusy('publish');
    const id = await ensureGeneratedDraftExists();
    if (!id) {
      setGeneratedActionBusy('');
      return;
    }

    const statusBeforeApprove = normalizedDraftWorkflowStatus(generatedWorkflow?.draftStatus ?? draftStatusLabel ?? phase);
    logPublishDiagnostics('start', {
      draftId: id,
      statusBeforeApprove,
      linkedinConnected,
      channel: generatedWorkflow?.channel ?? 'linkedin',
      hasTitle: Boolean(String(generatedWorkflow?.title ?? title ?? '').trim()),
      hasBody: Boolean(String(generatedWorkflow?.caption ?? bodyText ?? '').trim()),
      routeApprove: `/api/content-drafts/${id}/approve`,
      routePublish: `/api/content-drafts/${id}/publish/linkedin`,
    });

    const bodyCandidate = String(generatedWorkflow?.caption ?? bodyText ?? '').trim();
    const titleCandidate = String(generatedWorkflow?.title ?? title ?? '').trim();
    const channelCandidate = String(generatedWorkflow?.channel ?? 'linkedin').trim().toLowerCase();
    if (!titleCandidate || !bodyCandidate || channelCandidate !== 'linkedin') {
      setGeneratedActionBusy('');
      setActionError('Publish blocked: draft must have title, caption/body, and channel "linkedin".');
      return;
    }
    if (!linkedinConnected) {
      setGeneratedActionBusy('');
      setActionError('Publish blocked: LinkedIn is not connected.');
      return;
    }

    if (statusBeforeApprove === 'draft' || statusBeforeApprove === 'unsaved' || statusBeforeApprove === 'created') {
      const approved = await approveContentDraft(id);
      logPublishDiagnostics('approve-response', {
        draftId: id,
        statusBeforeApprove,
        ok: approved.ok,
        error: approved.ok ? null : approved.error,
      });
      if (!approved.ok) {
        setGeneratedActionBusy('');
        setActionError(`Approve failed: ${approved.error}`);
        return;
      }
    }

    const previewImg =
      String(generatedWorkflow?.imageUrl ?? '').trim() ||
      (Array.isArray(generatedWorkflow?.mediaUrls) && generatedWorkflow.mediaUrls.length
        ? String(generatedWorkflow.mediaUrls[0] ?? '').trim()
        : '');
    if (previewImg && (previewImg.startsWith('blob:') || previewImg.startsWith('data:'))) {
      setGeneratedActionBusy('');
      setActionError(
        'Publish blocked: the preview image is only in your browser. Regenerate so the API stores a public HTTPS image URL (e.g. Cloudinary).',
      );
      return;
    }

    let draftMediaFirst = '';
    const draftCheck = await fetchContentDraftById(id);
    if (draftCheck.ok) {
      const dm = mapContentDraftDetail(draftCheck.data);
      draftMediaFirst = Array.isArray(dm?.mediaUrls) && dm.mediaUrls.length ? String(dm.mediaUrls[0] ?? '').trim() : '';
    }
    if (previewImg && !draftMediaFirst) {
      console.warn('[ContentStudio publish] Preview has image but saved draft has no mediaUrls; sending imageUrl on publish body.', {
        draftId: id,
        previewImg,
      });
    }
    const publishPayload = { imageUrl: previewImg || null };
    console.info('[ContentStudio publish] pre-publish snapshot', {
      draftId: id,
      postText: bodyCandidate,
      previewImageUrl: previewImg || null,
      draftMediaUrlsFirst: draftMediaFirst || null,
      publishPayload,
    });

    const r = await publishLinkedInContentDraft(id, publishPayload);
    logPublishDiagnostics('publish-response', {
      draftId: id,
      ok: r.ok,
      error: r.ok ? null : r.error,
      linkedInConnected: linkedinConnected,
    });
    setGeneratedActionBusy('');
    if (!r.ok) {
      setActionError(`Publish failed: ${r.error}`);
      return;
    }
    setGeneratedWorkflow((prev) => (prev ? { ...prev, draftStatus: 'published', draftId: id } : prev));
    setPhase('published');
    setDraftStatusLabel('Published');
    setSuccessLine(r.message || 'Published to LinkedIn.');
    syncPublishingState();
  }

  function localScheduleToUtcIso(value) {
    if (!value?.trim()) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
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
    setSuccessLine('Draft approved. Publish or schedule below, or use Ready to publish for any approved draft.');
    syncPublishingState();
  }

  async function handlePublish() {
    if (!contentItemId) return;
    setActionError('');
    setSuccessLine('');
    setPublishBusy(true);
    let imageUrl = '';
    const wfImg =
      String(generatedWorkflow?.imageUrl ?? '').trim() ||
      (Array.isArray(generatedWorkflow?.mediaUrls) && generatedWorkflow.mediaUrls.length
        ? String(generatedWorkflow.mediaUrls[0] ?? '').trim()
        : '');
    if (wfImg) {
      imageUrl = wfImg;
    } else {
      const detail = await fetchContentDraftById(contentItemId);
      if (detail.ok) {
        const m = mapContentDraftDetail(detail.data);
        imageUrl = Array.isArray(m?.mediaUrls) && m.mediaUrls.length ? String(m.mediaUrls[0] ?? '').trim() : '';
      }
    }
    if (imageUrl && (imageUrl.startsWith('blob:') || imageUrl.startsWith('data:'))) {
      setPublishBusy(false);
      setActionError('Publish blocked: image URL is local-only; use a public HTTPS image (e.g. Cloudinary).');
      return;
    }
    console.info('[ContentStudio publish] publish-now (review panel)', {
      contentItemId,
      postTextPreview: String(bodyText ?? '').slice(0, 500),
      imageUrl: imageUrl || null,
    });
    const r = await publishLinkedInContentDraft(contentItemId, imageUrl ? { imageUrl } : {});
    setPublishBusy(false);
    if (!r.ok) {
      setActionError(r.error);
      return;
    }
    setPhase('published');
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
    setSuccessLine(r.message || 'Schedule cancelled. Draft is approved again.');
    syncPublishingState();
  }

  const showReview = phase !== 'idle' && contentItemId;
  const canApprove = phase === 'created';
  const canPublishOrSchedule = phase === 'approved' && linkedinConnected;
  const showScheduleCancel = phase === 'scheduled' && linkedinConnected;
  const publishDisabled = !linkedinConnected || linkedinLoading || publishBusy || scheduleBusy || cancelBusy;
  const scheduleDisabled = !linkedinConnected || linkedinLoading || publishBusy || scheduleBusy || cancelBusy;
  const phaseLabel = {
    idle: 'Draft setup',
    created: 'Draft',
    approved: 'Approved',
    scheduled: 'Scheduled',
    published: 'Published',
  }[phase];

  return (
    <div className="content-studio">
      <header className="content-studio__header content-studio__header--workspace">
        <div className="content-studio__header-copy">
          <p className="content-studio-eyebrow">Publishing workspace</p>
          <h1 className="content-studio__title">Content Studio</h1>
          <p className="content-studio__lede">
            Draft, review, approve, then publish to LinkedIn from a single workflow. Approved drafts that are not live yet
            appear in <strong>Ready to publish</strong>.
          </p>
        </div>
        <div className="content-studio-overview" role="status" aria-label="Content studio status overview">
          <article className="content-studio-overview__card">
            <p className="content-studio-overview__label">LinkedIn</p>
            <p className="content-studio-overview__value">
              {linkedinLoading ? 'Checking…' : linkedinConnected ? 'Connected' : 'Not connected'}
            </p>
          </article>
          <article className="content-studio-overview__card">
            <p className="content-studio-overview__label">Workflow stage</p>
            <p className="content-studio-overview__value">{phaseLabel}</p>
          </article>
          <article className="content-studio-overview__card">
            <p className="content-studio-overview__label">Current draft</p>
            <p className="content-studio-overview__value">
              {contentItemId ? <code className="content-studio-code">{contentItemId}</code> : 'None selected'}
            </p>
          </article>
        </div>
      </header>

      <section className="content-studio-system-state" aria-label="LinkedIn connection and workflow notices">
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
            LinkedIn OAuth is connected. Publish and schedule are available after approval.
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
      </section>

      <section className="content-studio-panel content-studio-panel--card" aria-labelledby="cs-orchestrated-generate-title">
        <h2 id="cs-orchestrated-generate-title" className="content-studio-panel__title">
          Generate from a prompt
        </h2>
        <p className="content-studio-muted">
          Describe what you want once. Orchestrator coordinates specialists, uses stored business context, and saves a
          ready-to-review LinkedIn draft automatically.
        </p>
        <form className="content-studio-form" onSubmit={handleGenerateFromPrompt}>
          <div className="content-studio-field">
            <label htmlFor="cs-generate-prompt">Prompt</label>
            <textarea
              id="cs-generate-prompt"
              className="content-studio-textarea"
              rows={4}
              value={generationPrompt}
              onChange={(e) => setGenerationPrompt(e.target.value)}
              placeholder="Example: Create a LinkedIn post announcing our new AI lead follow-up workflow for small clinics."
              disabled={generationBusy}
            />
          </div>
          <div className="content-studio-actions">
            <button type="submit" className="primary-btn" disabled={generationBusy}>
              {generationBusy ? 'Running orchestrator…' : 'Generate complete content'}
            </button>
          </div>
        </form>

        {generatedWorkflow ? (
          <div className="content-studio-generated">
            <div className="content-studio-generated__meta">
              <p className="content-studio-muted">
                Run id: <code className="content-studio-code">{generatedWorkflow.runId}</code>
              </p>
              <p className="content-studio-muted">
                Agents used:{' '}
                <strong>{generatedWorkflow.handoffAgents.length ? generatedWorkflow.handoffAgents.join(' -> ') : '—'}</strong>
              </p>
              <p className="content-studio-muted">
                Draft state:{' '}
                <strong>
                  {generatedWorkflow.draftStatus === 'unsaved'
                    ? 'Not saved yet'
                    : generatedWorkflow.draftStatus.charAt(0).toUpperCase() + generatedWorkflow.draftStatus.slice(1)}
                </strong>
              </p>
            </div>
            <div className="content-studio-generated__layout">
              <article className="content-studio-generated__block">
                <h3>Content plan</h3>
                <dl className="content-studio-plan">
                  <div>
                    <dt>Hook</dt>
                    <dd>{generatedWorkflow.contentPlan.hook}</dd>
                  </div>
                  <div>
                    <dt>Message</dt>
                    <dd>{generatedWorkflow.contentPlan.message}</dd>
                  </div>
                  <div>
                    <dt>CTA</dt>
                    <dd>{generatedWorkflow.contentPlan.cta}</dd>
                  </div>
                </dl>
              </article>
              <article className="content-studio-linkedin-preview" aria-label="LinkedIn post preview">
                <header className="content-studio-linkedin-preview__head">
                  <div className="content-studio-linkedin-preview__avatar" aria-hidden="true">
                    in
                  </div>
                  <div>
                    <p className="content-studio-linkedin-preview__author">Your profile</p>
                    <p className="content-studio-linkedin-preview__meta">Now · LinkedIn</p>
                  </div>
                </header>
                <p className="content-studio-linkedin-preview__caption">{generatedWorkflow.caption}</p>
                {generatedWorkflow.imageUrl ? (
                  <div className="content-studio-linkedin-preview__image-card">
                    <img
                      src={generatedWorkflow.imageUrl}
                      alt="Generated LinkedIn visual preview"
                      className="content-studio-linkedin-preview__image"
                    />
                  </div>
                ) : null}
                <div className="content-studio-linkedin-preview__tags" aria-label="Hashtags">
                  {generatedWorkflow.hashtags.length ? (
                    generatedWorkflow.hashtags.map((tag) => (
                      <span key={tag} className="content-studio-hashtag-chip">
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="content-studio-muted">No hashtags returned.</span>
                  )}
                </div>
              </article>
            </div>
            <div className="content-studio-actions content-studio-generated__actions">
              <button type="button" className="secondary-btn" disabled={generatedActionBusy !== ''} onClick={() => void handleGeneratedSaveDraft()}>
                {generatedActionBusy === 'save' ? 'Saving…' : 'Save as Draft'}
              </button>
              <button type="button" className="secondary-btn" disabled={generatedActionBusy !== ''} onClick={() => void handleGeneratedApprove()}>
                {generatedActionBusy === 'approve' ? 'Approving…' : 'Approve'}
              </button>
              <div className="content-studio-generated__schedule">
                <label htmlFor="cs-generated-schedule">Schedule</label>
                <input
                  id="cs-generated-schedule"
                  type="datetime-local"
                  className="content-studio-input"
                  value={generatedScheduleLocal}
                  onChange={(e) => setGeneratedScheduleLocal(e.target.value)}
                  disabled={generatedActionBusy !== ''}
                />
                <button
                  type="button"
                  className="secondary-btn"
                  disabled={generatedActionBusy !== '' || !generatedScheduleLocal}
                  onClick={() => void handleGeneratedSchedule()}
                >
                  {generatedActionBusy === 'schedule' ? 'Scheduling…' : 'Schedule'}
                </button>
              </div>
              <button type="button" className="primary-btn" disabled={generatedActionBusy !== ''} onClick={() => void handleGeneratedPublish()}>
                {generatedActionBusy === 'publish' ? 'Publishing…' : 'Publish'}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {showReview ? (
        <section className="content-studio-panel content-studio-panel--card" aria-labelledby="cs-review-title">
          <h2 id="cs-review-title" className="content-studio-panel__title">
            Review
          </h2>
          <div className="content-studio-review-meta">
            <p className="content-studio-muted">
              Status: <strong>{formatContentStatusLabel(draftStatusLabel)}</strong>
            </p>
            <p className="content-studio-muted">
              Id: <code className="content-studio-code">{contentItemId}</code>
            </p>
          </div>
          <p className="content-studio-muted content-studio-status-legend">
            <strong>Labels:</strong> Draft (editable, needs approval) → Approved (locked copy) → Scheduled or Published. Published
            posts appear in the list at the bottom of this page.
          </p>

          <div className="content-studio-readonly">
            <p className="content-studio-readonly__label">Title</p>
            <p className="content-studio-readonly__text">{title}</p>
            <p className="content-studio-readonly__label">Body</p>
            <pre className="content-studio-pre">{bodyText}</pre>
          </div>
          <p className="content-studio-hint">After approval, use publish or schedule below.</p>

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

    </div>
  );
}
