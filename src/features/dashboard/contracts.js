/**
 * Dashboard data contracts — keep in sync with
 * docs/ui/dashboard-action-first-architecture.md
 */

/** @typedef {'engagement_trend'|'content_output'|'approvals_week'|'leads_signals'} KpiId */

export const DASHBOARD_KPI_ORDER = ['engagement_trend', 'content_output', 'approvals_week', 'leads_signals'];

export const KPI_LABELS = {
  engagement_trend: 'Engagement',
  content_output: 'Content output',
  approvals_week: 'Approvals',
  leads_signals: 'Leads & signals'
};

/** @typedef {'up'|'down'|'flat'} TrendDir */

/**
 * Activity feed — allowed MVP event types (Zone 4).
 * @typedef {'post_approved'|'post_rejected'|'post_published'|'connection_expired'|'recommendation_generated'|'recommendation_dismissed'|'sync_failed'|'insight_refreshed'} ActivityEventType
 */

export const ACTIVITY_EVENT_TYPES = [
  'post_approved',
  'post_rejected',
  'post_published',
  'connection_expired',
  'recommendation_generated',
  'recommendation_dismissed',
  'sync_failed',
  'insight_refreshed'
];

/**
 * Recommendation / approval item (Zone 2).
 * @typedef {Object} RecommendationItem
 * @property {string} id
 * @property {string} title
 * @property {'post_draft'|'campaign'|'reply'|'action'} type
 * @property {string} summary
 * @property {string} reason
 * @property {'normal'|'high'} urgency
 * @property {string} previewContent
 * @property {string|null} targetChannel
 * @property {string} createdAt ISO
 * @property {'pending_review'|'approved'|'rejected'|'saved'} status
 * @property {('approve'|'edit'|'reject'|'details'|'later')[]} actions
 */

export const RECOMMENDATION_ITEM_FIELDS = [
  'id',
  'title',
  'type',
  'summary',
  'reason',
  'urgency',
  'previewContent',
  'targetChannel',
  'createdAt',
  'status',
  'actions'
];
