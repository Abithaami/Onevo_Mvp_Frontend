import { HEARD_ABOUT, ROLES } from '../constants.js';
import OnboardingChatShell from '../OnboardingChatShell.jsx';

export default function WelcomeStep({ state, setState, error, onContinue, continuing }) {
  const name = state.preferredName.trim();
  const greeting = name ? `Nice to meet you, ${name}.` : null;

  return (
    <OnboardingChatShell
      assistantHeadline="Let’s start with something simple."
      assistantBody={
        <>
          <p>I’ll ask a few quick questions — more like a chat than a form. You can skip anything optional.</p>
          {greeting ? <p className="onboarding-chat-greeting">{greeting}</p> : null}
        </>
      }
      userPanelTitle="Your reply"
      error={error}
      errorId="welcome-error"
      footer={
        <button
          type="button"
          className="onboarding-btn onboarding-btn--primary onboarding-btn--send"
          disabled={continuing}
          onClick={onContinue}
        >
          {continuing ? (
            'Sending…'
          ) : (
            <>
              Send reply <span aria-hidden="true">→</span>
            </>
          )}
        </button>
      }
    >
      <div className="onboarding-chat-prompt">What should I call you?</div>
      <div className="onboarding-field onboarding-field--chat">
        <label htmlFor="preferredName" className="visually-hidden">
          Preferred name
        </label>
        <input
          id="preferredName"
          type="text"
          autoComplete="given-name"
          placeholder="Type your first name…"
          value={state.preferredName}
          onChange={(e) => setState((s) => ({ ...s, preferredName: e.target.value }))}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'welcome-error' : undefined}
        />
      </div>

      <div className="onboarding-chat-prompt">Your role <span className="onboarding-chat-optional">(optional)</span></div>
      <div className="onboarding-chip-grid onboarding-chip-grid--chat" role="group" aria-label="Role">
        {ROLES.map((r) => (
          <button
            key={r.id}
            type="button"
            className={`onboarding-chip ${state.role === r.id ? 'active' : ''}`}
            onClick={() => setState((s) => ({ ...s, role: s.role === r.id ? '' : r.id }))}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="onboarding-chat-prompt">How did you hear about us? <span className="onboarding-chat-optional">(optional)</span></div>
      <div className="onboarding-chip-grid onboarding-chip-grid--chat" role="group" aria-label="Source">
        {HEARD_ABOUT.map((h) => (
          <button
            key={h.id}
            type="button"
            className={`onboarding-chip ${state.heardAbout === h.id ? 'active' : ''}`}
            onClick={() => setState((s) => ({ ...s, heardAbout: s.heardAbout === h.id ? '' : h.id }))}
          >
            {h.label}
          </button>
        ))}
      </div>
    </OnboardingChatShell>
  );
}
