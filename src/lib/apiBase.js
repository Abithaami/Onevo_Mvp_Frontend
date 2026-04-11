/**
 * Base URL for API calls from the SPA (no trailing slash).
 * - Prod: set VITE_API_BASE_URL to your deployed API origin at build time.
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
 * Full URL to start Google OAuth. Must hit the API origin directly so correlation cookies for /signin-google
 * are stored on https://localhost:7000. Using Vite's /api proxy stores cookies on the dev server origin and causes
 * "The oauth state was missing or invalid" after Google returns.
 */
export function googleOAuthLoginUrl() {
  const explicit = import.meta.env.VITE_API_BASE_URL?.trim();
  if (explicit) {
    return `${explicit.replace(/\/$/, '')}/api/auth/google/login`;
  }
  if (import.meta.env.DEV) {
    return 'https://localhost:7000/api/auth/google/login';
  }
  return '/api/auth/google/login';
}
