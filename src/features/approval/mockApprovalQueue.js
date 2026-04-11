/**
 * Mock approval queue — same item shape as dashboard recommendations / contracts.js.
 * Replace with GET /approvals when API exists.
 */

export function getMockApprovalQueue() {
  return [
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
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      status: 'pending_review',
      actions: ['approve', 'edit', 'reject', 'details', 'later']
    },
    {
      id: 'r2',
      title: 'Reply suggestion — DM follow-up',
      type: 'reply',
      summary: 'Warm follow-up for a pricing question from yesterday.',
      reason: 'Fast replies improve conversion; tone matches your brand voice settings.',
      urgency: 'normal',
      previewContent:
        "Thanks for asking! Here's our current menu — happy to find a time that works this week. Would Tuesday or Thursday suit you better?",
      targetChannel: 'Instagram',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      status: 'pending_review',
      actions: ['approve', 'edit', 'reject', 'details', 'later']
    },
    {
      id: 'r3',
      title: 'Monthly recap — email draft',
      type: 'campaign',
      summary: 'Short newsletter highlighting wins and one clear CTA.',
      reason: 'Keeps your list engaged without a heavy sell.',
      urgency: 'normal',
      previewContent:
        'This month: more bookings, stronger reviews, and one offer your regulars will love. [CTA: Book your next visit]',
      targetChannel: 'Email',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      status: 'pending_review',
      actions: ['approve', 'edit', 'reject', 'details', 'later']
    }
  ];
}
