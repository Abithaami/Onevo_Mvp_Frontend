/**
 * Signal ingestion API (`POST /api/signals/ingest`). Mapping stays in this module.
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
    return t?.trim().slice(0, 800) || `${res.status} ${res.statusText}`;
  } catch {
    return res.statusText || 'Request failed';
  }
}

/**
 * @param {unknown} json
 * @returns {{ signalEventId: string, correlationId: string, status: string }}
 */
export function mapIngestSignalResponse(json) {
  if (!json || typeof json !== 'object') {
    return { signalEventId: '', correlationId: '', status: '' };
  }
  const o = /** @type {Record<string, unknown>} */ (json);
  return {
    signalEventId: String(o.signalEventId ?? o.SignalEventId ?? ''),
    correlationId: String(o.correlationId ?? o.CorrelationId ?? ''),
    status: String(o.status ?? o.Status ?? ''),
  };
}

/**
 * Backend: `IngestSignalRequest` — sourceType, signalType, payload (JSON object), occurredAtUtc (ISO-8601), optional correlationId.
 *
 * @param {{
 *   sourceType: string,
 *   signalType: string,
 *   payload: Record<string, unknown>,
 *   occurredAtUtc: string,
 *   correlationId?: string | null,
 * }} fields
 * @returns {Promise<{ ok: true, data: ReturnType<typeof mapIngestSignalResponse> } | { ok: false, error: string }>}
 */
export async function postIngestSignal(fields) {
  const sourceType = fields.sourceType?.trim() ?? '';
  const signalType = fields.signalType?.trim() ?? '';
  if (!sourceType || !signalType) {
    return { ok: false, error: 'SourceType and SignalType are required.' };
  }
  const body = {
    sourceType,
    signalType,
    payload: fields.payload && typeof fields.payload === 'object' && !Array.isArray(fields.payload) ? fields.payload : {},
    occurredAtUtc: fields.occurredAtUtc?.trim() ?? '',
    correlationId: fields.correlationId?.trim() ? fields.correlationId.trim() : null,
  };
  if (!body.occurredAtUtc) {
    return { ok: false, error: 'OccurredAtUtc is required (ISO 8601).' };
  }
  try {
    const res = await fetch(apiUrl('/api/signals/ingest'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      return { ok: false, error: await readErrorMessage(res) };
    }
    const json = await res.json();
    return { ok: true, data: mapIngestSignalResponse(json) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}
