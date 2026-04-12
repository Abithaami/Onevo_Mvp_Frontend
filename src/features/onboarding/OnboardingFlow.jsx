/**
 * MVP onboarding wizard (4 sections). Local draft + completion flags live in `onboardingStorage.js`.
 *
 * MOCK (replace with API when backend exists):
 * - Website “profile scrape” (`mockExtractedProfile` + delayed `setTimeout`) — simulates extraction from URL.
 * - Social “Connect” buttons — `setTimeout` fake success; no OAuth or Graph API calls.
 */
import { memo, useEffect, useRef, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
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
import './onboarding.css';

function toggleGoal(ids, id) {
  if (ids.includes(id)) return ids.filter((g) => g !== id);
  if (ids.length >= MAX_GOALS) return ids;
  return [...ids, id];
}

/** MOCK: static payload standing in for a future `/api/brand/extract` or similar scrape response. */
function mockExtractedProfile() {
  return {
    businessType: 'Local service business',
    productsOrServices: 'Consulting, recurring services',
    location: 'United States',
    brandTone: 'Friendly and professional',
    targetCustomers: 'Small business owners',
    shortDescription: 'We help local businesses grow with practical marketing and clear reporting.',
  };
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
  const stateRef = useRef(state);
  stateRef.current = state;

  /** Once true, ignore provider `onboardingDraftJson` updates (e.g. after autosave) so the form is not reset while typing. */
  const didHydrateFromWorkspace = useRef(false);

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

  /** MOCK: website scrape simulation when entering business profile from website path */
  useEffect(() => {
    if (sectionIndex !== 1 || state.learningMethod !== 'website') return;
    if (state.profileScrapeStatus !== 'idle') return;
    setState((s) => ({ ...s, profileScrapeStatus: 'loading' }));
    const t = window.setTimeout(() => {
      const extracted = mockExtractedProfile();
      setState((s) => ({
        ...s,
        profileScrapeStatus: 'success',
        ...extracted,
      }));
    }, 1600);
    return () => window.clearTimeout(t);
  }, [sectionIndex, state.learningMethod, state.profileScrapeStatus]);

  function validateSection0() {
    if (!state.fullName.trim()) return 'Please enter your full name.';
    if (!state.businessName.trim()) return 'Please enter your business name.';
    if (!state.learningMethod) return 'Choose how ONEVO should learn your business.';
    if (state.learningMethod === 'website' && !state.websiteUrl.trim()) return 'Enter your website URL.';
    return '';
  }

  function validateSection1() {
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

  function handleContinue() {
    let err = '';
    if (sectionIndex === 0) err = validateSection0();
    else if (sectionIndex === 1) err = validateSection1();
    else if (sectionIndex === 2) err = '';
    if (err) {
      setError(err);
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
      await upsertBusinessProfileFromOnboardingState(state);
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

  function handleFallbackManual() {
    setState((s) => ({
      ...s,
      profileScrapeStatus: 'error',
      learningMethod: 'manual',
    }));
  }

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
            <button type="button" className="onboarding-btn onboarding-btn--primary" onClick={handleContinue}>
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
            <div className="onboarding-mvp-banner" role="status">
              <p>We couldn&apos;t read that website automatically. Enter your business details manually below.</p>
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
              onClick={handleContinue}
              disabled={showProfileLoading}
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
          <p className="onboarding-mvp-hint">Uploads are stored as filenames for now — file upload can be wired later.</p>
          <label className="onboarding-mvp-label" htmlFor="excel">
            Excel file name
          </label>
          <input
            id="excel"
            className="onboarding-mvp-input"
            value={state.dataExcelName}
            placeholder="e.g. sales_q1.xlsx"
            onChange={(e) => setState((s) => ({ ...s, dataExcelName: e.target.value }))}
          />
          <label className="onboarding-mvp-label" htmlFor="csv">
            CSV file name
          </label>
          <input
            id="csv"
            className="onboarding-mvp-input"
            value={state.dataCsvName}
            onChange={(e) => setState((s) => ({ ...s, dataCsvName: e.target.value }))}
          />
          <label className="onboarding-mvp-label" htmlFor="photo">
            Photo / screenshot name
          </label>
          <input
            id="photo"
            className="onboarding-mvp-input"
            value={state.dataPhotoName}
            onChange={(e) => setState((s) => ({ ...s, dataPhotoName: e.target.value }))}
          />

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
            <button type="button" className="onboarding-btn onboarding-btn--ghost" onClick={goBack}>
              Back
            </button>
            <button type="button" className="onboarding-btn onboarding-btn--ghost" onClick={handleSkipSection3}>
              Skip for now
            </button>
            <button type="button" className="onboarding-btn onboarding-btn--primary" onClick={handleContinue}>
              Continue
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
            <div className="onboarding-mvp-social">
              {[
                { id: 'facebook', label: 'Facebook Page', key: 'socialFacebook' },
                { id: 'instagram', label: 'Instagram', key: 'socialInstagram' },
                { id: 'linkedin', label: 'LinkedIn', key: 'socialLinkedin' },
              ].map((ch) => {
                const connected = state[ch.key];
                const connecting = state.socialConnectingId === ch.id;
                return (
                  <div key={ch.id} className="onboarding-mvp-social-row">
                    <span>{ch.label}</span>
                    <button
                      type="button"
                      className="onboarding-btn onboarding-btn--secondary"
                      disabled={connected || (Boolean(state.socialConnectingId) && !connecting)}
                      onClick={() => {
                        setState((s) => ({ ...s, socialConnectingId: ch.id }));
                        /* MOCK: instant fake success — replace with OAuth popup / backend callback. */
                        window.setTimeout(() => {
                          setState((s) => ({
                            ...s,
                            socialConnectingId: null,
                            [ch.key]: true,
                          }));
                        }, 700);
                      }}
                    >
                      {connecting ? 'Connecting…' : connected ? 'Connected' : 'Connect'}
                    </button>
                  </div>
                );
              })}
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
