import ActivityItem from './ActivityItem.jsx';

export default function ActivityFeed({ items }) {
  if (!items?.length) {
    return (
      <div className="db-empty db-empty--feed">
        <p>No recent activity yet.</p>
        <p className="db-empty-hint">Approvals, publishes, and syncs will show up here.</p>
      </div>
    );
  }

  return (
    <ul className="db-activity-feed">
      {items.map((ev) => (
        <ActivityItem key={ev.id} title={ev.title} detail={ev.detail} at={ev.at} type={ev.type} />
      ))}
    </ul>
  );
}
