import { useState } from 'react';
import Toast from './components/Toast';
import { navItems } from './data/onevoData';
import LoginPage from './pages/LoginPage';
import LandingLayout from './pages/landing/sections/LandingLayout';
import LandingPage from './pages/landing/sections/LandingPage';
import { normalizeWorkspaceSetup } from './data/setupData';
import OnboardingPage from './pages/onboarding/sections/OnboardingPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import SocialConnectionsPage from './pages/social-connections/sections/SocialConnectionsPage';

export default function Root() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePage, setActivePage] = useState('landing');
  const [mode, setMode] = useState('sign-in');
  const [toast, setToast] = useState(null);
  const [workspaceSetup, setWorkspaceSetup] = useState(null);
  const [loading, setLoading] = useState(null);
  const [login, setLogin] = useState({ email: '', password: '', remember: false });
  const [register, setRegister] = useState({ fullName: '', email: '', password: '', terms: false });

  function showToast(message, type = 'info') {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 4000);
  }

  function selectMode(nextMode) {
    setMode(nextMode);
    setToast(null);
  }

  function showLanding(targetHash = '#home') {
    setActivePage('landing');
    setMenuOpen(false);
    window.setTimeout(() => {
      const target = document.querySelector(targetHash);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  function showLogin() {
    setActivePage('login');
    setMenuOpen(false);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
  }

  function showConnections() {
    setActivePage('connections');
    setMenuOpen(false);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
  }

  function showOnboarding() {
    setActivePage('onboarding');
    setMenuOpen(false);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
  }

  function showDashboard(payload) {
    setWorkspaceSetup(normalizeWorkspaceSetup(payload));
    setActivePage('dashboard');
    setMenuOpen(false);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
  }

  function handleSignOutFromDashboard() {
    setWorkspaceSetup(null);
    showLanding('#home');
    showToast('You have been signed out.', 'info');
  }

  function handleNavClick(event, item) {
    event.preventDefault();

    if (item.page === 'connections') {
      showConnections();
      return;
    }

    if (item.page === 'login') {
      showLogin();
      return;
    }

    showLanding(item.href);
  }

  function handleLoginSubmit(event) {
    event.preventDefault();

    if (!login.email.trim() || !login.password.trim()) {
      showToast('Please enter both email and password.', 'error');
      return;
    }

    setLoading('login');
    window.setTimeout(() => {
      setLoading(null);
      showToast('Login successful! Redirecting...', 'success');
      showOnboarding();
    }, 1200);
  }

  function handleRegisterSubmit(event) {
    event.preventDefault();

    if (!register.fullName.trim() || !register.email.trim() || !register.password.trim()) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    if (register.password.length < 8) {
      showToast('Password must be at least 8 characters long.', 'error');
      return;
    }

    if (!register.terms) {
      showToast('Please agree to the Terms of Service.', 'error');
      return;
    }

    setLoading('register');
    window.setTimeout(() => {
      setLoading(null);
      showToast('Account created successfully!', 'success');
      showConnections();
    }, 1200);
  }

  function renderPage() {
    if (activePage === 'connections') {
      return <SocialConnectionsPage onBackToLanding={showLanding} showToast={showToast} />;
    }

    if (activePage === 'login') {
      return (
        <LoginPage
          mode={mode}
          selectMode={selectMode}
          login={login}
          setLogin={setLogin}
          register={register}
          setRegister={setRegister}
          loading={loading}
          showToast={showToast}
          handleLoginSubmit={handleLoginSubmit}
          handleRegisterSubmit={handleRegisterSubmit}
        />
      );
    }

    return <LandingPage onOpenLogin={showLogin} />;
  }

  if (activePage === 'dashboard') {
    return (
      <>
        <a className="skip-link" href="#dashboard">
          Skip to content
        </a>

        <DashboardPage
          setup={normalizeWorkspaceSetup(workspaceSetup)}
          onSetupChange={setWorkspaceSetup}
          onOpenConnections={showConnections}
          onSignOut={handleSignOutFromDashboard}
        />

        <Toast toast={toast} />
      </>
    );
  }

  if (activePage === 'connections') {
    return (
      <>
        <a className="skip-link" href="#connections">
          Skip to content
        </a>

        <SocialConnectionsPage onBackToLanding={showLanding} showToast={showToast} />

        <Toast toast={toast} />
      </>
    );
  }

  if (activePage === 'onboarding') {
    return (
      <>
        <a className="skip-link" href="#onboarding">
          Skip to content
        </a>

        <OnboardingPage onBackToLanding={showLanding} onOpenConnections={showConnections} onCompleteOnboarding={showDashboard} />

        <Toast toast={toast} />
      </>
    );
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
        showFooter={activePage !== 'login'}
      >
        {renderPage()}
      </LandingLayout>

      <Toast toast={toast} />
    </>
  );
}
