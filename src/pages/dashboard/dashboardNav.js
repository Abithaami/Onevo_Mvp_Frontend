/** Sidebar navigation groups: each item has `to` for the single primary nav (React Router). */
export const dashboardSidebarSections = [
  {
    id: 'workspace',
    title: 'Workspace',
    items: [
      { id: 'overview', abbr: 'ov', label: 'Overview', to: '/app/dashboard' },
      { id: 'brand-dna', abbr: 'DN', label: 'Brand DNA', to: '/app/dashboard/brand-dna' },
      { id: 'data-driven', abbr: 'DG', label: 'Data-driven growth', to: '/app/dashboard/data-driven' },
      { id: 'social-accounts', abbr: 'SC', label: 'Social accounts', to: '/app/dashboard/social-accounts' },
    ],
  },
  {
    id: 'workflow',
    title: 'Workflow',
    items: [
      { id: 'approval', abbr: 'AP', label: 'Approval', to: '/app/approval' },
      { id: 'integrations', abbr: 'IN', label: 'Integrations', to: '/app/integrations' },
      { id: 'orchestrator', abbr: 'OR', label: 'Orchestrator', to: '/app/dashboard/orchestrator' },
      { id: 'signals', abbr: 'SG', label: 'Signals', to: '/app/dashboard/signals' },
    ],
  },
  {
    id: 'content',
    title: 'Content',
    items: [
      { id: 'content-studio', abbr: 'CS', label: 'Content Studio', to: '/app/dashboard/content-studio' },
      { id: 'calendar', abbr: 'CL', label: 'Calendar', to: '/app/dashboard/calendar' },
      { id: 'drafts', abbr: 'DR', label: 'Drafts', tone: 'cream', to: '/app/dashboard/drafts' },
      { id: 'published-posts', abbr: 'PB', label: 'Published Posts', tone: 'outline', to: '/app/dashboard/published-posts' },
    ],
  },
  {
    id: 'performance',
    title: 'Performance',
    items: [
      { id: 'engagement', abbr: 'EN', label: 'Engagement', to: '/app/dashboard/engagement' },
      { id: 'analytics', abbr: 'AN', label: 'Analytics', to: '/app/analytics' },
    ],
  },
  {
    id: 'account',
    title: 'Account',
    items: [
      { id: 'billing', abbr: 'BC', label: 'Billing & Credits', to: '/app/dashboard/billing' },
      { id: 'notifications', abbr: 'NF', label: 'Notifications', to: '/app/dashboard/notifications' },
      { id: 'settings', abbr: 'ST', label: 'Settings', to: '/app/settings' },
    ],
  },
];
