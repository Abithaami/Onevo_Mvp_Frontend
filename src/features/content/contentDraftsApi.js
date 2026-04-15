/**
 * Content drafts + LinkedIn publish/schedule (authorized cookies).
 */
import { apiUrl } from '../../lib/apiBase.js';

/**
 * Parse RFC 7807 / ASP.NET problem details bodies whether Content-Type is
 * `application/json` or `application/problem+json` (the latter is not matched by `application/json`).
 * @param {string} trimmed
 */
function messageFromProblemDetailsJson(trimmed) {
  if (!trimmed.startsWith('{')) return '';
  try {
    const j = JSON.parse(trimmed);
    if (!j || typeof j !== 'object') return '';
    if (typeof j.detail === 'string' && j.detail.trim()) return j.detail.trim();
    if (typeof j.title === 'string' && j.title.trim()) {
      const title = j.title.trim();
      if (title === 'LINKEDIN_APP_ANALYTICS_SCOPE_NOT_CONFIGURED') {
        return 'LinkedIn analytics are not available for the current app permissions. Add the required LinkedIn analytics scope in the API configuration and reconnect LinkedIn when your app is approved.';
      }
      return title;
    }
  } catch {
    // ignore
  }
  return '';
}

/** @param {Response} res */
async function readErrorMessage(res) {
  try {
    const text = await res.text();
    const trimmed = (text ?? '').trim();
    const fromJson = messageFromProblemDetailsJson(trimmed);
    if (fromJson) return fromJson;
    if (trimmed) return trimmed.slice(0, 400);
    return `${res.status} ${res.statusText}`;
  } catch {
    return res.statusText || 'Request failed';
  }
}

/**
 * @param {{
 *   title: string,
 *   bodyText: string,
 *   channel?: string,
 *   mediaUrls?: string[],
 *   hashtags?: string[],
 *   imageUrl?: string | null,
 *   targetObjective?: string | null,
 *   source?: 'manual' | 'agent',
 *   orchestrationRunId?: string | null,
 * }} body
 */
export async function createContentDraft(body) {
  try {
    const source = body.source === 'agent' ? 'agent' : 'manual';
    const mediaUrls = Array.isArray(body.mediaUrls) ? body.mediaUrls.filter((u) => typeof u === 'string' && u.trim()) : [];
    if (body.imageUrl && typeof body.imageUrl === 'string' && body.imageUrl.trim()) {
      mediaUrls.unshift(body.imageUrl.trim());
    }
    const normalizedMediaUrls = [...new Set(mediaUrls.map((u) => u.trim()).filter(Boolean))];
    const hashtags = Array.isArray(body.hashtags)
      ? body.hashtags
          .map((x) => String(x ?? '').trim())
          .filter(Boolean)
          .map((x) => (x.startsWith('#') ? x : `#${x}`))
      : [];
    const orchestrationRunId =
      source === 'agent' && body.orchestrationRunId && String(body.orchestrationRunId).trim()
        ? String(body.orchestrationRunId).trim()
        : null;

    const res = await fetch(apiUrl('/api/content-drafts/'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        title: body.title.trim(),
        channel: body.channel ?? 'linkedin',
        body: body.bodyText.trim(),
        bodyText: body.bodyText.trim(),
        mediaUrls: normalizedMediaUrls,
        hashtags,
        imageUrl: body.imageUrl?.trim() || null,
        hashtagsJson: hashtags.length ? JSON.stringify(hashtags) : null,
        targetObjective: body.targetObjective?.trim() || null,
        source,
        orchestrationRunId,
      }),
    });
    if (res.status === 201 || res.ok) {
      const data = await res.json();
      return { ok: true, data };
    }
    return { ok: false, error: await readErrorMessage(res) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}

/**
 * @param {string} contentItemId
 * @returns {Promise<{ ok: true, data: Record<string, unknown> } | { ok: false, error: string }>}
 */
