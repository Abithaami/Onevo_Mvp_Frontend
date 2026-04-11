/**
 * Onboarding phase 4 — “Connect Tools” (spec: optional, preview-first path).
 * Reorders integrations with `sortIntegrationsByTools` from Business step tool chips.
 * State: `connectingIntegrationId`, `connectedIntegrationId`, `integrationSkipped`, `integrationConnectPhase`.
 * Connect is mocked (timeout); replace `handleConnect` with OAuth/API when backend is ready.
 */
import { Link } from 'react-router-dom';
import { INTEGRATIONS, sortIntegrationsByTools } from '../constants.js';
import OnboardingChatShell from '../OnboardingChatShell.jsx';

export default function IntegrationStep({ state, setState, onContinue, continuing }) {
  const ordered = sortIntegrationsByTools(INTEGRATIONS, state.tools);
  const recommendedId = ordered[0]?.id;
  const { connectedIntegrationId, connectingIntegrationId } = state;
  const connectingId = connectingIntegrationId;

  function handleConnect(id) {
    setState((s) => ({
      ...s,
      integrationSkipped: false,
      connectingIntegrationId: id,
      integrationConnectPhase: 'connecting',
      connectedIntegrationId: null
    }));
    window.setTimeout(() => {
      setState((s) => ({
        ...s,
        connectingIntegrationId: null,
        integrationConnectPhase: 'success',
        connectedIntegrationId: id
      }));
    }, 900);
  }

  function handleSkip() {
    setState((s) => ({
      ...s,
      integrationSkipped: true,
      connectedIntegrationId: null,
      connectingIntegrationId: null,
      integrationConnectPhase: 'idle'
    }));
    onContinue();
  }

  function handleRetry() {
    setState((s) => ({
      ...s,
      integrationConnectPhase: 'idle',
      connectedIntegrationId: null,
      connectingIntegrationId: null
    }));
  }

  const showSuccess = state.integrationConnectPhase === 'success' && connectedIntegrationId;
  const isConnecting = Boolean(connectingId);

  return (
    <OnboardingChatShell
      assistantHeadline="Want to connect a tool?"
      assistantBody={
        <>
          <p>
            This step is optional. Connecting helps Onevo use live signals sooner. If you skip, you’ll still get a meaningful preview — and you can connect anytime from{' '}
            <Link to="/app/integrations" className="onboarding-inline-link">
              Integrations
            </Link>
            .
          </p>
        </>
      }
      userPanelTitle="Your choice"
      footer={
        <div className="onboarding-chat-composer-inner">
          <button
            type="button"
            className="onboarding-btn onboarding-btn--ghost"
            disabled={isConnecting || continuing}
            onClick={handleSkip}
          >
            Skip for now — show preview
          </button>
          <button
            type="button"
            className="onboarding-btn onboarding-btn--primary onboarding-btn--send"
            disabled={!showSuccess || continuing}
            onClick={onContinue}
          >
            {continuing ? (
              'Next…'
            ) : (
              <>
                Continue <span aria-hidden="true">→</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <div
        className="onboarding-integration-grid onboarding-integration-grid--chat"
        aria-busy={isConnecting}
      >
        {ordered.map((item) => {
          const isRecommended = item.id === recommendedId;
          const isThisConnecting = connectingId === item.id;
          const isConnected = connectedIntegrationId === item.id && showSuccess;
          return (
            <div key={item.id} className={`onboarding-integration-card ${isRecommended ? 'recommended' : ''}`}>
              {isRecommended ? <span className="onboarding-badge">Suggested first</span> : null}
              <h3 className="onboarding-integration-title">{item.label}</h3>
              <p className="onboarding-integration-desc">{item.description}</p>
              <button
                type="button"
                className="onboarding-btn onboarding-btn--secondary"
                disabled={isConnecting || continuing}
                aria-label={isThisConnecting ? `Connecting ${item.label}` : `Connect ${item.label} (simulated)`}
                onClick={() => handleConnect(item.id)}
              >
                {isThisConnecting ? 'Connecting…' : `Connect ${item.label}`}
              </button>
              {isConnected ? (
                <p className="onboarding-success" role="status">
                  Connected — tap Continue when you’re ready.
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      {state.integrationConnectPhase === 'error' ? (
        <div className="onboarding-error-block" role="alert">
          <p>We couldn’t finish that connection. Check your account and try again.</p>
          <button type="button" className="onboarding-btn onboarding-btn--ghost" onClick={handleRetry}>
            Retry
          </button>
        </div>
      ) : null}
    </OnboardingChatShell>
  );
}
