export default function LandingHeroSection({ onOpenLogin }) {
  return (
    <section className="hero-section" aria-labelledby="hero-title">
      <div className="hero-content">
        <p className="eyebrow">Signal-to-action workspace</p>
        <h1 id="hero-title">Turn scattered business signals into approved next steps.</h1>
        <p>Onevo helps growing teams spot intent, review recommendations, approve actions, and learn what converts.</p>
        <div className="hero-actions">
          <button className="primary-btn hero-btn" type="button" onClick={onOpenLogin}>
            Start with Onevo
          </button>
          <a className="secondary-btn hero-btn" href="#services">
            Explore services
          </a>
        </div>
      </div>
    </section>
  );
}
