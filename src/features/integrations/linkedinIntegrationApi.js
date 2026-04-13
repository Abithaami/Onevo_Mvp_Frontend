/**
 * LinkedIn OAuth + connection status (authorized session cookies).
 * Backend: /api/integrations/linkedin/*
 */
import { apiUrl } from '../../lib/apiBase.js';

/** @param {Response} res */
async function readErrorMessage(res) {
  try {
    const ct = res.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) {
      const j = await res.json();
      if (j && typeof j === 'object') {
        if (typeof j.detail === 'string' && j.detail.trim()) return j.detail.trim();
        if (typeof j.title === 'string' && j.title.trim()) return j.title.trim();
      }
    }
    const t = await res.text();
    return t?.trim().slice(0, 400) || `${res.status} ${res.statusText}`;
  } catch {
    return res.statusText || 'Request failed';
  }
}

/**
 * @param {unknown} json
 * @returns {{ isConnected: boolean, linkedInSubject: string | null, linkedInEmail: string | null, linkedInName: string | null, accessTokenExpiresAtUtc: string | null }}
 */
export function mapLinkedInStatusResponse(json) {
  if (!json || typeof json !== 'object') {
    return {
      isConnected: false,
      linkedInSubject: null,
      linkedInEmail: null,
      linkedInName: null,
      accessTokenExpiresAtUtc: null,
    };
  }
  const o = /** @type {Record<string, unknown>} */ (json);
  return {
    isConnected: Boolean(o.isConnected ?? o.IsConnected),
    linkedInSubject: (o.linkedInSubject ?? o.LinkedInSubject ?? null)
      ? String(o.linkedInSubject ?? o.LinkedInSubject)
      : null,
    linkedInEmail: (o.linkedInEmail ?? o.LinkedInEmail ?? null) ? String(o.linkedInEmail ?? o.LinkedInEmail) : null,
    linkedInName: (o.linkedInName ?? o.LinkedInName ?? null) ? String(o.linkedInName ?? o.LinkedInName) : null,
    accessTokenExpiresAtUtc:
      o.accessTokenExpiresAtUtc != null || o.AccessTokenExpiresAtUtc != null
        ? String(o.accessTokenExpiresAtUtc ?? o.AccessTokenExpiresAtUtc)
        : null,
  };
}

/**
 * @returns {Promise<{ ok: true, status: ReturnType<typeof mapLinkedInStatusResponse> } | { ok: false, error: string }>}
 */
export async function fetchLinkedInStatus() {
  try {
    const res = await fetch(apiUrl('/api/integrations/linkedin/status'), {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return { ok: false, error: await readErrorMessage(res) };
    }
    const json = await res.json();
    return { ok: true, status: mapLinkedInStatusResponse(json) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}

/**
 * @returns {Promise<{ ok: true, authorizationUrl: string } | { ok: false, error: string }>}
 */
export async function fetchLinkedInAuthorizationUrl() {
  try {
    const res = await fetch(apiUrl('/api/integrations/linkedin/authorization-url'), {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return { ok: false, error: await readErrorMessage(res) };
    }
    const json = await res.json();
    const url = json?.authorizationUrl ?? json?.AuthorizationUrl;
    if (typeof url !== 'string' || !url.trim()) {
      return { ok: false, error: 'Invalid authorization URL from server.' };
    }
    return { ok: true, authorizationUrl: url.trim() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}

/**
 * @returns {Promise<{ ok: true } | { ok: false, error: string }>}
 */
export async function disconnectLinkedIn() {
  try {
    const res = await fetch(apiUrl('/api/integrations/linkedin/disconnect'), {
      method: 'POST',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      return { ok: true };
    }
    return { ok: false, error: await readErrorMessage(res) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}

/**
 * @param {unknown} json
 * @returns {{ success: boolean, postsScanned: number, commentsProcessed: number, duplicatesSkipped: number, highIntentAlertsCreated: number, errorCode: string | null, message: string }}
 */
export function mapCommentIntentScanResponse(json) {
  if (!json || typeof json !== 'object') {
    return {
      success: false,
      postsScanned: 0,
      commentsProcessed: 0,
      duplicatesSkipped: 0,
      highIntentAlertsCreated: 0,
      errorCode: null,
      message: '',
    };
  }
  const o = /** @type {Record<string, unknown>} */ (json);
  return {
    success: Boolean(o.success ?? o.Success),
    postsScanned: Number(o.postsScanned ?? o.PostsScanned ?? 0),
    commentsProcessed: Number(o.commentsProcessed ?? o.CommentsProcessed ?? 0),
    duplicatesSkipped: Number(o.duplicatesSkipped ?? o.DuplicatesSkipped ?? 0),
    highIntentAlertsCreated: Number(o.highIntentAlertsCreated ?? o.HighIntentAlertsCreated ?? 0),
    errorCode: (o.errorCode ?? o.ErrorCode ?? null) != null ? String(o.errorCode ?? o.ErrorCode) : null,
    message: String(o.message ?? o.Message ?? ''),
  };
}

/**
 * @returns {Promise<{ ok: true, scan: ReturnType<typeof mapCommentIntentScanResponse> } | { ok: false, error: string }>}
 */
export async function runLinkedInCommentIntentScan() {
  try {
    const res = await fetch(apiUrl('/api/integrations/linkedin/comment-intent/scan'), {
      method: 'POST',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return { ok: false, error: await readErrorMessage(res) };
    }
    const json = await res.json();
    return { ok: true, scan: mapCommentIntentScanResponse(json) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}

/**
 * @param {unknown} json
 * @returns {{ id: string, contentItemId: string, linkedInPostUrn: string, commentText: string, intentScore: number | null, intentLabel: string | null, processedAtUtc: unknown, notificationId: string | null } | null}
 */
export function mapLinkedInCommentIntentAlert(json) {
  if (!json || typeof json !== 'object') return null;
  const o = /** @type {Record<string, unknown>} */ (json);
  const rawScore = o.intentScore ?? o.IntentScore;
  return {
    id: String(o.id ?? o.Id ?? ''),
    contentItemId: String(o.contentItemId ?? o.ContentItemId ?? ''),
    linkedInPostUrn: String(o.linkedInPostUrn ?? o.LinkedInPostUrn ?? ''),
    commentText: String(o.commentText ?? o.CommentText ?? ''),
    intentScore: rawScore != null && rawScore !== '' ? Number(rawScore) : null,
    intentLabel: (o.intentLabel ?? o.IntentLabel ?? null) != null ? String(o.intentLabel ?? o.IntentLabel) : null,
    processedAtUtc: o.processedAtUtc ?? o.ProcessedAtUtc ?? null,
    notificationId: (o.notificationId ?? o.NotificationId ?? null) != null ? String(o.notificationId ?? o.NotificationId) : null,
  };
}

/**
 * @returns {Promise<{ ok: true, alerts: NonNullable<ReturnType<typeof mapLinkedInCommentIntentAlert>>[] } | { ok: false, error: string }>}
 */
export async function fetchLinkedInCommentIntentAlerts() {
  try {
    const res = await fetch(apiUrl('/api/integrations/linkedin/comment-intent/alerts'), {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return { ok: false, error: await readErrorMessage(res) };
    }
    const json = await res.json();
    const arr = Array.isArray(json) ? json : [];
    const alerts = /** @type {NonNullable<ReturnType<typeof mapLinkedInCommentIntentAlert>>[]} */ (
      arr.map(mapLinkedInCommentIntentAlert).filter(Boolean)
    );
    return { ok: true, alerts };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}
