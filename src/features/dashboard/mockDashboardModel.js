/**
 * Mock payload for the legacy `DashboardView` prototype only (not used by the main dashboard overview).
 */

import { getHandoffPayloadForModel } from './handoffSession.js';

export function getMockDashboardModel() {
  return {
    handoff: getHandoffPayloadForModel(),
    attention: {
      coach: {
        title: 'Start here',
        body: 'Review your first AI suggestion below — approve, edit, or skip. You stay in control of every outbound action.'
      },
      alerts: [
        {
          id: 'a1',
          variant: 'warning',
          title: 'Instagram needs reconnecting',
          detail: 'Reconnect to restore live recommendations and publishing.',
          actionLabel: 'Fix connection',
          href: '/app/integrations'
        },
        {
          id: 'a2',
          variant: 'action',
          title: '2 items need your approval',
          detail: 'Draft posts are ready for review before they go live.',
          actionLabel: 'Review queue',
          href: '/app/approval'
        }
      ]
    },
    recommendations: [
      {
        id: 'r1',
        title: 'Weekend promo post — Instagram',
        type: 'post_draft',
        summary: 'Short caption + image hook tuned for your salon audience.',
        reason: 'Engagement softened last week; this angle highlights booking urgency without sounding salesy.',
        urgency: 'high',
        previewContent:
          'This weekend only — book a cut & color and save 15%. Spots are limited. Reply BOOK or tap the link in bio.',
        targetChannel: 'Instagram',
        createdAt: new Date().toISOString(),
        status: 'pending_review',
        actions: ['approve', 'edit', 'reject', 'details', 'later']
      }
    ],
    kpis: [
      {
        id: 'engagement_trend',
        value: '+12%',
        hint: 'vs last 7 days',
        trend: 'up'
      },
      {
        id: 'content_output',
        value: '5',
        hint: 'pieces this week',
        trend: 'flat'
      },
      {
        id: 'approvals_week',
        value: '3',
        hint: 'approved → published',
        trend: 'up'
      },
      {
        id: 'leads_signals',
        value: '8',
        hint: 'inquiries & DMs',
        trend: 'up'
      }
    ],
    activities: [
      {
        id: 'e1',
        type: 'recommendation_generated',
        title: 'New recommendation ready',
        detail: 'Weekend promo draft is waiting in your workbench.',
        at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'e2',
        type: 'post_published',
        title: 'Post published',
        detail: 'Tuesday tips post went live on Instagram.',
        at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'e3',
        type: 'insight_refreshed',
        title: 'Insights refreshed',
        detail: 'Best posting window updated based on last 14 days.',
        at: new Date(Date.now() - 172800000).toISOString()
      }
    ],
    quickLinks: [
      { id: 'q1', label: 'Full analytics', description: 'Trends and breakdowns', to: '/app/analytics' },
      { id: 'q2', label: 'Integrations', description: 'Channels and data sources', to: '/app/integrations' },
      { id: 'q3', label: 'Settings', description: 'Workspace and notifications', to: '/app/settings' }
    ]
  };
}
