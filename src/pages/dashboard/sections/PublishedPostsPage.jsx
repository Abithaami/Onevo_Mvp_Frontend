import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchLinkedInAnalyticsCapabilities,
  fetchPublishedPosts,
  isLinkedInMemberPostAnalyticsReadyForUse,
} from '../../../features/content/contentDraftsApi.js';
import PublishedPostsList from './PublishedPostsList.jsx';
import './content-studio.css';

function listHasLinkedInChannel(rawItems) {
  return (rawItems ?? []).some((row) => {
    if (!row || typeof row !== 'object') return false;
    const ch = /** @type {Record<string, unknown>} */ (row).channel ?? /** @type {Record<string, unknown>} */ (row).Channel;
    return String(ch ?? '').toLowerCase() === 'linkedin';
  });
}

export default function PublishedPostsPage() {
  const [items, setItems] = useState(/** @type {unknown[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [capability, setCapability] = useState(/** @type {null | Record<string, unknown>} */ (null));
  const [capabilityError, setCapabilityError] = useState('');
  const [loadingCapability, setLoadingCapability] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadingCapability(true);
    setError('');
    setCapabilityError('');
    const [postsR, capR] = await Promise.all([fetchPublishedPosts(), fetchLinkedInAnalyticsCapabilities()]);
    setLoading(false);
    setLoadingCapability(false);
    if (capR.ok) {
      setCapability(capR.data);
      setCapabilityError('');
    } else {
      setCapability(null);
      setCapabilityError(capR.error);
    }
    if (postsR.ok) {
      setItems(postsR.items);
    } else {
      setError(postsR.error);
      setItems([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const pageBusy = loading || loadingCapability;
  const linkedInLiveAnalyticsAllowed = useMemo(
    () => isLinkedInMemberPostAnalyticsReadyForUse(capability),
    [capability],
  );
  const hasLinkedInPosts = useMemo(() => listHasLinkedInChannel(items), [items]);
  const pageReady = !pageBusy;
  const linkedInAnalyticsDisabledReason = useMemo(() => {
    if (capabilityError) {
      return 'Could not verify LinkedIn permissions. Use Refresh above or try again later.';
    }
    if (!capability || linkedInLiveAnalyticsAllowed) return '';
    return (
      String(capability.summary ?? '').trim() ||
      'LinkedIn analytics are not available for the current app permissions. Add the required LinkedIn analytics scope and reconnect LinkedIn.'
    );
  }, [capabilityError, capability, linkedInLiveAnalyticsAllowed]);

  return (
    <div className="content-studio">
      <header className="content-studio__header">
        <h1 className="content-studio__title">Published posts</h1>
        <p className="content-studio__lede">
          LinkedIn posts published through ONEVO (newest first). Create and approve drafts in Content Studio, then publish or
          schedule — this list updates when a post goes live.
        </p>
        <button type="button" className="secondary-btn content-studio__refresh" onClick={() => void load()} disabled={pageBusy}>
          {pageBusy ? 'Refreshing…' : 'Refresh'}
        </button>
      </header>

      {pageReady && capabilityError ? (
        <p className="content-studio-error analytics-capability-banner" role="alert">
          Could not load LinkedIn capabilities: {capabilityError}
        </p>
      ) : null}

      {pageReady && !capabilityError && capability && !linkedInLiveAnalyticsAllowed && hasLinkedInPosts ? (
        <div className="content-studio-muted analytics-capability-banner" role="status">
          <strong>Live LinkedIn analytics unavailable.</strong>{' '}
          {String(capability.summary ?? '').trim() ||
            'LinkedIn analytics are not available for the current app permissions. Add the required LinkedIn analytics scope and reconnect LinkedIn.'}
        </div>
      ) : null}

      <PublishedPostsList
        items={items}
        loading={pageBusy}
        error={error}
        linkedInLiveAnalyticsAllowed={linkedInLiveAnalyticsAllowed && !capabilityError}
        linkedInAnalyticsDisabledReason={linkedInAnalyticsDisabledReason}
        linkedInAnalyticsComingSoon
        onLinkedInPostHidden={() => void load()}
        emptyHint="No published posts yet. Approve a draft, then publish or schedule from Content Studio — posts appear here after they go live."
      />
    </div>
  );
}
