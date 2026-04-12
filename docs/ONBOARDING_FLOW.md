# ONEVO onboarding flow (MVP)

## Journey

`Register → /app/onboarding → 4 sections → Finish setup → /app/dashboard` · After sign-in, incomplete users are **forced to onboarding** until complete.

## Route guards (`WorkspaceLayout`)

Uses `isOnboardingComplete()` (`localStorage` `onevo_onboarding_complete_v1 === '1'`).

| State | Behavior |
|--------|----------|
| **Incomplete** | Only `/app/onboarding` is allowed. Any other `/app/*` → redirect to `/app/onboarding`. |
| **Complete** | `/app/onboarding` → redirect to `/app/dashboard`. Other `/app/*` routes work normally. |

Default home: `/app` index still navigates to `/app/dashboard`; incomplete users are then redirected to onboarding.

## Setup mode (`/app/onboarding`)

Minimal top bar: ONEVO + **Exit setup**. Sidebar hidden. **Exit setup**: section 1 → dashboard directly; sections 2–4 → confirm *“Your progress is saved. Continue to dashboard?”* Draft is always autosaved.

## Storage (single module: `onboardingStorage.js`)

| Key | Role |
|-----|------|
| `onevo_onboarding_mvp_v1` | Draft JSON (cleared on Finish setup) |
| `onevo_onboarding_complete_v1` | `'1'` after Finish setup |
| `onevo_workspace_setup_v1` | Workspace payload (merge on finish via `onboardingWorkspaceMerge.js`) |

Legacy `onevo_onboarding_v1` removed once via `runLegacyOnboardingCleanupOnce()` when onboarding mounts.

## Mocked

Website analysis delay, social Connect delay, business data filenames only — no backend yet.
