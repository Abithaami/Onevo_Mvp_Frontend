import QuickLinkCard from '../components/exploration/QuickLinkCard.jsx';

export default function SecondaryExplorationZone({ links }) {
  return (
    <section className="db-zone db-zone--5" data-zone="exploration" aria-labelledby="db-zone-5-title">
      <div className="db-zone-header db-zone-header--muted">
        <h2 id="db-zone-5-title" className="db-zone-title">
          Explore more
        </h2>
        <p className="db-zone-sub">Deeper views when you need them — not competing with work above.</p>
      </div>
      <div className="db-quick-grid">
        {links?.map((l) => (
          <QuickLinkCard key={l.id} label={l.label} description={l.description} to={l.to} />
        ))}
      </div>
    </section>
  );
}
