import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LandingLayout from './landing/sections/LandingLayout.jsx';
import LandingPage from './landing/sections/LandingPage.jsx';
import { navItems } from '../data/onevoData.js';

export default function MarketingHomePage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function showLanding(targetHash = '#home') {
    setMenuOpen(false);
    window.setTimeout(() => {
      const target = document.querySelector(targetHash);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  function handleNavClick(event, item) {
    event.preventDefault();
    if (item.page === 'login') {
      navigate('/auth');
      return;
    }
    showLanding(item.href);
  }

  return (
    <>
      <a className="skip-link" href="#home">
        Skip to content
      </a>
      <LandingLayout
        menuOpen={menuOpen}
        navItems={navItems}
        onHomeClick={() => showLanding('#home')}
        onNavClick={handleNavClick}
        onToggleMenu={() => setMenuOpen((current) => !current)}
      >
        <LandingPage onOpenLogin={() => navigate('/auth')} />
      </LandingLayout>
    </>
  );
}
