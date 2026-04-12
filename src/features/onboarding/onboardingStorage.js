/**
 * Single module for MVP onboarding localStorage: draft, completion flag, legacy cleanup.
 * Workspace merge stays in `onboardingWorkspaceMerge.js`.
 * Auth state is determined by `GET /api/auth/google/session` via `AuthProvider` — not by a client session flag.
 */

/** Legacy key removed on sign-out; kept for cleanup of older builds. */
const AUTH_SESSION_KEY = 'onevo_auth_session_v1';

const WORKSPACE_STORAGE_KEY = 'onevo_workspace_setup_v1';

/** In-progress onboarding (autosave while incomplete) */
export const ONBOARDING_DRAFT_KEY = 'onevo_onboarding_mvp_v1';

/** Set to `'1'` when user clicks Finish setup */
export const ONBOARDING_COMPLETE_KEY = 'onevo_onboarding_complete_v1';

const LEGACY_DRAFT_KEY = 'onevo_onboarding_v1';

let legacyCleanupDone = false;

/** Call once when onboarding UI mounts — removes pre-MVP draft key only */
export function runLegacyOnboardingCleanupOnce() {
  if (typeof window === 'undefined' || legacyCleanupDone) return;
  legacyCleanupDone = true;
  try {
    window.localStorage.removeItem(LEGACY_DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

export function isOnboardingComplete() {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(ONBOARDING_COMPLETE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setOnboardingComplete() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ONBOARDING_COMPLETE_KEY, '1');
  } catch {
    /* ignore */
  }
}

/** Dev / QA reset */
export function clearOnboardingCompleteFlag() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(ONBOARDING_COMPLETE_KEY);
  } catch {
    /* ignore */
  }
}

function clearWorkspacePayload() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(WORKSPACE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Clears local onboarding/workspace cache. Call after `POST /api/auth/google/logout` for a full sign-out from the shell.
 */
export function signOutClientSession() {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(AUTH_SESSION_KEY);
    } catch {
      /* ignore */
    }
  }
  clearWorkspacePayload();
  clearOnboardingCompleteFlag();
  clearOnboardingDraft();
}

/**
 * After server logout while the user may resume onboarding: drop workspace + legacy keys only (keep draft + completion flag).
 */
export function clearWorkspaceOnlyAfterLogout() {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(AUTH_SESSION_KEY);
    } catch {
      /* ignore */
    }
  }
  clearWorkspacePayload();
}

export function createInitialState() {
  return {
    version: 2,
    sectionIndex: 0,
    fullName: '',
    role: '',
    businessName: '',
    learningMethod: '',
    websiteUrl: '',
    profileScrapeStatus: 'idle',
    businessType: '',
    productsOrServices: '',
    location: '',
    brandTone: '',
    targetCustomers: '',
    shortDescription: '',
    trackPos: false,
    trackBooking: false,
    trackGoogleBusiness: false,
    dataExcelName: '',
    dataCsvName: '',
    dataPhotoName: '',
    dataManualNotes: '',
    section3Skipped: false,
    socialFacebook: false,
    socialInstagram: false,
    socialLinkedin: false,
    socialConnectingId: null,
    goalIds: [],
  };
}

export function loadOnboardingState() {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(ONBOARDING_DRAFT_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return null;
    }
    return { ...createInitialState(), ...parsed };
  } catch {
    return null;
  }
}

export function saveOnboardingState(state) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(state));
  } catch {
    /* quota */
  }
}

let localDraftTimer = null;
const LOCAL_DRAFT_DEBOUNCE_MS = 450;

/**
 * Debounced localStorage write — avoids JSON.stringify + sync localStorage on every keystroke (main thread jank in Edge).
 * Call {@link flushSaveOnboardingState} before navigation / finish / tab hide for durability.
 */
export function scheduleSaveOnboardingState(state) {
  if (typeof window === 'undefined') {
    return;
  }
  window.clearTimeout(localDraftTimer);
  localDraftTimer = window.setTimeout(() => {
    localDraftTimer = null;
    saveOnboardingState(state);
  }, LOCAL_DRAFT_DEBOUNCE_MS);
}

export function cancelScheduledOnboardingSave() {
  if (typeof window === 'undefined') {
    return;
  }
  window.clearTimeout(localDraftTimer);
  localDraftTimer = null;
}

/** Immediate persist; clears any pending debounced write. */
export function flushSaveOnboardingState(state) {
  if (typeof window === 'undefined') {
    return;
  }
  window.clearTimeout(localDraftTimer);
  localDraftTimer = null;
  saveOnboardingState(state);
}

export function clearOnboardingDraft() {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.removeItem(ONBOARDING_DRAFT_KEY);
  } catch {
    /* ignore */
  }
}
