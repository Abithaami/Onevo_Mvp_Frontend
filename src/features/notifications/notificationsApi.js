/**
 * In-app notifications (authorized session cookies).
 * Backend: GET /api/notifications, PATCH /api/notifications/{id}/read
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
 * @param {unknown} raw
 * @returns {{ id: string, channel: string, message: string, status: string, sentAtUtc: string } | null}
 */
export function mapNotification(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const o = /** @type {Record<string, unknown>} */ (raw);
  const id = String(o.id ?? o.Id ?? '').trim();
  if (!id) return null;
  return {
    id,
    channel: String(o.channel ?? o.Channel ?? ''),
    message: String(o.message ?? o.Message ?? ''),
    status: String(o.status ?? o.Status ?? '').toLowerCase(),
    sentAtUtc: o.sentAtUtc != null || o.SentAtUtc != null ? String(o.sentAtUtc ?? o.SentAtUtc) : '',
  };
}

/**
 * @param {{ take?: number, channelPrefix?: string }} [opts]
 * @returns {Promise<{ ok: true, items: ReturnType<typeof mapNotification>[] } | { ok: false, error: string }>}
 */
export async function fetchNotifications(opts = {}) {
  const { take = 50, channelPrefix } = opts;
  try {
    const params = new URLSearchParams();
    if (take != null) params.set('take', String(take));
    if (channelPrefix) params.set('channelPrefix', channelPrefix);
    const q = params.toString();
    const path = `/api/notifications${q ? `?${q}` : ''}`;
    const res = await fetch(apiUrl(path), {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return { ok: false, error: await readErrorMessage(res) };
    }
    const json = await res.json();
    const arr = Array.isArray(json) ? json : [];
    const items = arr.map(mapNotification).filter(Boolean);
    return { ok: true, items };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}

/**
 * @param {string} notificationId
 * @returns {Promise<{ ok: true } | { ok: false, error: string, notFound?: boolean }>}
 */
export async function markNotificationRead(notificationId) {
  const id = String(notificationId ?? '').trim();
  if (!id) {
    return { ok: false, error: 'Missing notification id.' };
  }
  try {
    const res = await fetch(apiUrl(`/api/notifications/${encodeURIComponent(id)}/read`), {
      method: 'PATCH',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (res.status === 204) {
      return { ok: true };
    }
    if (res.status === 404) {
      return { ok: false, error: 'Notification not found.', notFound: true };
    }
    return { ok: false, error: await readErrorMessage(res) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}
