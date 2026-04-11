import ActivityFeed from '../components/activity/ActivityFeed.jsx';

export default function RecentActivityZone({ items }) {
  return (
    <section className="db-zone db-zone--4" data-zone="activity" aria-labelledby="db-zone-4-title">
      <div className="db-zone-header db-zone-header--compact">
        <h2 id="db-zone-4-title" className="db-zone-title">
          Recent activity
        </h2>
        <p className="db-zone-sub">What changed — in plain language.</p>
      </div>
      <ActivityFeed items={items} />
    </section>
  );
}
