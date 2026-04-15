/**
 * MVP onboarding wizard (4 sections). Local draft + completion flags live in `onboardingStorage.js`.
 *
 * Website Brand DNA: plain preview (`POST .../preview`) + optional AI agent preview (`POST .../preview-with-agent`); save on finish.
 * Stale “success” without persisted JSON is reset to re-run preview on section 1; finish blocks if website save has no payload.
 * Social: non-LinkedIn channels are intent-only in the UI; LinkedIn OAuth uses `/api/integrations/linkedin/*`.
 */
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import {
  disconnectLinkedIn,
  fetchLinkedInAuthorizationUrl,
  fetchLinkedInStatus,
} from '../integrations/linkedinIntegrationApi.js';
import { useAuth } from '../../auth/AuthProvider.jsx';
import { useWorkspaceState } from '../../auth/WorkspaceStateProvider.jsx';
import OnevoLogo from '../../components/OnevoLogo.jsx';
import { loadWorkspacePayloadFromStorage, upsertBusinessProfileFromOnboardingState } from '../../lib/workspaceServerApi.js';
import { markDashboardHandoffPendingFromOnboarding } from '../dashboard/handoffSession.js';
import { GOAL_OPTIONS, MAX_GOALS, ROLE_OPTIONS, SECTION_LABELS, LEARNING_METHODS } from './onboardingMvpConstants.js';
import {
  clearOnboardingDraft,
  createInitialState,
  flushSaveOnboardingState,
  isOnboardingComplete,
  loadOnboardingState,
  runLegacyOnboardingCleanupOnce,
  scheduleSaveOnboardingState,
} from './onboardingStorage.js';
import { persistWorkspaceFromOnboarding } from './onboardingWorkspaceMerge.js';
import { previewWebsiteBrandDna, previewWebsiteBrandDnaWithAgent, saveWebsiteBrandDna } from './websiteBrandDnaApi.js';
import {
  buildWebsiteBrandDnaSavePayload,
  extractAgentPreviewMetadata,
  mapBrandDnaPreviewToOnboardingFields,
  mergeBrandDnaWithAgentResponseToWebExtractionDto,
} from './websiteBrandDnaMapping.js';
import { deleteBusinessContextFile, uploadBusinessContextFile } from './businessContextDataApi.js';
import { ensureOnboardingManualDataSource, syncOnboardingBusinessData } from './onboardingBusinessDataSync.js';
import './onboarding.css';

/** @type {Record<'excel' | 'csv' | 'photo', readonly string[]>} */
const BUSINESS_FILE_EXT = {
  excel: ['.xlsx', '.xls'],
  csv: ['.csv'],
  photo: ['.doc', '.docx'],
};

function businessFileExtOk(fileName, slot) {
  const lower = fileName.toLowerCase();
  return BUSINESS_FILE_EXT[slot].some((e) => lower.endsWith(e));
}

function toggleGoal(ids, id) {
  if (ids.includes(id)) return ids.filter((g) => g !== id);
  if (ids.length >= MAX_GOALS) return ids;
  return [...ids, id];
}

/** Memoized so typing in the active section does not re-render the progress bar every keystroke. */
const OnboardingMvpProgress = memo(function OnboardingMvpProgress({ sectionIndex }) {
  return (
    <div className="onboarding-mvp-progress" aria-hidden="true">
      <div className="onboarding-mvp-progress-track">
        <div
          className="onboarding-mvp-progress-fill"
          style={{ width: `${((sectionIndex + 1) / 4) * 100}%` }}
        />
      </div>
      <p className="onboarding-mvp-progress-meta">
        Step {sectionIndex + 1} of 4 — {SECTION_LABELS[sectionIndex]}
      </p>
    </div>
  );
});

const SERVER_DRAFT_DEBOUNCE_MS = 1800;

