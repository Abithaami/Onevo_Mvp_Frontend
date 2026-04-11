import { GOAL_OPTIONS, MAX_GOALS } from '../constants.js';
import OnboardingChatShell from '../OnboardingChatShell.jsx';

function toggleGoal(goalIds, id) {
  if (goalIds.includes(id)) {
    return goalIds.filter((g) => g !== id);
  }
  if (goalIds.length >= MAX_GOALS) {
    return goalIds;
  }
  return [...goalIds, id];
}

export default function GoalsStep({ state, setState, error, onContinue, continuing }) {
  return (
    <OnboardingChatShell
      assistantHeadline="What should we focus on first?"
      assistantBody={
        <p>
          Choose up to {MAX_GOALS} goals. I’ll use this to order your dashboard and your first recommendations — so pick what matters most right now.
        </p>
      }
      userPanelTitle="Your choices"
      error={error}
      errorId="goals-error"
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
      <div className="onboarding-goal-grid onboarding-goal-grid--chat" role="group" aria-label="Goals">
        {GOAL_OPTIONS.map((g) => {
          const selected = state.goalIds.includes(g.id);
          const atLimit = state.goalIds.length >= MAX_GOALS && !selected;
          return (
            <button
              key={g.id}
              type="button"
              disabled={atLimit}
              className={`onboarding-goal-card ${selected ? 'active' : ''}`}
              onClick={() => setState((s) => ({ ...s, goalIds: toggleGoal(s.goalIds, g.id) }))}
            >
              <span className="onboarding-goal-title">{g.title}</span>
              <span className="onboarding-goal-desc">{g.description}</span>
            </button>
          );
        })}
      </div>

      <p className="onboarding-hint onboarding-hint--chat" aria-live="polite">
        {state.goalIds.length === 0
          ? 'Tap at least one goal to continue.'
          : state.goalIds.length >= MAX_GOALS
            ? 'Two goals selected — that’s the max.'
            : `${state.goalIds.length} of ${MAX_GOALS} selected.`}
      </p>
    </OnboardingChatShell>
  );
}
