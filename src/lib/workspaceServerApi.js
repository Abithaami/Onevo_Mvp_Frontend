/**
 * Workspace + business profile API alignment.
 * Primary workspace/onboarding: `GET/PUT /api/me/workspace-state` (authoritative when online).
 */
import { apiUrl } from './apiBase.js';

export const WORKSPACE_STORAGE_KEY = 'onevo_workspace_setup_v1';

/**
 * Server snapshot wins for overlapping keys; merges nested brand/growth/connection.
 * @param {Record<string, unknown>} local
 * @param {Record<string, unknown>} server
 */
export function mergeWorkspaceLocalAndServer(local, server) {
  if (!server || typeof server !== 'object') {
    return local && typeof local === 'object' ? { ...local } : {};
  }
  const l = local && typeof local === 'object' ? local : {};
  return {
    ...l,
    ...server,
    brandData: { ...(l.brandData || {}), ...(server.brandData || {}) },
    growthData: { ...(l.growthData || {}), ...(server.growthData || {}) },
    connectionData: { ...(l.connectionData || {}), ...(server.connectionData || {}) },
    stepStates: server.stepStates ?? l.stepStates,
  };
}

export function loadWorkspacePayloadFromStorage() {
  if (typeof window === 'undefined') {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * @returns {Promise<Record<string, unknown> | null>}
 */
export async function fetchUserWorkspaceState() {
  try {
    const res = await fetch(apiUrl('/api/me/workspace-state/'), {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (res.status === 401) {
      return null;
    }
    if (!res.ok) {
      return null;
    }
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * @param {{ onboardingComplete?: boolean | null, workspaceSnapshotJson?: string | null, onboardingDraftJson?: string | null, clearOnboardingDraft?: boolean }} payload
 */
export async function putUserWorkspaceState(payload) {
  const body = {
    onboardingComplete: payload.onboardingComplete ?? null,
    workspaceSnapshotJson: payload.workspaceSnapshotJson ?? null,
    onboardingDraftJson: payload.onboardingDraftJson ?? null,
    clearOnboardingDraft: Boolean(payload.clearOnboardingDraft),
  };
  const hasPayload =
    body.onboardingComplete != null ||
    body.workspaceSnapshotJson != null ||
    body.onboardingDraftJson != null ||
    body.clearOnboardingDraft;
  if (!hasPayload) {
    return false;
  }
  try {
    const res = await fetch(apiUrl('/api/me/workspace-state/'), {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * @param {unknown} raw
 * @returns {any[] | null}
 */
function parseProfileList(raw) {
  if (!Array.isArray(raw)) return null;
  return raw;
}

/**
 * @returns {Promise<any[] | null>}
 */
export async function fetchBusinessProfiles() {
  try {
    const res = await fetch(apiUrl('/api/business-context/profiles/'), {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (res.status === 401) return null;
    if (!res.ok) return null;
    const json = await res.json();
    return parseProfileList(json);
  } catch {
    return null;
  }
}

/**
 * Fills empty brand fields from the first server profile; keeps local values when already set (onboarding wins).
 * @param {Record<string, unknown> | null} localRaw
 * @param {any[] | null} profiles
 */
export function mergeServerProfilesIntoLocalPayload(localRaw, profiles) {
  if (!profiles?.length) {
    return localRaw && typeof localRaw === 'object' ? { ...localRaw } : {};
  }
  const p = profiles[0];
  const id = p.id ?? p.Id;
  const businessName = p.businessName ?? p.BusinessName ?? '';
  const industry = p.industry ?? p.Industry ?? '';
  const primaryMarket = p.primaryMarket ?? p.PrimaryMarket ?? '';

  const local = localRaw && typeof localRaw === 'object' ? { ...localRaw } : {};
  const brandData = { ...(local.brandData || {}) };

  if (!String(brandData.businessName || '').trim() && businessName) {
    brandData.businessName = businessName;
  }
  if (!String(brandData.industry || '').trim() && industry) {
    brandData.industry = industry;
  }
  if (!String(brandData.serviceArea || '').trim() && primaryMarket) {
    brandData.serviceArea = primaryMarket;
  }

  const next = { ...local, brandData };
  if (id) {
    next.serverBusinessProfileId = id;
  }
  return next;
}

/**
 * Upsert tenant business profile from onboarding business fields (best-effort; ignores network errors).
 * @param {{ businessName?: string, businessType?: string, location?: string }} state
 */
export async function upsertBusinessProfileFromOnboardingState(state) {
  const businessName = state.businessName?.trim() || 'My workspace';
  const industry = state.businessType?.trim() || 'General';
  const primaryMarket = state.location?.trim() || 'Not specified';

  const list = await fetchBusinessProfiles();
  const body = JSON.stringify({
    businessName,
    industry,
    primaryMarket,
  });

  try {
    if (list?.length) {
      const p = list[0];
      const id = p.id ?? p.Id;
      const res = await fetch(apiUrl(`/api/business-context/profiles/${id}`), {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body,
      });
      return res.ok;
    }
    const res = await fetch(apiUrl('/api/business-context/profiles/'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body,
    });
    return res.ok;
  } catch {
    return false;
  }
}
