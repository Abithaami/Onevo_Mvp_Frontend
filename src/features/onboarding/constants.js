/** Labels for progress UI (spec: human-friendly, not numbers only). */
export const STEP_LABELS = ['About You', 'Your Business', 'Your Goals', 'Connect Tools', 'Your Preview'];

export const STEP_COUNT = STEP_LABELS.length;

export const ROLES = [
  { id: 'owner', label: 'Owner / Founder' },
  { id: 'manager', label: 'Manager' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'other', label: 'Other' }
];

export const HEARD_ABOUT = [
  { id: 'search', label: 'Search' },
  { id: 'referral', label: 'Referral' },
  { id: 'social', label: 'Social media' },
  { id: 'event', label: 'Event' },
  { id: 'other', label: 'Other' }
];

export const INDUSTRIES = [
  { id: 'retail', label: 'Retail' },
  { id: 'hospitality', label: 'Hospitality' },
  { id: 'professional', label: 'Professional services' },
  { id: 'health', label: 'Health & wellness' },
  { id: 'home', label: 'Home services' },
  { id: 'creative', label: 'Creative / agency' },
  { id: 'other', label: 'Other' }
];

/** Tools from Step 2 — used to prioritize integrations in Step 4. */
export const TOOL_CHIPS = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'quickbooks', label: 'QuickBooks' },
  { id: 'shopify', label: 'Shopify' },
  { id: 'google_business', label: 'Google Business' },
  { id: 'square', label: 'Square' }
];

export const INTEGRATIONS = [
  {
    id: 'instagram',
    label: 'Instagram',
    description: 'Pull signals from posts, DMs, and comments.',
    toolMatch: 'instagram'
  },
  {
    id: 'quickbooks',
    label: 'QuickBooks',
    description: 'Connect revenue and expense context.',
    toolMatch: 'quickbooks'
  },
  {
    id: 'facebook',
    label: 'Facebook',
    description: 'Pages and audience engagement.',
    toolMatch: 'facebook'
  },
  {
    id: 'shopify',
    label: 'Shopify',
    description: 'Orders and customer activity.',
    toolMatch: 'shopify'
  },
  {
    id: 'google_business',
    label: 'Google Business Profile',
    description: 'Reviews and local visibility.',
    toolMatch: 'google_business'
  }
];

/** Max selections per spec. */
export const MAX_GOALS = 2;

export const GOAL_OPTIONS = [
  {
    id: 'revenue',
    title: 'Grow revenue',
    description: 'Spot opportunities, improve follow-up, and act on what drives sales.'
  },
  {
    id: 'bookings',
    title: 'Get more bookings',
    description: 'Fill the calendar and reduce no-shows with clearer next steps.'
  },
  {
    id: 'repeat',
    title: 'Improve repeat customers',
    description: 'Turn one-time buyers into loyal regulars with timely touchpoints.'
  },
  {
    id: 'social',
    title: 'Stay consistent on social',
    description: 'Keep posting on a steady rhythm without burning out.'
  },
  {
    id: 'opportunities',
    title: 'Spot opportunities faster',
    description: 'See signals early so you can respond before competitors do.'
  },
  {
    id: 'time',
    title: 'Save time on marketing',
    description: 'Spend less time deciding what to do and more time doing it.'
  }
];

export function sortIntegrationsByTools(integrationList, selectedToolIds) {
  const toolSet = new Set(selectedToolIds);
  return [...integrationList].sort((a, b) => {
    const aMatch = toolSet.has(a.toolMatch) ? 0 : 1;
    const bMatch = toolSet.has(b.toolMatch) ? 0 : 1;
    return aMatch - bMatch;
  });
}

export function getIndustryLabel(id) {
  return INDUSTRIES.find((i) => i.id === id)?.label ?? id;
}

export function getRoleLabel(id) {
  return ROLES.find((r) => r.id === id)?.label ?? id;
}

export function getHeardLabel(id) {
  return HEARD_ABOUT.find((h) => h.id === id)?.label ?? id;
}

export function getGoalById(id) {
  return GOAL_OPTIONS.find((g) => g.id === id);
}

export function getIntegrationById(id) {
  return INTEGRATIONS.find((i) => i.id === id);
}
