import OnevoLogo from '../../../components/OnevoLogo';

export default function LandingNavbar({ menuOpen, navItems, onHomeClick, onNavClick, onToggleMenu }) {
  return (
    <header className="site-header">
      <a
        href="#home"
        className="brand"
        aria-label="Onevo home"
        onClick={(event) => {
          event.preventDefault();
          onHomeClick();
        }}
      >
        <OnevoLogo />
        <span>ONEVO</span>
      </a>

      <nav className={`navbar ${menuOpen ? 'active' : ''}`} aria-label="Primary navigation">
        {navItems.map((item) => (
          <a key={item.href} href={item.href} onClick={(event) => onNavClick(event, item)}>
            {item.label}
          </a>
        ))}
      </nav>

      <button type="button" className="menu-button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={onToggleMenu}>
        <span />
        <span />
        <span />
      </button>
    </header>
  );
}
