import { STEP_COUNT, STEP_LABELS } from './constants.js';

export default function OnboardingProgress({ stepIndex }) {
  const current = Math.min(stepIndex + 1, STEP_COUNT);

  return (
    <div className="onboarding-progress" aria-label="Onboarding progress">
      <div className="onboarding-progress-meta">
        <span className="onboarding-progress-step">
          Step {current} of {STEP_COUNT}
        </span>
        <span className="onboarding-progress-label">{STEP_LABELS[stepIndex] ?? ''}</span>
      </div>
      <div className="onboarding-progress-track" role="progressbar" aria-valuenow={current} aria-valuemin={1} aria-valuemax={STEP_COUNT}>
        <div className="onboarding-progress-fill" style={{ width: `${(current / STEP_COUNT) * 100}%` }} />
      </div>
    </div>
  );
}
