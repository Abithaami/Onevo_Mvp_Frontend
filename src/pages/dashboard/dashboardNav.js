/** Sidebar navigation groups for the post-onboarding dashboard. */
export const dashboardSidebarSections = [
  {
    id: 'workspace',
    title: 'Workspace',
    items: [
      { id: 'overview', abbr: 'ov', label: 'Overview' },
      { id: 'brand-dna', abbr: 'DN', label: 'Brand DNA' },
      { id: 'data-driven', abbr: 'DG', label: 'Data-driven growth' },
      { id: 'social-accounts', abbr: 'SC', label: 'Social accounts' },
    ],
  },
  {
    id: 'content',
    title: 'Content',
    items: [
      { id: 'content-studio', abbr: 'CS', label: 'Content Studio' },
      { id: 'calendar', abbr: 'CL', label: 'Calendar' },
      { id: 'drafts', abbr: 'DR', label: 'Drafts', tone: 'cream' },
      { id: 'published-posts', abbr: 'PB', label: 'Published Posts', tone: 'outline' },
    ],
  },
  {
    id: 'performance',
    title: 'Performance',
    items: [
      { id: 'engagement', abbr: 'EN', label: 'Engagement' },
      { id: 'analytics', abbr: 'AN', label: 'Analytics' },
    ],
  },
  {
    id: 'account',
    title: 'Account',
    items: [
      { id: 'billing', abbr: 'BC', label: 'Billing & Credits' },
      { id: 'notifications', abbr: 'NF', label: 'Notifications' },
    ],
  },
];
