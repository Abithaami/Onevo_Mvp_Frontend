import { useEffect, useMemo, useState } from 'react';
import ToastAlert from '../../components/auth/ToastAlert.jsx';
import RejectDraftModal from '../../components/workbench/RejectDraftModal.jsx';
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
  const [dismissedRecIds, setDismissedRecIds] = useState(() => new Set());
  const [toast, setToast] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }
    const t = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [toast]);

  function showToast(message, type = 'info') {
    setToast({ message, type });
  }

  const workbenchItems = useMemo(() => {
    if (!model?.recommendations?.length) {
      return [];
    }
    return model.recommendations.filter((r) => !dismissedRecIds.has(r.id));
  }, [model, dismissedRecIds]);

  function dismissRecommendation(id) {
    setDismissedRecIds((prev) => new Set([...prev, id]));
  }

  function onRecommendationAction(id, action) {
    const item = model?.recommendations?.find((r) => r.id === id);
    const title = item?.title ?? 'This item';

    if (action === 'reject') {
      setRejectTarget({ id, title });
      return;
    }

    if (action === 'approve') {
      dismissRecommendation(id);
      showToast(`Approved — ${title}`, 'success');
      return;
    }

    if (action === 'later') {
      dismissRecommendation(id);
      showToast(`Saved for later — ${title}`, 'info');
      return;
    }

    if (action === 'edit') {
      showToast('Use Content Studio in the dashboard to create and edit LinkedIn drafts.', 'info');
      return;
    }

    if (action === 'details') {
      showToast('Open Content Studio or Approval to work LinkedIn drafts.', 'info');
    }
  }

  function confirmReject() {
    if (!rejectTarget) {
      return;
    }
    dismissRecommendation(rejectTarget.id);
    showToast(`Rejected — ${rejectTarget.title}`, 'error');
    setRejectTarget(null);
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
      <AiWorkbenchZone
        items={workbenchItems}
        onRecommendationAction={onRecommendationAction}
        workbenchCleared={(model.recommendations?.length ?? 0) > 0 && workbenchItems.length === 0}
      />
      <BusinessSnapshotZone kpis={model.kpis} />
      <RecentActivityZone items={model.activities} />
      <SecondaryExplorationZone links={model.quickLinks} />

      <RejectDraftModal
        open={!!rejectTarget}
        title={rejectTarget?.title ?? ''}
        onCancel={() => setRejectTarget(null)}
        onConfirm={confirmReject}
      />
      <ToastAlert toast={toast} />
    </div>
  );
}
