import { socialMediaSources } from '../../data/onevoData';
import {
  buildOverviewHeroLede,
  formatBusinessSystemsIntent,
  formatLinkedInOnboardingLine,
  formatManualFileHints,
  formatSocialSelectionsSummary,
  formatWebsiteSourceLine,
} from '../../features/dashboard/dashboardOverviewModel.js';
import CalendarPage from './sections/CalendarPage';
import ContentStudioPage from './sections/ContentStudioPage.jsx';
import NotificationsSection from './sections/NotificationsSection.jsx';
import OrchestratorSection from './sections/OrchestratorSection.jsx';
import PublishedPostsPage from './sections/PublishedPostsPage.jsx';
import SignalsSection from './sections/SignalsSection.jsx';
import { BrandDnaEditPanel, DataDrivenEditPanel, SocialAccountsEditPanel } from './sections/edit-panels';

function truncateText(text, max) {
  const t = text?.trim() || '';
  if (!t) return '—';
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

/**
 * Main column only: workspace views driven by `activeNav` (from URL section on `/app/dashboard/:section`).
 */
export default function DashboardWorkspaceContent({ setup, onSetupChange, onOpenConnections, activeNav }) {
  const businessLabel = setup.brandData.businessName?.trim() || 'Your workspace';
  const industry = setup.brandData.industry?.trim() || '—';
  const goal = setup.growthData.primaryGoal?.trim() || '—';
  const metric = setup.growthData.successMetric?.trim() || '—';
  const contactLine = setup.growthData.approvalOwner?.trim() || '—';
  const profileSummary = truncateText(setup.brandData.brandPromise, 280);
  const websiteSourceLine = formatWebsiteSourceLine(setup.brandData);
  const businessSystemsLine = formatBusinessSystemsIntent(setup.growthData);
  const manualFilesLine = formatManualFileHints(setup.growthData);
  const socialSelectionsLine = formatSocialSelectionsSummary(setup.connectionData);
  const linkedInLine = formatLinkedInOnboardingLine(setup.connectionData);
  const heroLede = buildOverviewHeroLede(goal, businessLabel);
  const connectionCount = socialMediaSources.filter((source) => setup.connectionData[source.id]).length;
  const completedSteps = setup.stepStates?.filter((s) => s === 'completed').length ?? 0;
  const setupPercent = Math.round((completedSteps / 3) * 100);

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
  if (activeNav === 'content-studio') {
    return <ContentStudioPage onOpenConnections={onOpenConnections} />;
  }
  if (activeNav === 'published-posts') {
    return <PublishedPostsPage />;
  }
  if (activeNav === 'notifications') {
    return <NotificationsSection />;
  }
  if (activeNav === 'orchestrator') {
    return <OrchestratorSection />;
  }
  if (activeNav === 'signals') {
    return <SignalsSection />;
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
            <p className="dashboard-hero__lede">{heroLede}</p>
            <div className="dashboard-hero__chips">
              <span className="dashboard-chip dashboard-chip--teal">
                {industry !== '—' ? industry : 'Business context'}
              </span>
              <span className="dashboard-chip dashboard-chip--blue">{goal !== '—' ? goal : 'Growth focus'}</span>
              <span className="dashboard-chip dashboard-chip--slate">
                {connectionCount > 0 ? `${connectionCount} social · setup` : 'Onboarding snapshot'}
              </span>
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
                {completedSteps} of 3 setup blocks saved · {connectionCount} social channel
                {connectionCount === 1 ? '' : 's'} flagged in onboarding
              </p>
            </div>
          </div>
        </section>

        <section className="dashboard-onboarding-recap" aria-labelledby="dashboard-onboarding-recap-title">
          <h2 id="dashboard-onboarding-recap-title" className="dashboard-onboarding-recap__title">
            Your setup snapshot
          </h2>
          <p className="dashboard-onboarding-recap__lede">
            Pulled from your saved workspace snapshot (onboarding + any edits here). Brand DNA, Growth, and Connections
            stay the source of truth.
          </p>
          <dl className="dashboard-onboarding-recap__list">
            <div className="dashboard-onboarding-recap__row">
              <dt>Primary contact</dt>
              <dd>{contactLine}</dd>
            </div>
            <div className="dashboard-onboarding-recap__row">
              <dt>Brand / website source</dt>
              <dd>{websiteSourceLine}</dd>
            </div>
            <div className="dashboard-onboarding-recap__row">
              <dt>Goals</dt>
              <dd>
                {goal !== '—' ? goal : '—'}
                {metric !== '—' && metric !== goal ? ` · ${metric}` : ''}
              </dd>
            </div>
            <div className="dashboard-onboarding-recap__row">
              <dt>Business profile</dt>
              <dd>{profileSummary}</dd>
            </div>
            <div className="dashboard-onboarding-recap__row">
              <dt>Business data (systems)</dt>
              <dd>{businessSystemsLine}</dd>
            </div>
            <div className="dashboard-onboarding-recap__row">
              <dt>Manual file names</dt>
              <dd>{manualFilesLine}</dd>
            </div>
            <div className="dashboard-onboarding-recap__row">
              <dt>Social selections</dt>
              <dd>{socialSelectionsLine}</dd>
            </div>
            <div className="dashboard-onboarding-recap__row">
              <dt>LinkedIn</dt>
              <dd>{linkedInLine}</dd>
            </div>
          </dl>
        </section>

        <section className="dashboard-kpis" aria-label="Key metrics">
          <article className="dashboard-kpi">
            <span className="dashboard-kpi__label">Setup</span>
            <strong className="dashboard-kpi__value">{setupPercent}%</strong>
            <span className="dashboard-kpi__hint">Onboarding coverage</span>
          </article>
          <article className="dashboard-kpi">
            <span className="dashboard-kpi__label">Social (onboarding)</span>
            <strong className="dashboard-kpi__value">{connectionCount}</strong>
            <span className="dashboard-kpi__hint">Channels flagged in setup</span>
          </article>
          <article className="dashboard-kpi">
            <span className="dashboard-kpi__label">AI drafts</span>
            <strong className="dashboard-kpi__value dashboard-kpi__value--muted">—</strong>
            <span className="dashboard-kpi__hint">None until generation is enabled</span>
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
            <p>Ground truth from your workspace snapshot—no live performance metrics in MVP.</p>
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
                    <strong>Review AI drafts when available</strong>
                    <span className="dashboard-queue__tag">Next</span>
                  </div>
                  <p>
                    Approval-style drafts are not generated in this MVP. When your workspace is connected to the AI
                    pipeline, they will surface here for review.
                  </p>
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
                    <strong>Refine setup or integrations</strong>
                    <span className="dashboard-queue__tag dashboard-queue__tag--muted">Optional</span>
                  </div>
                  <p>
                    Use Brand DNA, Growth, or Integrations to align ONEVO with your business—everything above reflects
                    what you have already saved.
                  </p>
                </div>
              </li>
            </ul>
          </section>

          <aside className="dashboard-rail" aria-label="Readiness">
            <div className="dashboard-rail__card">
              <h3 className="dashboard-rail__title">Setup coverage</h3>
              <div className="dashboard-rail__meter">
                <div className="dashboard-rail__meter-fill" style={{ width: `${setupPercent}%` }} />
              </div>
              <p className="dashboard-rail__stat">
                <strong>{setupPercent}%</strong> onboarding blocks marked complete
              </p>
              <p className="dashboard-rail__note">
                Social: <strong>{connectionCount}</strong> of {socialMediaSources.length} selected in onboarding. LinkedIn
                can be live-connected from Integrations; other channels here are intent-only until they ship.
              </p>
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
