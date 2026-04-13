/**
 * Content drafts + LinkedIn publish/schedule (authorized cookies).
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
 * @param {{ title: string, bodyText: string, channel?: string, targetObjective?: string | null }} body
 */
export async function createContentDraft(body) {
  try {
    const res = await fetch(apiUrl('/api/content-drafts/'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        title: body.title.trim(),
        channel: body.channel ?? 'linkedin',
        bodyText: body.bodyText.trim(),
        mediaUrls: [],
        targetObjective: body.targetObjective?.trim() || null,
        source: 'manual',
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
 */
export async function publishLinkedInContentDraft(contentItemId) {
  try {
    const res = await fetch(apiUrl(`/api/content-drafts/${encodeURIComponent(contentItemId)}/publish/linkedin`), {
      method: 'POST',
      credentials: 'include',
      headers: { Accept: 'application/json' },
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

export async function fetchPublishedPosts() {
  try {
    const res = await fetch(apiUrl('/api/content-drafts/published'), {
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
 * @returns {{ success: boolean, linkedInPostUrn: string | null, metrics: Record<string, number> | null, code: string, message: string }}
 */
export function mapLinkedInPostAnalyticsResponse(json) {
  if (!json || typeof json !== 'object') {
    return { success: false, linkedInPostUrn: null, metrics: null, code: '', message: '' };
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
  return {
    success: Boolean(o.success ?? o.Success),
    linkedInPostUrn: (o.linkedInPostUrn ?? o.LinkedInPostUrn ?? null) != null ? String(o.linkedInPostUrn ?? o.LinkedInPostUrn) : null,
    metrics,
    code: String(o.code ?? o.Code ?? ''),
    message: String(o.message ?? o.Message ?? ''),
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