export default function OnboardingFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const {
    saveWorkspaceState,
    status: workspaceStatus,
    onboardingDraftJson,
    serverOnboardingComplete,
  } = useWorkspaceState();
  const outletContext = useOutletContext() ?? {};
  const registerExitSetup = outletContext.registerExitSetup;
  const [state, setState] = useState(createInitialState);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [businessDataSyncBusy, setBusinessDataSyncBusy] = useState(false);
  const [businessDataFileUploading, setBusinessDataFileUploading] = useState(
    /** @type {null | 'excel' | 'csv' | 'photo'} */ (null),
  );
  const [businessDataFileRemoving, setBusinessDataFileRemoving] = useState(
    /** @type {null | 'excel' | 'csv' | 'photo'} */ (null),
  );
  const [businessDataFileDeleteError, setBusinessDataFileDeleteError] = useState('');
  /** Ephemeral success line (not persisted in draft). */
  const [businessDataFileNotice, setBusinessDataFileNotice] = useState('');

  const [linkedinStatusLoading, setLinkedinStatusLoading] = useState(false);
  const [linkedinConnectBusy, setLinkedinConnectBusy] = useState(false);
  const [linkedinDisconnectBusy, setLinkedinDisconnectBusy] = useState(false);
  const [linkedinIntegrationError, setLinkedinIntegrationError] = useState('');
  const [linkedinProfileHint, setLinkedinProfileHint] = useState('');
  const [agentPreviewBusy, setAgentPreviewBusy] = useState(false);
  const [agentPreviewError, setAgentPreviewError] = useState('');
  /** Session-only: large agent JSON for optional disclosure; not persisted in draft. */
  const [agentStructuredJsonDisplay, setAgentStructuredJsonDisplay] = useState('');
  const stateRef = useRef(state);
  stateRef.current = state;

  const excelFileInputRef = useRef(/** @type {HTMLInputElement | null} */ (null));
  const csvFileInputRef = useRef(/** @type {HTMLInputElement | null} */ (null));
  const photoFileInputRef = useRef(/** @type {HTMLInputElement | null} */ (null));

  /** Last successful `POST .../preview` JSON (for save on finish). */
  const brandDnaPreviewPayloadRef = useRef(/** @type {Record<string, unknown> | null} */ (null));
  /** Website URL that produced a successful preview (avoid re-scrape when unchanged). */
  const lastSuccessfulPreviewUrlRef = useRef('');

  /** Once true, ignore provider `onboardingDraftJson` updates (e.g. after autosave) so the form is not reset while typing. */
  const didHydrateFromWorkspace = useRef(false);

  /** Restore preview ref + URL marker after hydration or when persisted JSON changes (resume / refresh). */
  useEffect(() => {
    if (!hydrated) return;
    const raw = state.websiteBrandDnaPreviewJson;
    if (typeof raw === 'string' && raw.length > 0) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          brandDnaPreviewPayloadRef.current = parsed;
          const src = String(parsed.sourceUrl ?? parsed.SourceUrl ?? '').trim();
          lastSuccessfulPreviewUrlRef.current = src || state.websiteUrl.trim();
          return;
        }
      } catch {
        /* invalid persisted JSON — treat as no preview */
      }
      brandDnaPreviewPayloadRef.current = null;
      lastSuccessfulPreviewUrlRef.current = '';
      return;
    }
    brandDnaPreviewPayloadRef.current = null;
    lastSuccessfulPreviewUrlRef.current = '';
  }, [hydrated, state.websiteBrandDnaPreviewJson, state.websiteUrl]);

  /**
   * Resume / older drafts: `profileScrapeStatus` may be `success` while `websiteBrandDnaPreviewJson` is empty (refresh before persist, legacy draft).
   * Reset to `idle` so the section-1 preview effect can re-fetch when the user is on that step; finish still blocks if no payload (see handleFinishSetup).
   */
  useEffect(() => {
    if (!hydrated) return;
    if (state.learningMethod !== 'website') return;
    const url = state.websiteUrl?.trim() ?? '';
    if (!url) return;
    const hasPersisted =
      typeof state.websiteBrandDnaPreviewJson === 'string' && state.websiteBrandDnaPreviewJson.length > 0;
    if (hasPersisted) return;
    if (state.profileScrapeStatus !== 'success') return;
    setState((s) => ({ ...s, profileScrapeStatus: 'idle' }));
  }, [hydrated, state.learningMethod, state.websiteUrl, state.websiteBrandDnaPreviewJson, state.profileScrapeStatus]);

  useEffect(() => {
    if (didHydrateFromWorkspace.current) {
      return;
    }
    if (workspaceStatus !== 'ready' && workspaceStatus !== 'error') {
      return;
    }
    runLegacyOnboardingCleanupOnce();
    let merged = null;
    if (workspaceStatus === 'ready' && onboardingDraftJson) {
      try {
        merged = JSON.parse(onboardingDraftJson);
      } catch {
        merged = null;
      }
    }
    const local = loadOnboardingState();
    if (merged && typeof merged === 'object') {
      setState({ ...createInitialState(), ...merged });
    } else if (local) {
      setState(local);
    }
    setHydrated(true);
    didHydrateFromWorkspace.current = true;
  }, [workspaceStatus, onboardingDraftJson]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    scheduleSaveOnboardingState(state);
  }, [state, hydrated]);

  useEffect(() => {
    if (!businessDataFileNotice) {
      return undefined;
    }
    const t = window.setTimeout(() => setBusinessDataFileNotice(''), 5200);
    return () => window.clearTimeout(t);
  }, [businessDataFileNotice]);

  useEffect(() => {
    if (state.sectionIndex !== 2) {
      setBusinessDataFileNotice('');
      setBusinessDataFileDeleteError('');
    }
  }, [state.sectionIndex]);

  useEffect(() => {
    return () => {
      flushSaveOnboardingState(stateRef.current);
    };
  }, []);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'hidden') {
        flushSaveOnboardingState(stateRef.current);
      }
    };
    const onUnload = () => {
      flushSaveOnboardingState(stateRef.current);
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('beforeunload', onUnload);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('beforeunload', onUnload);
    };
  }, []);

  useEffect(() => {
    if (!hydrated || serverOnboardingComplete === true || isOnboardingComplete()) {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      void saveWorkspaceState({
        onboardingDraftJson: JSON.stringify(stateRef.current),
        skipWorkspaceRefresh: true,
      });
    }, SERVER_DRAFT_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [state, hydrated, saveWorkspaceState, serverOnboardingComplete]);

  const { sectionIndex } = state;

  const refreshLinkedInStatus = useCallback(async () => {
    setLinkedinStatusLoading(true);
    setLinkedinIntegrationError('');
    const r = await fetchLinkedInStatus();
    setLinkedinStatusLoading(false);
    if (r.ok) {
      setState((s) => ({ ...s, socialLinkedin: r.status.isConnected }));
      const hint = [r.status.linkedInName, r.status.linkedInEmail].filter(Boolean).join(' · ');
      setLinkedinProfileHint(hint);
    } else {
      setLinkedinIntegrationError(r.error);
      setLinkedinProfileHint('');
    }
  }, []);

  /** OAuth return: backend redirects with `?linkedin=connected` or `?linkedin_error=...`. */
  useEffect(() => {
    if (!hydrated) return;
    const params = new URLSearchParams(location.search);
    const li = params.get('linkedin');
    const liErr = params.get('linkedin_error');
    if (li === 'connected') {
      params.delete('linkedin');
      const nextSearch = params.toString();
      navigate({ pathname: location.pathname, search: nextSearch ? `?${nextSearch}` : '' }, { replace: true });
      void refreshLinkedInStatus();
      return;
    }
    if (liErr != null && liErr !== '') {
      params.delete('linkedin_error');
      const nextSearch = params.toString();
      navigate({ pathname: location.pathname, search: nextSearch ? `?${nextSearch}` : '' }, { replace: true });
      setLinkedinIntegrationError(decodeURIComponent(liErr.replace(/\+/g, ' ')));
    }
  }, [hydrated, location.pathname, location.search, navigate, refreshLinkedInStatus]);

  /** Real LinkedIn connection state when opening Social & goals (section 3). */
  useEffect(() => {
    if (!hydrated || sectionIndex !== 3) return;
    void refreshLinkedInStatus();
  }, [hydrated, sectionIndex, refreshLinkedInStatus]);

  useEffect(() => {
    if (typeof registerExitSetup !== 'function') return undefined;
    const run = () => {
      if (isOnboardingComplete()) {
        navigate('/app/dashboard');
        return;
      }
      if (
        window.confirm(
          'Sign out and continue later? Progress is synced to your account when online. You can sign in again to resume.',
        )
      ) {
        void (async () => {
          flushSaveOnboardingState(stateRef.current);
          await saveWorkspaceState({
            onboardingDraftJson: JSON.stringify(stateRef.current),
            skipWorkspaceRefresh: true,
          });
          await logout({ preserveOnboardingDraft: true });
          navigate('/auth', { replace: true });
        })();
      }
    };
    registerExitSetup(run);
    return () => {
      registerExitSetup(() => {});
    };
  }, [navigate, registerExitSetup, logout, saveWorkspaceState]);

  /**
   * Website path: Brand DNA preview on business profile (section 1).
   * Do not put `profileScrapeStatus` in the dependency array: going idle→loading re-runs the effect,
   * and cleanup must not call setState (that caused an infinite loop with "Maximum update depth exceeded").
   * Skip work when we already have a successful preview for the current URL.
   */
  useEffect(() => {
    if (!hydrated) return;
    if (sectionIndex !== 1 || state.learningMethod !== 'website') return;
    const url = state.websiteUrl?.trim() ?? '';
    if (!url) return;

    const snap = stateRef.current;
    if (snap.profileScrapeStatus === 'success' && lastSuccessfulPreviewUrlRef.current === url) {
      return;
    }

    const ac = new AbortController();
    setState((s) => ({ ...s, profileScrapeStatus: 'loading', profilePreviewError: '' }));

    void (async () => {
      const result = await previewWebsiteBrandDna(url, { signal: ac.signal });
      if (ac.signal.aborted) return;
      if (!result.ok) {
        if (result.aborted) return;
        setAgentStructuredJsonDisplay('');
        setAgentPreviewError('');
        setState((s) => ({
          ...s,
          profileScrapeStatus: 'error',
          profilePreviewError: result.error,
          websiteBrandDnaAgentSummary: '',
        }));
        return;
      }
      brandDnaPreviewPayloadRef.current = result.data;
      lastSuccessfulPreviewUrlRef.current = url;
      let previewJson = '';
      try {
        previewJson = JSON.stringify(result.data);
      } catch {
        previewJson = '';
      }
      const mapped = mapBrandDnaPreviewToOnboardingFields(result.data);
      setAgentStructuredJsonDisplay('');
      setAgentPreviewError('');
      setState((s) => ({
        ...s,
        profileScrapeStatus: 'success',
        profilePreviewError: '',
        websiteBrandDnaPreviewJson: previewJson,
        websiteBrandDnaAgentSummary: '',
        ...mapped,
      }));
    })();

    return () => {
      ac.abort();
    };
  }, [hydrated, sectionIndex, state.learningMethod, state.websiteUrl]);

  function validateSection0() {
    if (!state.fullName.trim()) return 'Please enter your full name.';
    if (!state.businessName.trim()) return 'Please enter your business name.';
    if (!state.learningMethod) return 'Choose how ONEVO should learn your business.';
    if (state.learningMethod === 'website' && !state.websiteUrl.trim()) return 'Enter your website URL.';
    return '';
  }

  function validateSection1() {
    if (state.learningMethod === 'website' && agentPreviewBusy) {
      return 'Please wait for the AI preview to finish.';
    }
    if (state.learningMethod === 'website' && state.profileScrapeStatus === 'loading') {
      return 'Please wait for the website preview to finish.';
    }
    if (state.learningMethod === 'website' && state.profileScrapeStatus === 'error') {
      return '';
    }
    if (!state.businessType.trim()) return 'Add a business type (or wait for preview).';
    if (!state.shortDescription.trim()) return 'Add a short business description.';
    return '';
  }

  function validateSection3() {
    if (state.goalIds.length < 1) return 'Select at least one goal.';
    return '';
  }

  function goNext() {
    const next = {
      ...stateRef.current,
      sectionIndex: Math.min(stateRef.current.sectionIndex + 1, 3),
    };
    flushSaveOnboardingState(next);
    setState(next);
    setError('');
  }

  function goBack() {
    const next = {
      ...stateRef.current,
      sectionIndex: Math.max(stateRef.current.sectionIndex - 1, 0),
    };
    flushSaveOnboardingState(next);
    setState(next);
    setError('');
  }

  async function handleContinue() {
    let err = '';
    if (sectionIndex === 0) err = validateSection0();
    else if (sectionIndex === 1) err = validateSection1();
    else if (sectionIndex === 2) err = '';
    if (err) {
      setError(err);
      return;
    }
    if (sectionIndex === 0) {
      const cur = stateRef.current;
      const next = { ...cur, sectionIndex: 1 };
      if (cur.learningMethod === 'website') {
        const u = cur.websiteUrl.trim();
        if (u !== lastSuccessfulPreviewUrlRef.current) {
          next.profileScrapeStatus = 'idle';
          next.profilePreviewError = '';
          next.websiteBrandDnaPreviewJson = '';
          next.websiteBrandDnaAgentSummary = '';
          brandDnaPreviewPayloadRef.current = null;
        }
      }
      flushSaveOnboardingState(next);
      setState(next);
      setError('');
      return;
    }
    if (sectionIndex === 2) {
      setBusinessDataSyncBusy(true);
      try {
        const cur = stateRef.current;
        const r = await syncOnboardingBusinessData(cur);
        const nextPatch = { ...(r.statePatch || {}) };
        nextPatch.businessDataApiError = r.ok ? '' : r.error || 'Could not sync business data to the server.';
        if (r.ok) {
          nextPatch.businessDataFileUploadError = '';
          setBusinessDataFileDeleteError('');
          setBusinessDataFileNotice('');
        }
        const next = { ...cur, ...nextPatch, sectionIndex: 3 };
        flushSaveOnboardingState(next);
        setState(next);
        setError('');
      } finally {
        setBusinessDataSyncBusy(false);
      }
      return;
    }
    if (sectionIndex < 3) goNext();
  }

  function handleSkipSection3() {
    const next = {
      ...stateRef.current,
      section3Skipped: true,
      sectionIndex: Math.min(stateRef.current.sectionIndex + 1, 3),
    };
    flushSaveOnboardingState(next);
    setState(next);
    setError('');
  }

  /** Preview DTO for save: in-memory ref (current session) or persisted draft string (after refresh). */
  function resolveWebsiteBrandDnaPreviewForSave() {
    if (brandDnaPreviewPayloadRef.current) {
      return brandDnaPreviewPayloadRef.current;
    }
    const raw = state.websiteBrandDnaPreviewJson;
    if (typeof raw === 'string' && raw.length > 0) {
      try {
        const p = JSON.parse(raw);
        if (p && typeof p === 'object') {
          return p;
        }
      } catch {
        return null;
      }
    }
    return null;
  }

  async function handleFinishSetup() {
    const err = validateSection3();
    if (err) {
      setError(err);
      return;
    }
    setBusy(true);
    setError('');
    try {
      flushSaveOnboardingState(state);
      persistWorkspaceFromOnboarding(state);
      const profileSaved = await upsertBusinessProfileFromOnboardingState(state);
      if (!profileSaved) {
        setError('Could not save your business profile to the server. Please retry.');
        return;
      }
      if (state.learningMethod === 'website') {
        const previewRecord = resolveWebsiteBrandDnaPreviewForSave();
        if (!previewRecord) {
          setError(
            'Your website Brand DNA preview is missing. Go back to the Business profile step and wait for the preview to finish, or use “Clear preview and enter manually”.',
          );
          return;
        }
        const dnaPayload = buildWebsiteBrandDnaSavePayload(previewRecord, state);
        const dnaSave = await saveWebsiteBrandDna(dnaPayload);
        if (!dnaSave.ok) {
          setError(dnaSave.error || 'Could not save website Brand DNA. Try again.');
          return;
        }
      }
      const bd = await syncOnboardingBusinessData(stateRef.current);
      if (bd.statePatch && Object.keys(bd.statePatch).length > 0) {
        Object.assign(stateRef.current, bd.statePatch);
      }
      setState((s) => ({ ...s, ...(bd.statePatch || {}) }));
      flushSaveOnboardingState(stateRef.current);
      const raw = loadWorkspacePayloadFromStorage();
      const ok = await saveWorkspaceState({
        onboardingComplete: true,
        workspaceSnapshot: raw,
        clearOnboardingDraft: true,
      });
      if (!ok) {
        setError('Could not save your setup. Check your connection and try again.');
        return;
      }
      clearOnboardingDraft();
      markDashboardHandoffPendingFromOnboarding();
      navigate('/app/dashboard', { replace: true });
    } finally {
      setBusy(false);
    }
  }

  async function handleLinkedInConnect() {
    setLinkedinConnectBusy(true);
    setLinkedinIntegrationError('');
    const r = await fetchLinkedInAuthorizationUrl();
    setLinkedinConnectBusy(false);
    if (!r.ok) {
      setLinkedinIntegrationError(r.error);
      return;
    }
    window.location.assign(r.authorizationUrl);
  }

  async function handleLinkedInDisconnect() {
    setLinkedinDisconnectBusy(true);
    setLinkedinIntegrationError('');
    const r = await disconnectLinkedIn();
    setLinkedinDisconnectBusy(false);
    if (!r.ok) {
      setLinkedinIntegrationError(r.error);
      return;
    }
    setState((s) => ({ ...s, socialLinkedin: false }));
    setLinkedinProfileHint('');
  }

  function handleFallbackManual() {
    brandDnaPreviewPayloadRef.current = null;
    lastSuccessfulPreviewUrlRef.current = '';
    setAgentStructuredJsonDisplay('');
    setAgentPreviewError('');
    setState((s) => ({
      ...s,
      profileScrapeStatus: 'error',
      learningMethod: 'manual',
      profilePreviewError: '',
      websiteBrandDnaPreviewJson: '',
      websiteBrandDnaAgentSummary: '',
    }));
  }

  async function handlePreviewWithAgent() {
    const url = stateRef.current.websiteUrl?.trim() ?? '';
    if (!url) return;
    setAgentPreviewError('');
    setAgentPreviewBusy(true);
    const result = await previewWebsiteBrandDnaWithAgent(url);
    setAgentPreviewBusy(false);
    if (!result.ok) {
      if (result.aborted) return;
      setAgentPreviewError(result.error || 'AI-assisted preview failed.');
      return;
    }
    const merged = mergeBrandDnaWithAgentResponseToWebExtractionDto(
      /** @type {Record<string, unknown>} */ (result.data),
    );
    if (!merged) {
      setAgentPreviewError('Unexpected response from the server.');
      return;
    }
    const meta = extractAgentPreviewMetadata(/** @type {Record<string, unknown>} */ (result.data));
    brandDnaPreviewPayloadRef.current = merged;
    lastSuccessfulPreviewUrlRef.current = url;
    let previewJson = '';
    try {
      previewJson = JSON.stringify(merged);
    } catch {
      previewJson = '';
    }
    const mapped = mapBrandDnaPreviewToOnboardingFields(merged);
    setAgentStructuredJsonDisplay(meta.websiteBrandDnaAgentStructuredJson || '');
    setState((s) => ({
      ...s,
      profileScrapeStatus: 'success',
      profilePreviewError: '',
      websiteBrandDnaPreviewJson: previewJson,
      websiteBrandDnaAgentSummary: meta.websiteBrandDnaAgentSummary,
      ...mapped,
    }));
  }

  const handleBusinessFileUpload = useCallback(async (slot, event) => {
    const input = event.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    setBusinessDataFileDeleteError('');
    setBusinessDataFileNotice('');

    if (!businessFileExtOk(file.name, slot)) {
      setState((s) => ({
        ...s,
        businessDataFileUploadError: `Could not upload: use ${BUSINESS_FILE_EXT[slot].join(' or ')}.`,
      }));
      return;
    }

    setState((s) => ({ ...s, businessDataFileUploadError: '' }));
    setBusinessDataFileUploading(slot);

    const cur = stateRef.current;
    const ens = await ensureOnboardingManualDataSource(cur.businessDataManualSourceId);
    if (!ens.ok) {
      setBusinessDataFileUploading(null);
      setState((s) => ({
        ...s,
        businessDataFileUploadError: `Could not upload: ${ens.error}`,
      }));
      return;
    }

    const dsId = ens.manualDsId;
    setState((s) => ({
      ...s,
      businessDataManualSourceId: dsId,
    }));

    const up = await uploadBusinessContextFile(file, dsId);
    setBusinessDataFileUploading(null);

    if (!up.ok) {
      setState((s) => ({
        ...s,
        businessDataFileUploadError: `Could not upload: ${up.error}`,
      }));
      return;
    }

    const displayName = up.file.originalFileName || file.name;
    setState((s) => {
      const next = {
        ...s,
        businessDataManualSourceId: dsId,
        businessDataFileUploadError: '',
      };
      if (slot === 'excel') {
        next.businessDataFileExcelId = up.file.id;
        next.dataExcelName = displayName;
      } else if (slot === 'csv') {
        next.businessDataFileCsvId = up.file.id;
        next.dataCsvName = displayName;
      } else {
        next.businessDataFilePhotoId = up.file.id;
        next.dataPhotoName = displayName;
      }
      return next;
    });
    setBusinessDataFileNotice('File uploaded. It will be included when you continue or finish setup.');
  }, []);

  const handleRemoveBusinessFileSlot = useCallback(async (slot) => {
    setBusinessDataFileUploadError('');
    setBusinessDataFileDeleteError('');
    setBusinessDataFileNotice('');
    const cur = stateRef.current;
    const id =
      slot === 'excel'
        ? cur.businessDataFileExcelId
        : slot === 'csv'
          ? cur.businessDataFileCsvId
          : cur.businessDataFilePhotoId;
    const trimmed = String(id ?? '').trim();
    if (!trimmed) {
      setState((s) => {
        const next = { ...s, businessDataFileUploadError: '' };
        if (slot === 'excel') {
          next.dataExcelName = '';
        } else if (slot === 'csv') {
          next.dataCsvName = '';
        } else {
          next.dataPhotoName = '';
        }
        return next;
      });
      return;
    }

    setBusinessDataFileRemoving(slot);
    const del = await deleteBusinessContextFile(trimmed);
    setBusinessDataFileRemoving(null);

    if (!del.ok) {
      setBusinessDataFileDeleteError(
        del.error ? `Could not remove file: ${del.error}` : 'Could not remove file. Try again.',
      );
      return;
    }

    setState((s) => {
      const next = { ...s, businessDataFileUploadError: '' };
      if (slot === 'excel') {
        next.businessDataFileExcelId = '';
        next.dataExcelName = '';
      } else if (slot === 'csv') {
        next.businessDataFileCsvId = '';
        next.dataCsvName = '';
      } else {
        next.businessDataFilePhotoId = '';
        next.dataPhotoName = '';
      }
      return next;
    });
    setBusinessDataFileNotice('File removed from your account.');
  }, []);

  if (!hydrated) {
    return <div className="onboarding onboarding--loading" aria-busy="true" />;
  }

  const isWebsitePath = state.learningMethod === 'website';
  const showProfileLoading = sectionIndex === 1 && isWebsitePath && state.profileScrapeStatus === 'loading';
  const showProfileForm =
    sectionIndex === 1 &&
    (state.learningMethod === 'manual' ||
      state.profileScrapeStatus === 'success' ||
      state.profileScrapeStatus === 'error');

  const businessDataFileRowBusy =
    businessDataFileUploading !== null || businessDataFileRemoving !== null || businessDataSyncBusy;

  return (
    <div className="onboarding onboarding--mvp">
      <OnboardingMvpProgress sectionIndex={sectionIndex} />

      {error ? (
        <p className="onboarding-error" role="alert">
          {error}
        </p>
      ) : null}

      {sectionIndex === 0 && (
        <section className="onboarding-mvp-section" aria-labelledby="onb-s1-title">
          <h1 id="onb-s1-title" className="onboarding-mvp-title">
            About your business
          </h1>
          <p className="onboarding-mvp-lede">Who you are and how we should start learning your business.</p>

          <label className="onboarding-mvp-label" htmlFor="fullName">
            Full name
          </label>
          <input
            id="fullName"
            className="onboarding-mvp-input"
            value={state.fullName}
            onChange={(e) => setState((s) => ({ ...s, fullName: e.target.value }))}
            autoComplete="name"
          />

          <p className="onboarding-mvp-label">Your role</p>
          <div className="onboarding-chip-grid onboarding-chip-grid--chat" role="group">
            {ROLE_OPTIONS.map((r) => (
              <button
                key={r.id}
                type="button"
                className={`onboarding-chip ${state.role === r.id ? 'active' : ''}`}
                onClick={() => setState((s) => ({ ...s, role: s.role === r.id ? '' : r.id }))}
              >
                {r.label}
              </button>
            ))}
          </div>

          <label className="onboarding-mvp-label" htmlFor="bizName">
            Business name
          </label>
          <input
            id="bizName"
            className="onboarding-mvp-input"
            value={state.businessName}
            onChange={(e) => setState((s) => ({ ...s, businessName: e.target.value }))}
            autoComplete="organization"
          />

          <p className="onboarding-mvp-label">How should ONEVO learn your business?</p>
          <div className="onboarding-mvp-method-grid" role="group">
            {LEARNING_METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`onboarding-mvp-method ${state.learningMethod === m.id ? 'active' : ''}`}
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    learningMethod: m.id,
                    websiteUrl: m.id === 'manual' ? '' : s.websiteUrl,
                  }))
                }
              >
                {m.label}
              </button>
            ))}
          </div>

          {state.learningMethod === 'website' ? (
            <>
              <label className="onboarding-mvp-label" htmlFor="websiteUrl">
                Website URL
              </label>
              <input
                id="websiteUrl"
                type="url"
                inputMode="url"
                className="onboarding-mvp-input"
                placeholder="https://"
                value={state.websiteUrl}
                onChange={(e) => setState((s) => ({ ...s, websiteUrl: e.target.value }))}
              />
            </>
          ) : null}

          <div className="onboarding-mvp-actions">
            <button type="button" className="onboarding-btn onboarding-btn--primary" onClick={() => void handleContinue()}>
              Continue
            </button>
          </div>
        </section>
      )}

      {sectionIndex === 1 && (
        <section className="onboarding-mvp-section" aria-labelledby="onb-s2-title">
          <h1 id="onb-s2-title" className="onboarding-mvp-title">
            Business profile
          </h1>
          <p className="onboarding-mvp-lede">What kind of business is this, and how should ONEVO understand it?</p>

          {showProfileLoading ? (
            <div className="onboarding-mvp-loading" aria-busy="true">
              <OnevoLogo className="dashboard-logo onboarding-mvp-loading-logo" />
              <p>Analyzing your website…</p>
              <p className="onboarding-mvp-hint">This is a preview. You can edit everything next.</p>
            </div>
          ) : null}

          {state.learningMethod === 'website' && state.profileScrapeStatus === 'error' ? (
            <div className="onboarding-mvp-banner" role="alert">
              <p>We couldn&apos;t read that website automatically.</p>
              {state.profilePreviewError ? (
                <p className="onboarding-mvp-hint">{state.profilePreviewError}</p>
              ) : null}
              <p>Enter your business details manually below.</p>
            </div>
          ) : null}

          {state.learningMethod === 'website' &&
          !showProfileLoading &&
          (state.profileScrapeStatus === 'success' || state.profileScrapeStatus === 'error') &&
          state.websiteUrl.trim() ? (
            <div className="onboarding-mvp-agent-tools">
              <p className="onboarding-mvp-hint">
                {state.profileScrapeStatus === 'success'
                  ? 'Optional: run the Website Brand DNA agent on the same URL to merge AI-refined fields into your preview (uses POST /preview-with-agent).'
                  : 'Optional: try an AI-assisted preview that scrapes the URL and runs the Website Brand DNA agent — it may work when the basic preview failed.'}
              </p>
              <button
                type="button"
                className="onboarding-btn onboarding-btn--ghost"
                disabled={agentPreviewBusy}
                onClick={() => void handlePreviewWithAgent()}
              >
                {agentPreviewBusy ? 'Running AI preview…' : 'Preview with AI agent'}
              </button>
              {agentPreviewError ? (
                <p className="onboarding-error" role="alert">
                  {agentPreviewError}
                </p>
              ) : null}
              {state.websiteBrandDnaAgentSummary ? (
                <>
                  <p className="onboarding-mvp-sublabel onboarding-mvp-agent-summary-label">Agent summary (from API)</p>
                  <p className="onboarding-mvp-hint">{state.websiteBrandDnaAgentSummary}</p>
                </>
              ) : null}
              {agentStructuredJsonDisplay ? (
                <details className="onboarding-mvp-agent-details">
                  <summary>Agent structured JSON (from API)</summary>
                  <pre className="onboarding-mvp-pre-scroll">{agentStructuredJsonDisplay}</pre>
                </details>
              ) : null}
            </div>
          ) : null}

          {showProfileForm ? (
            <>
              <label className="onboarding-mvp-label" htmlFor="businessType">
                Business type
              </label>
              <input
                id="businessType"
                className="onboarding-mvp-input"
                value={state.businessType}
                onChange={(e) => setState((s) => ({ ...s, businessType: e.target.value }))}
              />

              <label className="onboarding-mvp-label" htmlFor="products">
                Products or services
              </label>
              <textarea
                id="products"
                className="onboarding-mvp-textarea"
                rows={2}
                value={state.productsOrServices}
                onChange={(e) => setState((s) => ({ ...s, productsOrServices: e.target.value }))}
              />

              <label className="onboarding-mvp-label" htmlFor="location">
                Location
              </label>
              <input
                id="location"
                className="onboarding-mvp-input"
                value={state.location}
                onChange={(e) => setState((s) => ({ ...s, location: e.target.value }))}
              />

              <label className="onboarding-mvp-label" htmlFor="tone">
                Brand tone
              </label>
              <input
                id="tone"
                className="onboarding-mvp-input"
                value={state.brandTone}
                onChange={(e) => setState((s) => ({ ...s, brandTone: e.target.value }))}
              />

              <label className="onboarding-mvp-label" htmlFor="targets">
                Target customers
              </label>
              <textarea
                id="targets"
                className="onboarding-mvp-textarea"
                rows={2}
                value={state.targetCustomers}
                onChange={(e) => setState((s) => ({ ...s, targetCustomers: e.target.value }))}
              />

              <label className="onboarding-mvp-label" htmlFor="shortDesc">
                Short business description
              </label>
              <textarea
                id="shortDesc"
                className="onboarding-mvp-textarea"
                rows={3}
                value={state.shortDescription}
                onChange={(e) => setState((s) => ({ ...s, shortDescription: e.target.value }))}
              />

              {state.learningMethod === 'website' && state.profileScrapeStatus === 'success' ? (
                <button type="button" className="onboarding-btn onboarding-btn--ghost onboarding-mvp-retry" onClick={handleFallbackManual}>
                  Clear preview and enter manually
                </button>
              ) : null}
            </>
          ) : null}

          <div className="onboarding-mvp-actions">
            <button type="button" className="onboarding-btn onboarding-btn--ghost" onClick={goBack}>
              Back
            </button>
            <button
              type="button"
              className="onboarding-btn onboarding-btn--primary"
              onClick={() => void handleContinue()}
              disabled={showProfileLoading || agentPreviewBusy}
            >
              Continue
            </button>
          </div>
        </section>
      )}

      {sectionIndex === 2 && (
        <section className="onboarding-mvp-section" aria-labelledby="onb-s3-title">
          <h1 id="onb-s3-title" className="onboarding-mvp-title">
            Business data
          </h1>
          <p className="onboarding-mvp-lede">How do you currently track your business?</p>

          {state.businessDataApiError ? (
            <p className="onboarding-error" role="status">
              {state.businessDataApiError}
            </p>
          ) : null}

          <p className="onboarding-mvp-sublabel">Connected systems (optional)</p>
          <div className="onboarding-mvp-toggles">
            <label className="onboarding-mvp-check">
              <input
                type="checkbox"
                checked={state.trackPos}
                onChange={(e) => setState((s) => ({ ...s, trackPos: e.target.checked }))}
              />
              POS system
            </label>
            <label className="onboarding-mvp-check">
              <input
                type="checkbox"
                checked={state.trackBooking}
                onChange={(e) => setState((s) => ({ ...s, trackBooking: e.target.checked }))}
              />
              Booking app
            </label>
            <label className="onboarding-mvp-check">
              <input
                type="checkbox"
                checked={state.trackGoogleBusiness}
                onChange={(e) => setState((s) => ({ ...s, trackGoogleBusiness: e.target.checked }))}
              />
              Google Business Profile
            </label>
          </div>

          <p className="onboarding-mvp-sublabel">Manual data (optional)</p>
          <p className="onboarding-mvp-hint">
            You can skip this whole section. If you add files or notes, they are saved when you continue or finish
            setup. If an upload or remove fails, you will see a message below—you can still continue without files.
          </p>
          {state.businessDataFileUploadError ? (
            <p className="onboarding-error" role="status">
              {state.businessDataFileUploadError}
            </p>
          ) : null}
          {businessDataFileDeleteError ? (
            <p className="onboarding-error" role="status">
              {businessDataFileDeleteError}
            </p>
          ) : null}
          {businessDataFileNotice ? (
            <p className="onboarding-mvp-notice" role="status">
              {businessDataFileNotice}
            </p>
          ) : null}

          <label className="onboarding-mvp-label" htmlFor="excel">
            Excel spreadsheet
          </label>
          <div className="onboarding-mvp-file-row">
            <input
              id="excel"
              className="onboarding-mvp-input"
              readOnly={Boolean(state.businessDataFileExcelId)}
              value={state.dataExcelName}
              placeholder="e.g. sales_q1.xlsx or upload"
              onChange={(e) => setState((s) => ({ ...s, dataExcelName: e.target.value }))}
            />
            <input
              ref={excelFileInputRef}
              type="file"
              className="visually-hidden"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              aria-hidden
              tabIndex={-1}
              onChange={(e) => void handleBusinessFileUpload('excel', e)}
            />
            <button
              type="button"
              className="onboarding-btn onboarding-btn--ghost"
              disabled={businessDataFileRowBusy}
              onClick={() => excelFileInputRef.current?.click()}
            >
              {businessDataFileUploading === 'excel' ? 'Uploading…' : 'Upload'}
            </button>
            {state.businessDataFileExcelId ? (
              <button
                type="button"
                className="onboarding-btn onboarding-btn--ghost"
                disabled={businessDataFileRowBusy}
                onClick={() => void handleRemoveBusinessFileSlot('excel')}
              >
                {businessDataFileRemoving === 'excel' ? 'Removing…' : 'Remove'}
              </button>
            ) : null}
          </div>

          <label className="onboarding-mvp-label" htmlFor="csv">
            CSV file
          </label>
          <div className="onboarding-mvp-file-row">
            <input
              id="csv"
              className="onboarding-mvp-input"
              readOnly={Boolean(state.businessDataFileCsvId)}
              value={state.dataCsvName}
              placeholder="e.g. export.csv or upload"
              onChange={(e) => setState((s) => ({ ...s, dataCsvName: e.target.value }))}
            />
            <input
              ref={csvFileInputRef}
              type="file"
              className="visually-hidden"
              accept=".csv,text/csv"
              aria-hidden
              tabIndex={-1}
              onChange={(e) => void handleBusinessFileUpload('csv', e)}
            />
            <button
              type="button"
              className="onboarding-btn onboarding-btn--ghost"
              disabled={businessDataFileRowBusy}
              onClick={() => csvFileInputRef.current?.click()}
            >
              {businessDataFileUploading === 'csv' ? 'Uploading…' : 'Upload'}
            </button>
            {state.businessDataFileCsvId ? (
              <button
                type="button"
                className="onboarding-btn onboarding-btn--ghost"
                disabled={businessDataFileRowBusy}
                onClick={() => void handleRemoveBusinessFileSlot('csv')}
              >
                {businessDataFileRemoving === 'csv' ? 'Removing…' : 'Remove'}
              </button>
            ) : null}
          </div>

          <label className="onboarding-mvp-label" htmlFor="wordDoc">
            Word document
          </label>
          <p className="onboarding-mvp-hint onboarding-mvp-hint--tight">
            Only Microsoft Word .doc or .docx files. Photos, screenshots, and other images are not supported yet.
          </p>
          <div className="onboarding-mvp-file-row">
            <input
              id="wordDoc"
              className="onboarding-mvp-input"
              readOnly={Boolean(state.businessDataFilePhotoId)}
              value={state.dataPhotoName}
              placeholder="e.g. summary.docx or upload"
              onChange={(e) => setState((s) => ({ ...s, dataPhotoName: e.target.value }))}
            />
            <input
              ref={photoFileInputRef}
              type="file"
              className="visually-hidden"
              accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              aria-hidden
              tabIndex={-1}
              onChange={(e) => void handleBusinessFileUpload('photo', e)}
            />
            <button
              type="button"
              className="onboarding-btn onboarding-btn--ghost"
              disabled={businessDataFileRowBusy}
              onClick={() => photoFileInputRef.current?.click()}
            >
              {businessDataFileUploading === 'photo' ? 'Uploading…' : 'Upload'}
            </button>
            {state.businessDataFilePhotoId ? (
              <button
                type="button"
                className="onboarding-btn onboarding-btn--ghost"
                disabled={businessDataFileRowBusy}
                onClick={() => void handleRemoveBusinessFileSlot('photo')}
              >
                {businessDataFileRemoving === 'photo' ? 'Removing…' : 'Remove'}
              </button>
            ) : null}
          </div>

          <label className="onboarding-mvp-label" htmlFor="notes">
            Anything else about how you track performance?
          </label>
          <textarea
            id="notes"
            className="onboarding-mvp-textarea"
            rows={3}
            value={state.dataManualNotes}
            onChange={(e) => setState((s) => ({ ...s, dataManualNotes: e.target.value }))}
          />

          <div className="onboarding-mvp-actions">
            <button
              type="button"
              className="onboarding-btn onboarding-btn--ghost"
              onClick={goBack}
              disabled={businessDataFileRowBusy}
            >
              Back
            </button>
            <button
              type="button"
              className="onboarding-btn onboarding-btn--ghost"
              onClick={handleSkipSection3}
              disabled={businessDataFileRowBusy}
            >
              Skip for now
            </button>
            <button
              type="button"
              className="onboarding-btn onboarding-btn--primary"
              onClick={() => void handleContinue()}
              disabled={businessDataFileRowBusy}
            >
              {businessDataSyncBusy ? 'Saving…' : 'Continue'}
            </button>
          </div>
        </section>
      )}

      {sectionIndex === 3 && (
        <section className="onboarding-mvp-section onboarding-mvp-section--s4" aria-labelledby="onb-s4-title">
          <h1 id="onb-s4-title" className="onboarding-mvp-title">
            Social channels &amp; goals
          </h1>
          <p className="onboarding-mvp-lede">Where should ONEVO show up, and what should we focus on first?</p>

          <div className="onboarding-mvp-s4-block">
            <h2 className="onboarding-mvp-s4-heading">Social channels (optional)</h2>
            <p className="onboarding-mvp-s4-hint">Connect now or skip — you can add these later in Integrations.</p>
            {linkedinIntegrationError ? (
              <p className="onboarding-error" role="status">
                {linkedinIntegrationError}
              </p>
            ) : null}
            <div className="onboarding-mvp-social">
              {[
                { id: 'facebook', label: 'Facebook Page', key: 'socialFacebook' },
                { id: 'instagram', label: 'Instagram', key: 'socialInstagram' },
              ].map((ch) => {
                const connected = state[ch.key];
                const connecting = state.socialConnectingId === ch.id;
                const isComingSoon = true;
                return (
                  <div key={ch.id} className="onboarding-mvp-social-row">
                    <span>{ch.label}</span>
                    <button
                      type="button"
                      className="onboarding-btn onboarding-btn--secondary"
                      disabled={
                        isComingSoon ||
                        connected ||
                        (Boolean(state.socialConnectingId) && !connecting) ||
                        linkedinStatusLoading ||
                        linkedinConnectBusy ||
                        linkedinDisconnectBusy
                      }
                      onClick={() => {
                        if (isComingSoon) {
                          return;
                        }
                        setState((s) => ({ ...s, socialConnectingId: ch.id }));
                        /* MOCK: demo only — not real OAuth. */
                        window.setTimeout(() => {
                          setState((s) => ({
                            ...s,
                            socialConnectingId: null,
                            [ch.key]: true,
                          }));
                        }, 700);
                      }}
                    >
                      {isComingSoon ? 'Coming soon' : connecting ? 'Connecting…' : connected ? 'Connected' : 'Connect'}
                    </button>
                  </div>
                );
              })}
              <div className="onboarding-mvp-social-row">
                <span title={linkedinProfileHint || undefined}>LinkedIn</span>
                {state.socialLinkedin ? (
                  <>
                    <span className="onboarding-mvp-hint">
                      Connected{linkedinProfileHint ? ` · ${linkedinProfileHint}` : ''}
                    </span>
                    <button
                      type="button"
                      className="onboarding-btn onboarding-btn--secondary"
                      disabled={
                        linkedinStatusLoading ||
                        linkedinConnectBusy ||
                        linkedinDisconnectBusy ||
                        Boolean(state.socialConnectingId)
                      }
                      onClick={() => void handleLinkedInDisconnect()}
                    >
                      {linkedinDisconnectBusy ? 'Disconnecting…' : 'Disconnect'}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="onboarding-btn onboarding-btn--secondary"
                    disabled={
                      linkedinStatusLoading ||
                      linkedinConnectBusy ||
                      linkedinDisconnectBusy ||
                      Boolean(state.socialConnectingId)
                    }
                    onClick={() => void handleLinkedInConnect()}
                  >
                    {linkedinStatusLoading ? 'Checking…' : linkedinConnectBusy ? 'Redirecting…' : 'Connect'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="onboarding-mvp-s4-block">
            <h2 className="onboarding-mvp-s4-heading">Goals (choose up to {MAX_GOALS})</h2>
            <p className="onboarding-mvp-s4-hint">Pick at least one — we&apos;ll prioritize these on your dashboard.</p>
            <div className="onboarding-goal-grid onboarding-goal-grid--chat onboarding-goal-grid--s4" role="group">
              {GOAL_OPTIONS.map((g) => {
                const selected = state.goalIds.includes(g.id);
                const atLimit = state.goalIds.length >= MAX_GOALS && !selected;
                return (
                  <button
                    key={g.id}
                    type="button"
                    disabled={atLimit}
                    className={`onboarding-goal-card ${selected ? 'active' : ''}`}
                    onClick={() => setState((s) => ({ ...s, goalIds: toggleGoal(s.goalIds, g.id) }))}
                  >
                    <span className="onboarding-goal-title">{g.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="onboarding-mvp-s4-block onboarding-mvp-s4-block--review">
            <h2 className="onboarding-mvp-s4-heading">Review</h2>
            <ul className="onboarding-mvp-review">
              <li>
                <strong>Name</strong> {state.fullName || '—'}
              </li>
              <li>
                <strong>Business</strong> {state.businessName || '—'}
              </li>
              <li>
                <strong>Learning</strong>{' '}
                {state.learningMethod === 'website' ? `Website: ${state.websiteUrl || '—'}` : 'Manual entry'}
              </li>
              <li>
                <strong>Profile</strong> {state.shortDescription ? `${state.shortDescription.slice(0, 80)}…` : '—'}
              </li>
              <li>
                <strong>Goals</strong>{' '}
                {state.goalIds.length
                  ? state.goalIds.map((id) => GOAL_OPTIONS.find((g) => g.id === id)?.label).join(', ')
                  : '—'}
              </li>
            </ul>
          </div>

          <div className="onboarding-mvp-actions">
            <button type="button" className="onboarding-btn onboarding-btn--ghost" onClick={goBack}>
              Back
            </button>
            <button type="button" className="onboarding-btn onboarding-btn--ghost" onClick={() => setState((s) => ({ ...s, sectionIndex: 0 }))}>
              Edit
            </button>
            <button
              type="button"
              className="onboarding-btn onboarding-btn--primary"
              onClick={handleFinishSetup}
              disabled={busy}
            >
              {busy ? 'Finishing…' : 'Finish setup'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