export async function fetchContentDraftById(contentItemId) {
  try {
    const res = await fetch(apiUrl(`/api/content-drafts/${encodeURIComponent(contentItemId)}`), {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (res.status === 404) {
      return { ok: false, error: await readErrorMessage(res) };
    }
    if (!res.ok) {
      return { ok: false, error: await readErrorMessage(res) };
    }
    const data = await res.json();
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}

/**
 * @param {string} contentItemId
 * @param {{ title: string, bodyText: string }} body
 */
export async function updateContentDraft(contentItemId, body) {
  try {
    const res = await fetch(apiUrl(`/api/content-drafts/${encodeURIComponent(contentItemId)}`), {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        title: body.title.trim(),
        bodyText: body.bodyText.trim(),
      }),
    });
    if (!res.ok) {
      return { ok: false, error: await readErrorMessage(res) };
    }
    const data = await res.json();
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}

/**
 * @param {unknown} data
 */
export function mapContentDraftDetail(data) {
  if (!data || typeof data !== 'object') return null;
  const o = /** @type {Record<string, unknown>} */ (data);
  return {
    id: String(o.id ?? o.Id ?? ''),
    title: String(o.title ?? o.Title ?? ''),
    body: String(o.body ?? o.Body ?? ''),
    channel: String(o.channel ?? o.Channel ?? ''),
    status: String(o.status ?? o.Status ?? ''),
    createdAtUtc: o.createdAtUtc ?? o.CreatedAtUtc ?? null,
    updatedAtUtc: o.updatedAtUtc ?? o.UpdatedAtUtc ?? null,
    targetObjective: o.targetObjective ?? o.TargetObjective ?? null,
    canEdit: Boolean(o.canEdit ?? o.CanEdit),
    mediaUrls: Array.isArray(o.mediaUrls ?? o.MediaUrls) ? /** @type {unknown[]} */ (o.mediaUrls ?? o.MediaUrls).map((x) => String(x ?? '').trim()).filter(Boolean) : [],
    source: String(o.source ?? o.Source ?? ''),
    orchestrationRunId: o.orchestrationRunId ?? o.OrchestrationRunId ?? null,
  };
}

/**
 * @param {string} contentItemId
 */
export async function approveContentDraft(contentItemId) {
  try {
    const res = await fetch(apiUrl(`/api/content-drafts/${encodeURIComponent(contentItemId)}/approve`), {
      method: 'POST',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (res.status === 204 || res.ok) {
      return { ok: true };
    }
    return { ok: false, error: await readErrorMessage(res) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}

/**
 * @param {string} contentItemId
 * @param {{ imageUrl?: string | null } | undefined} [options]
 */
export async function publishLinkedInContentDraft(contentItemId, options) {
  try {
    const imageUrl =
      options && typeof options.imageUrl === 'string' && options.imageUrl.trim() ? options.imageUrl.trim() : null;
    const payload = { imageUrl };
    try {
      console.info('[contentDraftsApi] LinkedIn publish request', {
        contentItemId,
        imageUrl: payload.imageUrl,
        fullPayload: payload,
      });
    } catch {
      // ignore
    }
    const res = await fetch(apiUrl(`/api/content-drafts/${encodeURIComponent(contentItemId)}/publish/linkedin`), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      return { ok: false, error: await readErrorMessage(res) };
    }
    const data = await res.json();
    return {
      ok: true,
      linkedInPostUrn: data.linkedInPostUrn ?? data.LinkedInPostUrn ?? null,
      message: data.message ?? data.Message ?? '',
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}

/**
 * @param {string} contentItemId
 * @param {string} scheduledPublishAtUtcIso - ISO 8601 UTC
 */
export async function scheduleLinkedInContentDraft(contentItemId, scheduledPublishAtUtcIso) {
  try {
    const res = await fetch(apiUrl(`/api/content-drafts/${encodeURIComponent(contentItemId)}/schedule/linkedin`), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ scheduledPublishAtUtc: scheduledPublishAtUtcIso }),
    });
    if (!res.ok) {
      return { ok: false, error: await readErrorMessage(res) };
    }
    const data = await res.json();
    return {
      ok: true,
      publishJobId: data.publishJobId ?? data.PublishJobId ?? null,
      scheduledPublishAtUtc: data.scheduledPublishAtUtc ?? data.ScheduledPublishAtUtc ?? null,
      message: data.message ?? data.Message ?? '',
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}

/**
 * @param {string} contentItemId
 */
export async function cancelLinkedInSchedule(contentItemId) {
  try {
    const res = await fetch(apiUrl(`/api/content-drafts/${encodeURIComponent(contentItemId)}/schedule/linkedin`), {
      method: 'DELETE',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return { ok: false, error: await readErrorMessage(res) };
    }
    const data = await res.json();
    return { ok: true, message: data.message ?? data.Message ?? '' };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}

/**
 * LinkedIn drafts approved or scheduled but not yet published (publish/schedule handoff).
 * @returns {Promise<{ ok: true, items: Array<Record<string, unknown>> } | { ok: false, error: string }>}
 */
export async function fetchReadyToPublishDrafts() {
  try {
    const res = await fetch(apiUrl('/api/content-drafts/ready-to-publish'), {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return { ok: false, error: await readErrorMessage(res) };
    }
    const data = await res.json();
    const items = data.items ?? data.Items ?? [];
    return { ok: true, items: Array.isArray(items) ? items : [] };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}

/**
 * LinkedIn drafts in Draft status (approval queue).
 * @returns {Promise<{ ok: true, items: Array<Record<string, unknown>> } | { ok: false, error: string }>}
 */
export async function fetchPendingApprovalDrafts() {
  try {
    const res = await fetch(apiUrl('/api/content-drafts/pending-approval'), {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return { ok: false, error: await readErrorMessage(res) };
    }
    const data = await res.json();
    const items = data.items ?? data.Items ?? [];
    return { ok: true, items: Array.isArray(items) ? items : [] };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}

/**
 * @param {unknown} row
 */
export function mapPendingApprovalDraftRow(row) {
  if (!row || typeof row !== 'object') return null;
  const o = /** @type {Record<string, unknown>} */ (row);
  return {
    id: String(o.id ?? o.Id ?? ''),
    title: String(o.title ?? o.Title ?? ''),
    channel: String(o.channel ?? o.Channel ?? ''),
    bodyPreview: String(o.bodyPreview ?? o.BodyPreview ?? ''),
    createdAtUtc: o.createdAtUtc ?? o.CreatedAtUtc ?? null,
    status: String(o.status ?? o.Status ?? ''),
  };
}

/**
 * @param {unknown} row
 */
export function mapReadyToPublishDraftRow(row) {
  if (!row || typeof row !== 'object') return null;
  const o = /** @type {Record<string, unknown>} */ (row);
  return {
    id: String(o.id ?? o.Id ?? ''),
    title: String(o.title ?? o.Title ?? ''),
    channel: String(o.channel ?? o.Channel ?? ''),
    bodyPreview: String(o.bodyPreview ?? o.BodyPreview ?? ''),
    createdAtUtc: o.createdAtUtc ?? o.CreatedAtUtc ?? null,
    updatedAtUtc: o.updatedAtUtc ?? o.UpdatedAtUtc ?? null,
    status: String(o.status ?? o.Status ?? ''),
    scheduledPublishAtUtc: o.scheduledPublishAtUtc ?? o.ScheduledPublishAtUtc ?? null,
  };
}

/**
 * @param {unknown} json
 */
/**
 * Use before calling member post analytics APIs. `memberPostAnalyticsLikelyAvailable` alone can be true
 * while `grantedScopesKnown` is false (server is optimistic); that path still errors at runtime — treat as not ready.
 * @param {null | Record<string, unknown>} cap
 */
export function isLinkedInMemberPostAnalyticsReadyForUse(cap) {
  if (!cap || typeof cap !== 'object') return false;
  if (!Boolean(cap.linkedInConnected)) return false;
  if (!Boolean(cap.memberPostAnalyticsLikelyAvailable)) return false;
  if (!Boolean(cap.grantedScopesKnown)) return false;
  return Boolean(cap.memberPostAnalyticsScopeGranted);
}

export function mapLinkedInAnalyticsCapabilitiesResponse(json) {
  if (!json || typeof json !== 'object') {
    return {
      linkedInConnected: false,
      requestedScopes: [],
      grantedScopes: null,
      grantedScopesKnown: false,
      appRequestsMemberPostAnalytics: false,
      appRequestsMemberSocialWrite: false,
      memberPostAnalyticsScopeGranted: false,
      memberSocialWriteScopeGranted: false,
      memberPostAnalyticsLikelyAvailable: false,
      reasonCode: null,
      summary: '',
    };
  }
  const o = /** @type {Record<string, unknown>} */ (json);
  const req = o.requestedScopes ?? o.RequestedScopes;
  const gr = o.grantedScopes ?? o.GrantedScopes;
  return {
    linkedInConnected: Boolean(o.linkedInConnected ?? o.LinkedInConnected),
    requestedScopes: Array.isArray(req) ? req.map((x) => String(x)) : [],
    grantedScopes: Array.isArray(gr) ? gr.map((x) => String(x)) : null,
    grantedScopesKnown: Boolean(o.grantedScopesKnown ?? o.GrantedScopesKnown),
    appRequestsMemberPostAnalytics: Boolean(o.appRequestsMemberPostAnalytics ?? o.AppRequestsMemberPostAnalytics),
    appRequestsMemberSocialWrite: Boolean(o.appRequestsMemberSocialWrite ?? o.AppRequestsMemberSocialWrite),
    memberPostAnalyticsScopeGranted: Boolean(o.memberPostAnalyticsScopeGranted ?? o.MemberPostAnalyticsScopeGranted),
    memberSocialWriteScopeGranted: Boolean(o.memberSocialWriteScopeGranted ?? o.MemberSocialWriteScopeGranted),
    memberPostAnalyticsLikelyAvailable: Boolean(
      o.memberPostAnalyticsLikelyAvailable ?? o.MemberPostAnalyticsLikelyAvailable,
    ),
    reasonCode: (o.reasonCode ?? o.ReasonCode) != null ? String(o.reasonCode ?? o.ReasonCode) : null,
    summary: String(o.summary ?? o.Summary ?? ''),
  };
}

/**
 * @returns {Promise<{ ok: true, data: ReturnType<typeof mapLinkedInAnalyticsCapabilitiesResponse> } | { ok: false, error: string }>}
 */
export async function fetchLinkedInAnalyticsCapabilities() {
  try {
    const res = await fetch(apiUrl('/api/linkedin/analytics/capabilities'), {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return { ok: false, error: await readErrorMessage(res) };
    }
    const json = await res.json();
    return { ok: true, data: mapLinkedInAnalyticsCapabilitiesResponse(json) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}

/**
 * @param {{ includeLinkedInHistory?: boolean }} [options] When true, includes LinkedIn posts soft-marked as removed on LinkedIn (default list hides them).
 */
export async function fetchPublishedPosts(options = {}) {
  try {
    const params = new URLSearchParams();
    params.set(
      'includeLinkedInHistory',
      options.includeLinkedInHistory ? 'true' : 'false',
    );
    const path = `/api/content-drafts/published?${params.toString()}`;
    const res = await fetch(apiUrl(path), {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return { ok: false, error: await readErrorMessage(res) };
    }
    const data = await res.json();
    const items = data.items ?? data.Items ?? [];
    return { ok: true, items: Array.isArray(items) ? items : [] };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}

/**
 * Soft-hide a published LinkedIn post from the default Published Posts list (server sets publish job live status).
 * @param {string} contentItemId
 * @returns {Promise<{ ok: true } | { ok: false, error: string }>}
 */
export async function hidePublishedLinkedInPostFromFeed(contentItemId) {
  const id = String(contentItemId ?? '').trim();
  if (!id) return { ok: false, error: 'Missing content id.' };
  try {
    const res = await fetch(apiUrl(`/api/content-drafts/${encodeURIComponent(id)}/linkedin/hide-from-feed`), {
      method: 'POST',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (res.status === 204) {
      return { ok: true };
    }
    return { ok: false, error: await readErrorMessage(res) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}

/**
 * @param {unknown} row
 */
export function mapPublishedPostRow(row) {
  if (!row || typeof row !== 'object') return null;
  const o = /** @type {Record<string, unknown>} */ (row);
  return {
    id: String(o.id ?? o.Id ?? ''),
    title: String(o.title ?? o.Title ?? ''),
    channel: String(o.channel ?? o.Channel ?? ''),
    bodyPreview: String(o.bodyPreview ?? o.BodyPreview ?? ''),
    publishedAtUtc: o.publishedAtUtc ?? o.PublishedAtUtc ?? null,
    linkedInPostUrn: o.linkedInPostUrn ?? o.LinkedInPostUrn ?? null,
  };
}

/**
 * Raw 200 body from GET /api/content-drafts/{id}/linkedin/analytics (only returned when the handler succeeds).
 * @param {unknown} json
 * @returns {{ success: boolean, linkedInPostUrn: string | null, metrics: Record<string, number> | null, code: string, message: string, persistedOutcomeId: string | null }}
 */
export function mapLinkedInPostAnalyticsResponse(json) {
  if (!json || typeof json !== 'object') {
    return { success: false, linkedInPostUrn: null, metrics: null, code: '', message: '', persistedOutcomeId: null };
  }
  const o = /** @type {Record<string, unknown>} */ (json);
  const rawMetrics = o.metrics ?? o.Metrics;
  /** @type {Record<string, number> | null} */
  let metrics = null;
  if (rawMetrics && typeof rawMetrics === 'object' && !Array.isArray(rawMetrics)) {
    metrics = {};
    for (const [k, v] of Object.entries(rawMetrics)) {
      if (typeof v === 'number' && Number.isFinite(v)) metrics[k] = v;
    }
  }
  const rawPid = o.persistedOutcomeId ?? o.PersistedOutcomeId;
  return {
    success: Boolean(o.success ?? o.Success),
    linkedInPostUrn: (o.linkedInPostUrn ?? o.LinkedInPostUrn ?? null) != null ? String(o.linkedInPostUrn ?? o.LinkedInPostUrn) : null,
    metrics,
    code: String(o.code ?? o.Code ?? ''),
    message: String(o.message ?? o.Message ?? ''),
    persistedOutcomeId: rawPid != null ? String(rawPid) : null,
  };
}

/**
 * @param {string} contentItemId
 * @returns {Promise<{ ok: true, data: ReturnType<typeof mapLinkedInPostAnalyticsResponse> } | { ok: false, error: string }>}
 */
export async function fetchLinkedInPostAnalytics(contentItemId) {
  try {
    const res = await fetch(apiUrl(`/api/content-drafts/${encodeURIComponent(contentItemId)}/linkedin/analytics`), {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return { ok: false, error: await readErrorMessage(res) };
    }
    const json = await res.json();
    return { ok: true, data: mapLinkedInPostAnalyticsResponse(json) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}

/**
 * POST /api/content-drafts/{id}/linkedin/analytics/refresh — same JSON shape as GET plus optional persistedOutcomeId when saved.
 * @param {string} contentItemId
 * @returns {Promise<{ ok: true, data: ReturnType<typeof mapLinkedInPostAnalyticsResponse> } | { ok: false, error: string }>}
 */
export async function refreshLinkedInPostAnalytics(contentItemId) {
  try {
    const res = await fetch(apiUrl(`/api/content-drafts/${encodeURIComponent(contentItemId)}/linkedin/analytics/refresh`), {
      method: 'POST',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return { ok: false, error: await readErrorMessage(res) };
    }
    const json = await res.json();
    return { ok: true, data: mapLinkedInPostAnalyticsResponse(json) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}

/**
 * @param {string} contentItemId
 * @returns {Promise<{ ok: true, outcomeId: string | null, message: string } | { ok: false, error: string }>}
 */
export async function captureContentPerformanceOutcome(contentItemId) {
  try {
    const res = await fetch(apiUrl(`/api/content-drafts/${encodeURIComponent(contentItemId)}/performance-outcome/capture`), {
      method: 'POST',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return { ok: false, error: await readErrorMessage(res) };
    }
    const json = await res.json();
    const rawId = json?.outcomeId ?? json?.OutcomeId;
    return {
      ok: true,
      outcomeId: rawId != null ? String(rawId) : null,
      message: String(json?.message ?? json?.Message ?? ''),
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}
