/**
 * Authenticated Website Brand DNA API (preview + save).
 */
import { apiUrl } from '../../lib/apiBase.js';

/**
 * @param {Response} res
 * @returns {Promise<string>}
 */
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
 * POST /api/business-context/website-brand-dna/preview
 * @param {string} websiteUrl
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{ ok: true, data: Record<string, unknown> } | { ok: false, error: string, aborted?: true }>}
 */
export async function previewWebsiteBrandDna(websiteUrl, options = {}) {
  const trimmed = websiteUrl?.trim() ?? '';
  if (!trimmed) {
    return { ok: false, error: 'Enter a website URL first.' };
  }
  const { signal } = options;
  try {
    const res = await fetch(apiUrl('/api/business-context/website-brand-dna/preview'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ websiteUrl: trimmed }),
      signal,
    });
    if (!res.ok) {
      const msg = await readErrorMessage(res);
      return { ok: false, error: msg };
    }
    const data = await res.json();
    return { ok: true, data };
  } catch (e) {
    if (signal?.aborted || (e instanceof DOMException && e.name === 'AbortError')) {
      return { ok: false, error: '', aborted: true };
    }
    const msg = e instanceof Error ? e.message : 'Network error';
    return { ok: false, error: msg };
  }
}

/**
 * POST /api/business-context/website-brand-dna/save
 * @param {Record<string, unknown>} brandDna - BrandDnaWebExtractionDto
 * @returns {Promise<{ ok: true } | { ok: false, error: string }>}
 */
export async function saveWebsiteBrandDna(brandDna) {
  try {
    const res = await fetch(apiUrl('/api/business-context/website-brand-dna/save'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(brandDna),
    });
    if (res.ok) {
      return { ok: true };
    }
    const msg = await readErrorMessage(res);
    return { ok: false, error: msg };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Network error';
    return { ok: false, error: msg };
  }
}

/**
 * POST /api/business-context/website-brand-dna/preview-with-agent
 * (Legacy `preview-with-research` is the same handler; prefer this endpoint.)
 *
 * @param {string} websiteUrl
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{ ok: true, data: Record<string, unknown> } | { ok: false, error: string, aborted?: true }>}
 */
export async function previewWebsiteBrandDnaWithAgent(websiteUrl, options = {}) {
  const trimmed = websiteUrl?.trim() ?? '';
  if (!trimmed) {
    return { ok: false, error: 'Enter a website URL first.' };
  }
  const { signal } = options;
  try {
    const res = await fetch(apiUrl('/api/business-context/website-brand-dna/preview-with-agent'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ websiteUrl: trimmed }),
      signal,
    });
    if (!res.ok) {
      const msg = await readErrorMessage(res);
      return { ok: false, error: msg };
    }
    const data = await res.json();
    return { ok: true, data };
  } catch (e) {
    if (signal?.aborted || (e instanceof DOMException && e.name === 'AbortError')) {
      return { ok: false, error: '', aborted: true };
    }
    const msg = e instanceof Error ? e.message : 'Network error';
    return { ok: false, error: msg };
  }
}
