/**
 * Derives dashboard overview copy from `normalizeWorkspaceSetup` output (local + server snapshot).
 * No invented metrics — only what onboarding / workspace state already stores.
 */
import { socialMediaSources } from '../../data/onevoData.js';

/** @param {Record<string, unknown>} brandData */
export function formatWebsiteSourceLine(brandData) {
  const url = brandData?.websiteUrl?.trim();
  if (brandData?.brandInputMode === 'website') {
    return url ? `Website · ${url}` : 'Website (URL not saved)';
  }
  if (brandData?.brandInputMode === 'manual') {
    return 'Manual business profile (no website scrape)';
  }
  return '—';
}

/**
 * POS / booking / Google Business — onboarding intents only (not live OAuth).
 * @param {Record<string, unknown>} growthData
 */
export function formatBusinessSystemsIntent(growthData) {
  if (!growthData) return '—';
  const parts = [];
  if (growthData.connectPos) parts.push('POS');
  if (growthData.connectBooking) parts.push('Booking');
  if (growthData.connectGoogleBusiness) parts.push('Google Business');
  return parts.length ? `${parts.join(' · ')} (selected in setup)` : 'None selected';
}

/**
 * File names carried in workspace snapshot (upload names or typed placeholders from onboarding).
 * @param {Record<string, unknown>} growthData
 */
export function formatManualFileHints(growthData) {
  if (!growthData) return '—';
  const excel = String(growthData.fallbackExcelName ?? '').trim();
  const csv = String(growthData.fallbackCsvName ?? '').trim();
  const word = String(growthData.fallbackImageName ?? '').trim();
  const parts = [];
  if (excel) parts.push(`Spreadsheet: ${excel}`);
  if (csv) parts.push(`CSV: ${csv}`);
  if (word) parts.push(`Word: ${word}`);
  return parts.length ? parts.join(' · ') : '—';
}

/**
 * Social toggles from onboarding (Facebook / Instagram are selection-only in MVP; LinkedIn may be really connected).
 * @param {Record<string, unknown>} connectionData
 */
export function formatSocialSelectionsSummary(connectionData) {
  if (!connectionData) return '—';
  const on = socialMediaSources
    .filter((s) => connectionData[s.id])
    .map((s) => s.name);
  return on.length ? `${on.join(' · ')} (onboarding selections)` : 'None selected';
}

/**
 * @param {Record<string, unknown>} connectionData
 */
export function formatLinkedInOnboardingLine(connectionData) {
  if (!connectionData) return '—';
  return connectionData.linkedin
    ? 'Yes — flagged in onboarding (use Integrations to manage OAuth)'
    : 'Not selected in onboarding';
}

/**
 * @param {string} primaryGoal
 * @param {string} businessLabel
 */
export function buildOverviewHeroLede(primaryGoal, businessLabel) {
  const g = primaryGoal?.trim();
  if (g && g !== '—') {
    return `${businessLabel}: we have your growth focus as “${g}”. Here is what ONEVO saved from setup—refine it anytime under Brand DNA or Growth.`;
  }
  return `Welcome back, ${businessLabel}. Here is what ONEVO has on file from onboarding—edit anytime under Brand DNA or Growth.`;
}
