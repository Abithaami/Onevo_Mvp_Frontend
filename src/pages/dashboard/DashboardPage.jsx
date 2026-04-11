import { useState } from 'react';
import OnevoLogo from '../../components/OnevoLogo';
import { socialMediaSources } from '../../data/onevoData';
import { dashboardSidebarSections } from './dashboardNav';
import CalendarPage from './sections/CalendarPage';
import { BrandDnaEditPanel, DataDrivenEditPanel, SocialAccountsEditPanel } from './sections/edit-panels';

export default function DashboardPage({ setup, onSetupChange, onOpenConnections, onSignOut }) {
  const [activeNav, setActiveNav] = useState('overview');
  const businessLabel = setup.brandData.businessName?.trim() || 'Your workspace';
  const industry = setup.brandData.industry?.trim() || '—';
  const goal = setup.growthData.primaryGoal?.trim() || '—';
  const metric = setup.growthData.successMetric?.trim() || '—';
  const connectionCount = socialMediaSources.filter((source) => setup.connectionData[source.id]).length;
  const completedSteps = setup.stepStates?.filter((s) => s === 'completed').length ?? 0;
  const setupPercent = Math.round((completedSteps / 3) * 100);

  function handleSidebarNav(item) {
    setActiveNav(item.id);
  }

  function renderWorkspaceMain() {
    if (activeNav === 'brand-dna') {
      return (
        <BrandDnaEditPanel brandData={setup.brandData} onBrandChange={(brandData) => onSetupChange({ ...setup, brandData })} />
      );
    }
    if (activeNav === 'data-driven') {
      return (
        <DataDrivenEditPanel growthData={setup.growthData} onGrowthChange={(growthData) => onSetupChange({ ...setup, growthData })} />
      );
    }
    if (activeNav === 'social-accounts') {
      return (
        <SocialAccountsEditPanel
          connectionData={setup.connectionData}
          onConnectionChange={(connectionData) => onSetupChange({ ...setup, connectionData })}
        />
      );
    }
    if (activeNav === 'calendar') {
      return <CalendarPage />;
    }

    if (activeNav === 'overview') {
      return (
        <>
          <section className="dashboard-hero" aria-labelledby="dashboard-welcome-title">
            <div className="dashboard-hero__main">
              <p className="dashboard-hero__eyebrow">
                <span className="dashboard-hero__dot" aria-hidden="true" />
                Live workspace
              </p>
              <h1 id="dashboard-welcome-title">
                <span className="dashboard-hero__greeting">Hello,</span>{' '}
                <span className="dashboard-hero__name">{businessLabel}</span>
              </h1>
              <p className="dashboard-hero__lede">
                Your approval-first control room—surface what matters, keep context from onboarding, and stay ready when new signals arrive.
              </p>
              <div className="dashboard-hero__chips">
                <span className="dashboard-chip dashboard-chip--teal">Brand &amp; audience</span>
                <span className="dashboard-chip dashboard-chip--blue">Growth targets</span>
                <span className="dashboard-chip dashboard-chip--slate">Sources</span>
              </div>
            </div>

            <div className="dashboard-hero__panel" role="status" aria-label="Setup completion">
              <div
                className="dashboard-setup-dial"
                style={{ '--progress': String(setupPercent) }}
                role="img"
                aria-label={`Setup profile ${setupPercent} percent complete`}
              >
                <div className="dashboard-setup-dial__inner">
                  <span className="dashboard-setup-dial__value">{setupPercent}</span>
                  <span className="dashboard-setup-dial__unit">%</span>
                </div>
              </div>
              <div className="dashboard-hero__panel-copy">
                <strong>Profile strength</strong>
                <p>
                  {completedSteps} of 3 setup blocks saved · {connectionCount} source{connectionCount === 1 ? '' : 's'} in loop
                </p>
              </div>
            </div>
          </section>

          <section className="dashboard-kpis" aria-label="Key metrics">
            <article className="dashboard-kpi">
              <span className="dashboard-kpi__label">Setup</span>
              <strong className="dashboard-kpi__value">{setupPercent}%</strong>
              <span className="dashboard-kpi__hint">Onboarding coverage</span>
            </article>
            <article className="dashboard-kpi">
              <span className="dashboard-kpi__label">Sources</span>
              <strong className="dashboard-kpi__value">{connectionCount}</strong>
              <span className="dashboard-kpi__hint">Selected for signals</span>
            </article>
            <article className="dashboard-kpi">
              <span className="dashboard-kpi__label">Inbox queue</span>
              <strong className="dashboard-kpi__value dashboard-kpi__value--muted">—</strong>
              <span className="dashboard-kpi__hint">Awaiting first signals</span>
            </article>
            <article className="dashboard-kpi">
              <span className="dashboard-kpi__label">Focus metric</span>
              <strong className="dashboard-kpi__value dashboard-kpi__value--sm">{metric.length > 18 ? `${metric.slice(0, 18)}…` : metric}</strong>
              <span className="dashboard-kpi__hint">Success signal</span>
            </article>
          </section>

          <section className="dashboard-insights" aria-labelledby="dashboard-insights-title">
            <div className="dashboard-section-head">
              <h2 id="dashboard-insights-title">Your operating context</h2>
              <p>Summarized from onboarding—used to rank opportunities and explain recommendations.</p>
            </div>
            <div className="dashboard-insights__grid">
              <article className="dashboard-tile dashboard-tile--teal">
                <div className="dashboard-tile__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                    <path d="M4 20V8l4-4h12v16H4Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
                    <path d="M8 8h8M8 12h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <h3 className="dashboard-tile__title">Business context</h3>
                <p className="dashboard-tile__highlight">{industry}</p>
                <p className="dashboard-tile__body">Category and positioning shape how ONEVO reads tone and intent in conversations.</p>
              </article>
              <article className="dashboard-tile dashboard-tile--blue">
                <div className="dashboard-tile__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                    <path d="M4 19h16M7 15l3-4 3 3 5-7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4 5h16v14H4V5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" opacity="0.35" />
                  </svg>
                </div>
                <h3 className="dashboard-tile__title">Growth focus</h3>
                <p className="dashboard-tile__highlight">{goal}</p>
                <p className="dashboard-tile__body">The outcome you are driving toward—feeds priority scoring and follow-up suggestions.</p>
              </article>
              <article className="dashboard-tile dashboard-tile--violet">
                <div className="dashboard-tile__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                  </svg>
                </div>
                <h3 className="dashboard-tile__title">Success metric</h3>
                <p className="dashboard-tile__highlight">{metric}</p>
                <p className="dashboard-tile__body">What “winning” looks like when comparing two opportunities side by side.</p>
              </article>
            </div>
          </section>

          <div className="dashboard-split">
            <section className="dashboard-queue" aria-labelledby="dashboard-queue-title">
              <div className="dashboard-section-head">
                <h2 id="dashboard-queue-title">Next best actions</h2>
                <p>Ranked for approval—fills in automatically when conversations and sources are active.</p>
              </div>
              <ul className="dashboard-queue__list">
                <li>
                  <div className="dashboard-queue__icon dashboard-queue__icon--accent" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                      <path d="M8 10h8M8 14h5M6 4h12a2 2 0 0 1 2 2v13l-4-3-4 3-4-3-4 3V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.65" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="dashboard-queue__body">
                    <div className="dashboard-queue__row">
                      <strong>Review high-intent threads</strong>
                      <span className="dashboard-queue__tag">Soon</span>
                    </div>
                    <p>Urgent buyer signals will appear here with rationale so you can approve or defer in one pass.</p>
                  </div>
                </li>
                <li>
                  <div className="dashboard-queue__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                      <path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" />
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
                    </svg>
                  </div>
                  <div className="dashboard-queue__body">
                    <div className="dashboard-queue__row">
                      <strong>Expand source coverage</strong>
                      <span className="dashboard-queue__tag dashboard-queue__tag--muted">Optional</span>
                    </div>
                    <p>Add OAuth-backed channels from Connections whenever you are ready—manual upload stays available.</p>
                  </div>
                </li>
              </ul>
            </section>

            <aside className="dashboard-rail" aria-label="Readiness">
              <div className="dashboard-rail__card">
                <h3 className="dashboard-rail__title">Signal readiness</h3>
                <div className="dashboard-rail__meter">
                  <div className="dashboard-rail__meter-fill" style={{ width: `${Math.min(100, connectionCount * 25)}%` }} />
                </div>
                <p className="dashboard-rail__stat">
                  <strong>{connectionCount}</strong> of many sources selected
                </p>
                <p className="dashboard-rail__note">Connect more channels to widen the funnel—ranking stays approval-first.</p>
                {onOpenConnections && (
                  <button type="button" className="primary-btn dashboard-rail__btn" onClick={onOpenConnections}>
                    Manage connections
                  </button>
                )}
              </div>
              <div className="dashboard-rail__card dashboard-rail__card--tip">
                <p className="dashboard-rail__tip-label">Tip</p>
                <p className="dashboard-rail__tip-text">Keep your growth goal updated quarterly so recommendations stay aligned with what you are optimizing for.</p>
              </div>
            </aside>
          </div>
        </>
      );
    }

    return (
      <section className="dashboard-placeholder" aria-labelledby="dashboard-placeholder-title">
        <h1 id="dashboard-placeholder-title">Coming soon</h1>
        <p>This part of the workspace is not available in the MVP yet.</p>
      </section>
    );
  }

  return (
    <div className="dashboard-page" id="dashboard" aria-label="Dashboard">
      <div className="dashboard-page__ambient" aria-hidden="true" />

      <header className="dashboard-topbar">
        <div className="dashboard-topbar__brand">
          <div className="dashboard-topbar__logo-wrap">
            <OnevoLogo className="dashboard-logo" />
          </div>
          <div className="dashboard-topbar__titles">
            <span className="dashboard-product-name">ONEVO</span>
            <span className="dashboard-workspace-name">{businessLabel}</span>
          </div>
        </div>

        <div className="dashboard-topbar__search" role="search">
          <label htmlFor="dashboard-search" className="visually-hidden">
            Search workspace
          </label>
          <span className="dashboard-search__icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15ZM21 21l-4.2-4.2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <input id="dashboard-search" type="search" placeholder="Search opportunities, people, tags…" autoComplete="off" />
        </div>

        <div className="dashboard-topbar__actions">
          <button type="button" className="dashboard-icon-btn" aria-label="Notifications (coming soon)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22ZM18 16v-5a6 6 0 0 0-5-5.91V8a1 1 0 1 0-2 0v.09A6 6 0 0 0 6 11v5l-2 2v1h16v-1l-2-2Z"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinejoin="round"
              />
            </svg>
            <span className="dashboard-icon-btn__dot" />
          </button>
          <span className="dashboard-user-chip">
            <span className="dashboard-user-chip__avatar" aria-hidden="true">
              {businessLabel.slice(0, 1).toUpperCase()}
            </span>
            <span className="dashboard-user-chip__label">Account</span>
          </span>
        </div>
      </header>

      <div className="dashboard-body">
        <aside className="dashboard-sidebar dashboard-sidebar--rail" aria-label="Workspace navigation">
          {dashboardSidebarSections.map((section) => (
            <div key={section.id} className="dashboard-sidebar__group">
              <h3 className="dashboard-sidebar__group-title">{section.title}</h3>
              <ul className="dashboard-rail-list" role="list">
                {section.items.map((item) => {
                  const isActive = activeNav === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={[
                          'dashboard-rail-item',
                          isActive && 'dashboard-rail-item--active',
                          item.tone === 'cream' && 'dashboard-rail-item--cream',
                          item.tone === 'outline' && 'dashboard-rail-item--outline',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onClick={() => handleSidebarNav(item)}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <span className="dashboard-rail-item__abbr">{item.abbr}</span>
                        <span className="dashboard-rail-item__label">{item.label}</span>
                        {item.pro ? (
                          <span className="dashboard-rail-item__pro" title="Pro feature">
                            Pro
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {onSignOut ? (
            <div className="dashboard-sidebar__signout">
              <button type="button" className="dashboard-signout-btn" onClick={onSignOut}>
                Sign out
              </button>
            </div>
          ) : null}
        </aside>

        <main className="dashboard-main">{renderWorkspaceMain()}</main>
      </div>
    </div>
  );
}
