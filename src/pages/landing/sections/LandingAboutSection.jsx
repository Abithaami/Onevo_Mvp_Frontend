export default function LandingAboutSection() {
  return (
    <section className="section about-section" id="about" aria-labelledby="about-title">
      <div className="section-heading">
        <p className="eyebrow">About Onevo</p>
        <h2 id="about-title">
          Business attention, sorted by <span>what matters now.</span>
        </h2>
      </div>
      <div className="about-grid">
        <img
          src="https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1000&q=80"
          alt="A team reviewing business work on laptops"
          width="1000"
          height="720"
        />
        <div className="about-copy">
          <h3>Clear context before action</h3>
          <p>Every recommendation is connected to the signal that created it, the reason it matters, and the action waiting for review.</p>
          <div className="trace-flow" aria-label="Onevo workflow">
            <span>Signal</span>
            <span>Reason</span>
            <span>Approve</span>
            <span>Outcome</span>
          </div>
          <a href="#stories" className="secondary-btn">
            View stories
          </a>
        </div>
      </div>
    </section>
  );
}
