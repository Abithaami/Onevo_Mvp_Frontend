/**
 * Base URL for API calls from the SPA (no trailing slash).
 * - Dev: leave unset to use same-origin paths like `/api/...` so the Vite dev server proxy (`vite.config.js` → `VITE_DEV_PROXY_TARGET`) forwards to the API.
 * - Prod: set `VITE_API_BASE_URL` at build time so the SPA and API can be on different hosts.
 */
const raw = import.meta.env.VITE_API_BASE_URL?.trim() ?? '';

export const apiOrigin = raw.replace(/\/$/, '');

/**
 * @param {string} path - Absolute path beginning with `/` (e.g. `/api/auth/google/login`)
 */
export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return apiOrigin ? `${apiOrigin}${p}` : p;
}

/**
 * `GET` session probe — use with `{ credentials: 'include' }`.
 * Relative URL in dev (proxy); absolute when `VITE_API_BASE_URL` is set.
 */
export function googleSessionProbeUrl() {
  return apiUrl('/api/auth/google/session');
}

/**
 * Full URL to start Google OAuth. Must hit the API origin directly so correlation cookies for /signin-google
 * are stored on https://localhost:7000. Using Vite's /api proxy stores cookies on the dev server origin and causes
 * "The oauth state was missing or invalid" after Google returns.
 *
 * @param {string} [absoluteReturnUrl] - Optional absolute browser URL for the API `returnUrl` query (validated server-side).
 */
export function googleOAuthLoginUrl(absoluteReturnUrl) {
  const explicit = import.meta.env.VITE_API_BASE_URL?.trim();
  let base;
  if (explicit) {
    base = `${explicit.replace(/\/$/, '')}/api/auth/google/login`;
  } else if (import.meta.env.DEV) {
    base = 'https://localhost:7000/api/auth/google/login';
  } else {
    base = '/api/auth/google/login';
  }
  const ret = absoluteReturnUrl?.trim();
  if (!ret) {
    return base;
  }
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}returnUrl=${encodeURIComponent(ret)}`;
}
