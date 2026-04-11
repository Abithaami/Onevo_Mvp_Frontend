import OnevoLogo from '../../../components/OnevoLogo';

export default function LandingFooterSection({ onHomeClick }) {
  return (
    <footer className="footer" id="contact">
      <div className="footer-grid">
        <div>
          <a
            href="#home"
            className="footer-brand"
            aria-label="Onevo home"
            onClick={(event) => {
              event.preventDefault();
              onHomeClick();
            }}
          >
            <OnevoLogo />
            <span>ONEVO</span>
          </a>
          <p>Signals, recommendations, approvals, and outcomes for SMB growth teams.</p>
        </div>
        <div>
          <h2>Contact</h2>
          <p>hello@onevo.ai</p>
          <p>Colombo, Sri Lanka</p>
        </div>
        <div>
          <h2>Newsletter</h2>
          <form className="newsletter" onSubmit={(event) => event.preventDefault()}>
            <label htmlFor="newsletter-email">Email Address</label>
            <input id="newsletter-email" type="email" placeholder="you@example.com" />
            <button type="submit" className="primary-btn">
              Subscribe
            </button>
          </form>
        </div>
      </div>
      <div className="copyright">
        <p>Copyright 2026 Onevo. All rights reserved.</p>
        <a
          href="#home"
          aria-label="Back to top"
          onClick={(event) => {
            event.preventDefault();
            onHomeClick();
          }}
        >
          Top
        </a>
      </div>
    </footer>
  );
}
