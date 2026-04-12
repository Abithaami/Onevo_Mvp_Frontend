# Auth and API (frontend)

This document describes how the ONEVO MVP frontend talks to the API and how authentication behaves in development.

## API base URL

- **Source of truth:** `import.meta.env.VITE_API_BASE_URL` (see `src/lib/apiBase.js`).
- **Resolution:** `apiOrigin` is the trimmed value with no trailing slash. `apiUrl('/api/...')` returns `${apiOrigin}/api/...` when set, otherwise the path is returned as-is (relative to the Vite dev origin).
- **Local `.env` example:** `VITE_API_BASE_URL=https://localhost:7000` (no trailing slash).

## Vite dev server proxy

- **`vite.config.js`** proxies `/api` to `VITE_DEV_PROXY_TARGET` (default `https://localhost:7000`) with `changeOrigin: true` and `secure: false` for local HTTPS dev certs.
- **Relative `/api` calls** from the SPA hit the Vite origin first, then the proxy forwards to the API.
- **Google OAuth:** Do **not** rely on this proxy for the login start URL when correlation cookies must live on the API host. Use `googleOAuthLoginUrl()` in `apiBase.js` (see below).

## Google OAuth redirect assumptions

- **`googleOAuthLoginUrl()`** (`src/lib/apiBase.js`) builds `https://<api-origin>/api/auth/google/login` using `VITE_API_BASE_URL` when set.
- **Rationale (comment in code):** OAuth state/correlation cookies must be set on the same origin that completes the flow. Proxying `/api` through Vite can leave cookies on the wrong host and produce “oauth state was missing or invalid” after Google returns.
- **Dev default:** If `VITE_API_BASE_URL` is unset in dev, the helper falls back to `https://localhost:7000/api/auth/google/login`.

## Frontend behavior on auth success / failure

| Flow | Success | Failure / offline |
|------|-----------|-------------------|
| **Google session probe** (`GET` credentials on `/api/auth/google/session` in `AuthPage.jsx`) | `navigate('/app/dashboard', { replace: true })` | Stay on `/auth` (catch: offline/CORS) |
| **Email/password sign-in (mock)** | Toast + redirect to `/app/dashboard` | Validation toasts (empty fields) |
| **Register (mock)** | Toast + redirect to `/app/onboarding` | Validation toasts |
| **Workspace after redirect** | `WorkspaceLayout` may send incomplete users to `/app/onboarding` per `isOnboardingComplete()` | N/A |

## Related files

- `src/lib/apiBase.js` — `apiOrigin`, `apiUrl`, `googleOAuthLoginUrl`
- `vite.config.js` — `/api` proxy
- `src/pages/AuthPage.jsx` — session check, mock login/register redirects
- `src/layouts/WorkspaceLayout.jsx` — onboarding completion guards
