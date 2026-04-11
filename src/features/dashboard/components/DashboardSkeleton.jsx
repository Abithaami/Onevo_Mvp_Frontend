export default function DashboardSkeleton() {
  return (
    <div className="db-page db-page--loading" aria-busy="true" aria-label="Loading dashboard">
      <div className="db-skeleton-header">
        <div className="db-skeleton-line db-skeleton-line--title" />
        <div className="db-skeleton-line db-skeleton-line--lead" />
      </div>
      <div className="db-skeleton-zone db-skeleton-zone--1">
        <div className="db-skeleton-line db-skeleton-line--sm" />
        <div className="db-skeleton-block" />
      </div>
      <div className="db-skeleton-zone">
        <div className="db-skeleton-line db-skeleton-line--md" />
        <div className="db-skeleton-card" />
      </div>
      <div className="db-skeleton-kpi">
        <div className="db-skeleton-pill" />
        <div className="db-skeleton-pill" />
        <div className="db-skeleton-pill" />
        <div className="db-skeleton-pill" />
      </div>
      <div className="db-skeleton-zone">
        <div className="db-skeleton-line db-skeleton-line--sm" />
        <div className="db-skeleton-block db-skeleton-block--short" />
      </div>
    </div>
  );
}
