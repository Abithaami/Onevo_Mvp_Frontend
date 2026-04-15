import { Link } from 'react-router-dom';
import PublishedPostLinkedInExtras from '../../../features/content/components/PublishedPostLinkedInExtras.jsx';
import { mapPublishedPostRow } from '../../../features/content/contentDraftsApi.js';

function formatWhen(iso) {
  if (iso == null) return '—';
  try {
    const d = new Date(/** @type {string} */ (iso));
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return '—';
  }
}

/**
 * @param {{
 *   items: unknown[],
 *   loading: boolean,
 *   error: string,
 *   linkedInLiveAnalyticsAllowed?: boolean,
 *   linkedInAnalyticsDisabledReason?: string,
 *   linkedInAnalyticsComingSoon?: boolean,
 *   onLinkedInPostHidden?: () => void,
 *   emptyHint?: string,
 * }} props
 */
export default function PublishedPostsList({
  items,
  loading,
  error,
  linkedInLiveAnalyticsAllowed = false,
  linkedInAnalyticsDisabledReason = '',
  linkedInAnalyticsComingSoon = false,
  onLinkedInPostHidden,
  emptyHint,
}) {
  const rows = (items ?? []).map(mapPublishedPostRow).filter(Boolean);

  if (loading) {
    return (
      <p className="content-studio-muted" role="status">
        Loading published posts…
      </p>
    );
  }

  if (error) {
    return (
      <p className="content-studio-error" role="alert">
        {error}
      </p>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="content-studio-muted">
        {emptyHint ?? 'No published posts yet. Publish a LinkedIn draft above to see it here.'}
      </p>
    );
  }

  return (
    <ul className="content-studio-published-list" role="list">
      {rows.map((r) => (
        <li key={r.id} className="content-studio-published-item">
          <div className="content-studio-published-item__head">
            <strong className="content-studio-published-item__title">{r.title || 'Untitled'}</strong>
            <span className="content-studio-published-item__ch">{r.channel}</span>
          </div>
          {r.bodyPreview ? <p className="content-studio-published-item__preview">{r.bodyPreview}</p> : null}
          <p className="content-studio-published-item__meta">
            Published {formatWhen(r.publishedAtUtc)}
            {r.linkedInPostUrn ? (
              <>
                {' '}
                · <span className="content-studio-urn">{String(r.linkedInPostUrn)}</span>
              </>
            ) : null}
          </p>
          <p className="content-studio-muted content-studio-published-item__view">
            <Link
              className="content-studio-linklike"
              to={`/app/dashboard/content-studio?draftId=${encodeURIComponent(r.id)}`}
            >
              View full copy in Content Studio
            </Link>{' '}
            (read-only — already published)
          </p>
          {r.channel?.toLowerCase() === 'linkedin' ? (
            <PublishedPostLinkedInExtras
              contentItemId={r.id}
              linkedInPostUrn={r.linkedInPostUrn ? String(r.linkedInPostUrn) : null}
              linkedInLiveAnalyticsAllowed={linkedInLiveAnalyticsAllowed}
              analyticsDisabledReason={linkedInAnalyticsDisabledReason}
              analyticsComingSoon={linkedInAnalyticsComingSoon}
              onPostHidden={onLinkedInPostHidden}
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}
