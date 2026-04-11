export default function ResumeBanner({ onResume, onStartOver }) {
  return (
    <div className="onboarding-resume" role="status">
      <div className="onboarding-resume-copy">
        <strong>Welcome back</strong>
        <span>You were setting up your workspace. Pick up where you left off?</span>
      </div>
      <div className="onboarding-resume-actions">
        <button type="button" className="onboarding-btn onboarding-btn--primary" onClick={onResume}>
          Resume
        </button>
        <button type="button" className="onboarding-btn onboarding-btn--ghost" onClick={onStartOver}>
          Start over
        </button>
      </div>
    </div>
  );
}
