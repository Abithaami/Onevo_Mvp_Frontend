import RecommendationCard from '../../../components/workbench/RecommendationCard.jsx';

export default function AiWorkbenchZone({ items, onRecommendationAction }) {
  return (
    <section className="db-zone db-zone--2" data-zone="workbench" aria-labelledby="db-zone-2-title">
      <div className="db-zone-header db-zone-header--workbench">
        <h2 id="db-zone-2-title" className="db-zone-title">
          AI workbench
        </h2>
        <p className="db-zone-sub">Onevo prepares — you decide what ships.</p>
      </div>

      <div className="db-workbench-stack">
        {items?.length ? (
          items.map((item) => (
            <RecommendationCard key={item.id} item={item} onAction={(action) => onRecommendationAction?.(item.id, action)} />
          ))
        ) : (
          <div className="db-empty">
            <p>No recommendations yet.</p>
            <p className="db-empty-hint">Complete setup or connect a channel to generate your first draft.</p>
          </div>
        )}
      </div>
    </section>
  );
}
