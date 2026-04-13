/**
 * Non-LinkedIn integrations: MVP placeholders only (no live OAuth).
 * LinkedIn is handled separately in `LinkedInIntegrationSection.jsx`.
 */
import { INTEGRATIONS } from '../onboarding/constants.js';

export function getPlaceholderIntegrationsRows() {
  return INTEGRATIONS.map((def) => ({
    ...def,
    status: 'not_connected',
    lastSyncedAt: null,
    detail: 'OAuth connection is not available in this MVP release.',
    connectDisabled: true,
  }));
}
