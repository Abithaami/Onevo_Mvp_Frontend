import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGoalById, getIndustryLabel, getIntegrationById } from '../constants.js';
import { markDashboardHandoffPendingFromOnboarding } from '../../dashboard/handoffSession.js';
import { clearOnboardingState } from '../onboardingStorage.js';
import OnboardingChatShell from '../OnboardingChatShell.jsx';

export default function ActivationStep({ state, onEditStep }) {
  const navigate = useNavigate();
  const [previewLoading, setPreviewLoading] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => setPreviewLoading(false), 650);
    return () => window.clearTimeout(t);
  }, []);

  const primaryGoals = state.goalIds.map((id) => getGoalById(id)?.title).filter(Boolean);

  function handleGoToDashboard() {
    markDashboardHandoffPendingFromOnboarding();
    clearOnboardingState();
    navigate('/app/dashboard');
  }

  return (
    <OnboardingChatShell
      className="onboarding-step--activation-chat"
      assistantHeadline="Here’s what I’m setting up for you."
      assistantBody={
        <p>
          This is your activation moment — a quick preview of how your workspace will feel. You’re always in control of what gets published or sent.
        </p>
      }
      userPanelTitle="Preview & recap"
      footer={
        <div className="onboarding-chat-composer-inner onboarding-chat-composer-inner--stack">
          <button
            type="button"
            className="onboarding-btn onboarding-btn--primary onboarding-btn--send"
            disabled={previewLoading}
            onClick={handleGoToDashboard}
          >
            Go to my dashboard <span aria-hidden="true">→</span>
          </button>
          <button type="button" className="onboarding-btn onboarding-btn--ghost" disabled={previewLoading} onClick={() => onEditStep(3)}>
            Back to connections
          </button>
        </div>
      }
    >
      <div className="onboarding-preview-card" aria-busy={previewLoading}>
        {previewLoading ? (
          <div className="onboarding-preview-skeleton">
            <div className="onboarding-skeleton-line wide" />
            <div className="onboarding-skeleton-line" />
            <div className="onboarding-skeleton-line narrow" />
          </div>
        ) : (
          <>
            <h3 className="onboarding-preview-title">Your first dashboard focus</h3>
            <ul className="onboarding-preview-list">
              <li>
                <strong>Action</strong>
                <span>
                  {primaryGoals[0] ? `Start with: ${primaryGoals[0]}` : 'Review your first recommendation'}
                </span>
              </li>
              <li>
                <strong>Insight</strong>
                <span>
                  Tailored for {state.businessName.trim() || 'your business'} in {getIndustryLabel(state.industry)}.
                </span>
              </li>
              <li>
                <strong>Next</strong>
                <span>
                  {state.integrationSkipped || !state.connectedIntegrationId
                    ? 'Connect a channel anytime to unlock live signals.'
                    : `${getIntegrationById(state.connectedIntegrationId)?.label ?? 'Connected'} — we’ll pull fresh signals as you go.`}
                </span>
              </li>
            </ul>
          </>
        )}
      </div>

      <div className="onboarding-activation-summary onboarding-activation-summary--chat">
        <h3 className="onboarding-inline-title">Something off?</h3>
        <p className="onboarding-inline-text">
          <button type="button" className="onboarding-link" onClick={() => onEditStep(0)}>
            Name
          </button>
          {' · '}
          <button type="button" className="onboarding-link" onClick={() => onEditStep(1)}>
            Business
          </button>
          {' · '}
          <button type="button" className="onboarding-link" onClick={() => onEditStep(2)}>
            Goals
          </button>
          {' · '}
          <button type="button" className="onboarding-link" onClick={() => onEditStep(3)}>
            Integrations
          </button>
        </p>
      </div>
    </OnboardingChatShell>
  );
}
