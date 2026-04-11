import { INDUSTRIES, TOOL_CHIPS } from '../constants.js';
import OnboardingChatShell from '../OnboardingChatShell.jsx';

function toggleTool(tools, id) {
  if (tools.includes(id)) {
    return tools.filter((t) => t !== id);
  }
  return [...tools, id];
}

export default function BusinessStep({ state, setState, error, onContinue, continuing }) {
  return (
    <OnboardingChatShell
      assistantHeadline="Tell me about your business."
      assistantBody={
        <p>
          I’ll tune recommendations and which connections to suggest first. Pick an industry — then add tools if you want (totally optional).
        </p>
      }
      userPanelTitle="Your reply"
      error={error}
      errorId="business-error"
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
      <div className="onboarding-chat-prompt">What’s your business called?</div>
      <div className="onboarding-field onboarding-field--chat">
        <label htmlFor="businessName" className="visually-hidden">
          Business name
        </label>
        <input
          id="businessName"
          type="text"
          autoComplete="organization"
          placeholder="Business name…"
          value={state.businessName}
          onChange={(e) => setState((s) => ({ ...s, businessName: e.target.value }))}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'business-error' : undefined}
        />
      </div>

      <div className="onboarding-chat-prompt">Which industry fits best?</div>
      <div className="onboarding-chip-grid onboarding-chip-grid--chat onboarding-chip-grid--dense" role="group" aria-label="Industry">
        {INDUSTRIES.map((ind) => (
          <button
            key={ind.id}
            type="button"
            className={`onboarding-chip ${state.industry === ind.id ? 'active' : ''}`}
            onClick={() => setState((s) => ({ ...s, industry: ind.id }))}
          >
            {ind.label}
          </button>
        ))}
      </div>

      <div className="onboarding-chat-prompt">
        Tools you already use <span className="onboarding-chat-optional">(tap any — optional)</span>
      </div>
      <p className="onboarding-hint onboarding-hint--chat">This helps me order “connect” options in the next step.</p>
      <div className="onboarding-chip-grid onboarding-chip-grid--chat onboarding-chip-grid--dense" role="group" aria-label="Tools">
        {TOOL_CHIPS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`onboarding-chip ${state.tools.includes(t.id) ? 'active' : ''}`}
            onClick={() => setState((s) => ({ ...s, tools: toggleTool(s.tools, t.id) }))}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="onboarding-chat-prompt">
        Website <span className="onboarding-chat-optional">(optional)</span>
      </div>
      <div className="onboarding-field onboarding-field--chat">
        <label htmlFor="website" className="visually-hidden">
          Website URL
        </label>
        <input
          id="website"
          type="url"
          inputMode="url"
          placeholder="https://…"
          value={state.website}
          onChange={(e) => setState((s) => ({ ...s, website: e.target.value }))}
        />
      </div>
    </OnboardingChatShell>
  );
}
