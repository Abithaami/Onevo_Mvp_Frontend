import OnboardingFlow from '../features/onboarding/OnboardingFlow.jsx';

/** Route guards live in `WorkspaceLayout`; this route only renders the flow for incomplete users. */
export default function OnboardingPage() {
  return <OnboardingFlow />;
}
