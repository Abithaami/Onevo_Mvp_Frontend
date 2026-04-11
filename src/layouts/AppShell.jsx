import { NavLink, Outlet } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/app/dashboard', label: 'Dashboard' },
  { to: '/app/onboarding', label: 'Onboarding' },
  { to: '/app/approval', label: 'Approval' },
  { to: '/app/integrations', label: 'Integrations' },
  { to: '/app/analytics', label: 'Analytics' },
  { to: '/app/settings', label: 'Settings' }
];

export default function AppShell() {
  return (
    <div className="app-shell">
      <header className="shell-header">
        <span className="shell-title">Onevo</span>
        <NavLink to="/auth" className="shell-link">
          Auth
        </NavLink>
      </header>
      <div className="shell-body">
        <aside className="shell-sidebar" aria-label="Primary navigation">
          <nav className="shell-nav">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `shell-nav-link ${isActive ? 'active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="shell-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
