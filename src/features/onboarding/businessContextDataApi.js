/**
 * Authorized Business Context data APIs (data sources + manual submissions).
 * Source type strings match `ONEVO_MVP.Domain.Enums.DataSourceType`.
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

export const DATA_SOURCE_TYPES = {
  manualBusinessData: 'manual_business_data',
  pos: 'pos',
  booking: 'booking',
  googleBusiness: 'google_business',
};

/** Stable per-tenant onboarding connector key (unique with SourceType). */
export const ONBOARDING_EXTERNAL_REF = 'onboarding_mvp';

/**
 * @returns {Promise<{ ok: true, items: any[] } | { ok: false, error: string }>}
 */
export async function listDataSources(/** @type {boolean | undefined} */ activeOnly) {
  try {
    const base = apiUrl('/api/business-context/data-sources/');
    const url =
      activeOnly === undefined ? base : `${base}?activeOnly=${activeOnly ? 'true' : 'false'}`;
    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return { ok: false, error: await readErrorMessage(res) };
    }
    const items = await res.json();
    return { ok: true, items: Array.isArray(items) ? items : [] };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}

/**
 * @param {{ sourceType: string, externalAccountReference: string, displayName?: string | null, connectorMetadataJson?: string | null, isActive?: boolean }} body
 */
export async function createDataSource(body) {
  try {
    const res = await fetch(apiUrl('/api/business-context/data-sources/'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        sourceType: body.sourceType,
        externalAccountReference: body.externalAccountReference,
        displayName: body.displayName ?? null,
        connectorMetadataJson: body.connectorMetadataJson ?? null,
        isActive: body.isActive !== false,
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
 * @param {string} dataSourceConnectionId
 * @param {string} payloadJson - JSON string (object)
 */
export async function createManualDataSubmission(dataSourceConnectionId, payloadJson) {
  try {
    const res = await fetch(apiUrl('/api/business-context/manual-submissions/'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        dataSourceConnectionId,
        payloadJson,
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
 * @param {string} submissionId
 * @param {string} payloadJson
 */
export async function updateManualDataSubmission(submissionId, payloadJson) {
  try {
    const res = await fetch(apiUrl(`/api/business-context/manual-submissions/${submissionId}`), {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ payloadJson }),
    });
    if (res.ok) {
      const data = await res.json();
      return { ok: true, data };
    }
    return { ok: false, error: await readErrorMessage(res) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}

/**
 * @param {unknown} data
 * @returns {{ id: string, originalFileName: string, fileKind: string, fileSizeBytes: number } | null}
 */
export function mapBusinessContextFileUploadResponse(data) {
  if (!data || typeof data !== 'object') return null;
  const o = /** @type {Record<string, unknown>} */ (data);
  const id = String(o.id ?? o.Id ?? '');
  if (!id) return null;
  return {
    id,
    originalFileName: String(o.originalFileName ?? o.OriginalFileName ?? ''),
    fileKind: String(o.fileKind ?? o.FileKind ?? ''),
    fileSizeBytes: Number(o.fileSizeBytes ?? o.FileSizeBytes ?? 0),
  };
}

/**
 * Multipart upload (optional). Field name must be `file`.
 * @param {File} file
 * @param {string | null} dataSourceConnectionId
 * @returns {Promise<{ ok: true, file: NonNullable<ReturnType<typeof mapBusinessContextFileUploadResponse>> } | { ok: false, error: string }>}
 */
export async function uploadBusinessContextFile(file, dataSourceConnectionId) {
  try {
    const fd = new FormData();
    fd.append('file', file);
    if (dataSourceConnectionId) {
      fd.append('dataSourceConnectionId', dataSourceConnectionId);
    }
    const res = await fetch(apiUrl('/api/business-context/files/'), {
      method: 'POST',
      credentials: 'include',
      body: fd,
    });
    if (res.ok) {
      const data = await res.json();
      const mapped = mapBusinessContextFileUploadResponse(data);
      if (!mapped) {
        return { ok: false, error: 'Invalid upload response from server.' };
      }
      return { ok: true, file: mapped };
    }
    return { ok: false, error: await readErrorMessage(res) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}

/**
 * @param {string} fileId - Business context file GUID
 * @returns {Promise<{ ok: true } | { ok: false, error: string }>}
 */
export async function deleteBusinessContextFile(fileId) {
  const id = String(fileId ?? '').trim();
  if (!id) {
    return { ok: false, error: 'Missing file id.' };
  }
  try {
    const res = await fetch(apiUrl(`/api/business-context/files/${encodeURIComponent(id)}`), {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.status === 204 || res.ok) {
      return { ok: true };
    }
    if (res.status === 404) {
      return { ok: true };
    }
    return { ok: false, error: await readErrorMessage(res) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}
