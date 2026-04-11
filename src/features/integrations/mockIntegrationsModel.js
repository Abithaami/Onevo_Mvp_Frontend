/**
 * Mock connection statuses merged with integration catalog.
 * Replace with GET /integrations when API exists.
 */

import { INTEGRATIONS } from '../onboarding/constants.js';

/** @typedef {'connected'|'expired'|'error'|'not_connected'} IntegrationStatus */

export function getMockIntegrationsViewModel() {
  /** @type {Record<string, { status: IntegrationStatus; lastSyncedAt: string | null; detail: string | null }>} */
  const statusById = {
    instagram: {
      status: 'expired',
      lastSyncedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      detail: 'Reconnect to restore live signals and publishing.'
    },
    quickbooks: {
      status: 'connected',
      lastSyncedAt: new Date(Date.now() - 3600000).toISOString(),
      detail: null
    },
    facebook: {
      status: 'not_connected',
      lastSyncedAt: null,
      detail: null
    },
    shopify: {
      status: 'not_connected',
      lastSyncedAt: null,
      detail: null
    },
    google_business: {
      status: 'error',
      lastSyncedAt: new Date(Date.now() - 7200000).toISOString(),
      detail: 'Last sync failed — try again or check permissions.'
    }
  };

  return INTEGRATIONS.map((def) => ({
    ...def,
    ...(statusById[def.id] ?? {
      status: 'not_connected',
      lastSyncedAt: null,
      detail: null
    })
  }));
}
