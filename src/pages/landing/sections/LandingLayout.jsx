import LandingFooterSection from './LandingFooterSection';
import LandingNavbar from './LandingNavbar';

export default function LandingLayout({ children, menuOpen, navItems, onHomeClick, onNavClick, onToggleMenu, showFooter = true }) {
  return (
    <>
      <LandingNavbar menuOpen={menuOpen} navItems={navItems} onHomeClick={onHomeClick} onNavClick={onNavClick} onToggleMenu={onToggleMenu} />
      {children}
      {showFooter && <LandingFooterSection onHomeClick={onHomeClick} />}
    </>
  );
}
