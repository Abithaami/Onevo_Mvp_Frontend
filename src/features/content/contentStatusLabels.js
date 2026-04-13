/**
 * Human-readable labels for content item statuses (LinkedIn draft workflow).
 * Backend uses Pascal-case enum names (e.g. Draft, Approved); create API may return lowercase "draft".
 *
 * @param {string | undefined | null} raw
 * @returns {string}
 */
export function formatContentStatusLabel(raw) {
  const s = String(raw ?? '')
    .trim()
    .toLowerCase();
  if (!s) return '—';
  if (s === 'draft') return 'Draft';
  if (s === 'approved') return 'Approved';
  if (s === 'scheduled') return 'Scheduled';
  if (s === 'published') return 'Published';
  if (s === 'inreview') return 'In review';
  if (s === 'archived') return 'Archived';
  return String(raw).trim() || '—';
}
