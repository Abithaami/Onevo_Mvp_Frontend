import { useCallback, useEffect, useState } from 'react';
import { fetchPublishedPosts } from '../../../features/content/contentDraftsApi.js';
import PublishedPostsList from './PublishedPostsList.jsx';
import './content-studio.css';

export default function PublishedPostsPage() {
  const [items, setItems] = useState(/** @type {unknown[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const r = await fetchPublishedPosts();
    setLoading(false);
    if (r.ok) {
      setItems(r.items);
    } else {
      setError(r.error);
      setItems([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="content-studio">
      <header className="content-studio__header">
        <h1 className="content-studio__title">Published posts</h1>
        <p className="content-studio__lede">
          LinkedIn posts published through ONEVO (newest first). Create and approve drafts in Content Studio, then publish or
          schedule — this list updates when a post goes live.
        </p>
        <button type="button" className="secondary-btn content-studio__refresh" onClick={() => void load()} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </header>
      <PublishedPostsList
        items={items}
        loading={loading}
        error={error}
        emptyHint="No published posts yet. Approve a draft, then publish or schedule from Content Studio — posts appear here after they go live."
      />
    </div>
  );
}
