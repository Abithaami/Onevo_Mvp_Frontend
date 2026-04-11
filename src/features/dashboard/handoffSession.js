/**
 * Client-only flags for the post-onboarding dashboard handoff banner.
 * Pending is set when the user finishes onboarding and lands on the dashboard; dismissed persists for the session.
 */

export const HANDOFF_PENDING_KEY = 'onevo_dash_handoff_pending';
export const HANDOFF_DISMISSED_KEY = 'onevo_dash_handoff_dismissed';

/** Call from the onboarding activation step when navigating to the dashboard. */
export function markDashboardHandoffPendingFromOnboarding() {
  try {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.setItem(HANDOFF_PENDING_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function getHandoffPayloadForModel() {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    if (sessionStorage.getItem(HANDOFF_DISMISSED_KEY) === '1') return null;
    if (sessionStorage.getItem(HANDOFF_PENDING_KEY) !== '1') return null;
  } catch {
    return null;
  }
  return {
    title: 'Welcome — start with your first recommendation',
    body: 'Review the draft in your workbench below. Approve, edit, or skip — you stay in control of every outbound action.'
  };
}

export function dismissDashboardHandoff() {
  try {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.setItem(HANDOFF_DISMISSED_KEY, '1');
    sessionStorage.removeItem(HANDOFF_PENDING_KEY);
  } catch {
    /* ignore */
  }
}
