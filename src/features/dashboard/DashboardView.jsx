import { useState } from 'react';
import AttentionZone from './zones/AttentionZone.jsx';
import AiWorkbenchZone from './zones/AiWorkbenchZone.jsx';
import BusinessSnapshotZone from './zones/BusinessSnapshotZone.jsx';
import RecentActivityZone from './zones/RecentActivityZone.jsx';
import SecondaryExplorationZone from './zones/SecondaryExplorationZone.jsx';
import DashboardSkeleton from './components/DashboardSkeleton.jsx';
import HandoffBanner from './components/HandoffBanner.jsx';
import { useDashboardScreen } from './hooks/useDashboardScreen.js';
import { dismissDashboardHandoff } from './handoffSession.js';
import './dashboard.css';

export default function DashboardView() {
  const { loading, error, model, retry } = useDashboardScreen();
  const [handoffDismissed, setHandoffDismissed] = useState(false);

  function onRecommendationAction(id, action) {
    void id;
    void action;
    // TODO: call approval / orchestration API
  }

  function dismissHandoff() {
    dismissDashboardHandoff();
    setHandoffDismissed(true);
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !model) {
    return (
      <div className="db-page">
        <div className="db-error-panel" role="alert">
          <p className="db-error-title">Something went wrong</p>
          <p className="db-error-body">We couldn’t load your dashboard. Check your connection and try again.</p>
          <button type="button" className="db-error-retry" onClick={retry}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="db-page">
      <header className="db-page-header">
        <h1 className="db-page-title">Dashboard</h1>
        <p className="db-page-lead">Your decision surface — urgency first, then AI work, then context.</p>
      </header>

      {model.handoff && !handoffDismissed ? (
        <HandoffBanner title={model.handoff.title} body={model.handoff.body} onDismiss={dismissHandoff} />
      ) : null}

      <AttentionZone coach={model.attention.coach} alerts={model.attention.alerts} />
      <AiWorkbenchZone items={model.recommendations} onRecommendationAction={onRecommendationAction} />
      <BusinessSnapshotZone kpis={model.kpis} />
      <RecentActivityZone items={model.activities} />
      <SecondaryExplorationZone links={model.quickLinks} />
    </div>
  );
}
