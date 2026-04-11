import { useEffect, useState } from 'react';
import OnboardingProgress from './OnboardingProgress.jsx';
import ResumeBanner from './ResumeBanner.jsx';
import SummaryPanel from './SummaryPanel.jsx';
import WelcomeStep from './steps/WelcomeStep.jsx';
import BusinessStep from './steps/BusinessStep.jsx';
import GoalsStep from './steps/GoalsStep.jsx';
import IntegrationStep from './steps/IntegrationStep.jsx';
import ActivationStep from './steps/ActivationStep.jsx';
import { createInitialState, loadOnboardingState, saveOnboardingState, clearOnboardingState } from './onboardingStorage.js';
import './onboarding.css';

function shouldPromptResume(saved) {
  if (!saved) {
    return false;
  }
  if (saved.stepIndex > 0) {
    return true;
  }
  return Boolean(saved.preferredName?.trim() || saved.businessName?.trim() || saved.goalIds?.length);
}

function validateStep(stepIndex, state) {
  switch (stepIndex) {
    case 0:
      if (!state.preferredName.trim()) {
        return 'Please enter your name.';
      }
      return '';
    case 1:
      if (!state.businessName.trim()) {
        return 'Please enter your business name.';
      }
      if (!state.industry) {
        return 'Please select an industry.';
      }
      return '';
    case 2:
      if (state.goalIds.length === 0) {
        return 'Select at least one goal.';
      }
      return '';
    default:
      return '';
  }
}

export default function OnboardingFlow() {
  const [state, setState] = useState(createInitialState);
  const [hydrated, setHydrated] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const [stepError, setStepError] = useState('');
  const [continuing, setContinuing] = useState(false);

  useEffect(() => {
    const saved = loadOnboardingState();
    if (saved) {
      setState(saved);
      if (shouldPromptResume(saved)) {
        setShowResume(true);
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    saveOnboardingState(state);
  }, [state, hydrated]);

  function handleStartOver() {
    clearOnboardingState();
    setState(createInitialState());
    setShowResume(false);
    setStepError('');
  }

  function goNext() {
    setStepError('');
    setState((s) => ({ ...s, stepIndex: Math.min(s.stepIndex + 1, 4) }));
  }

  function handleContinue() {
    const err = validateStep(state.stepIndex, state);
    if (err) {
      setStepError(err);
      return;
    }
    setContinuing(true);
    window.setTimeout(() => {
      setContinuing(false);
      goNext();
    }, 380);
  }

  function handleContinueFromIntegration() {
    setContinuing(true);
    window.setTimeout(() => {
      setContinuing(false);
      goNext();
    }, 200);
  }

  function onEditStep(stepIndex) {
    setStepError('');
    setState((s) => ({ ...s, stepIndex }));
  }

  const stepProps = {
    state,
    setState,
    error: stepError,
    onContinue: handleContinue,
    continuing
  };

  let main = null;
  switch (state.stepIndex) {
    case 0:
      main = <WelcomeStep {...stepProps} />;
      break;
    case 1:
      main = <BusinessStep {...stepProps} />;
      break;
    case 2:
      main = <GoalsStep {...stepProps} />;
      break;
    case 3:
      main = (
        <IntegrationStep
          state={state}
          setState={setState}
          onContinue={handleContinueFromIntegration}
          continuing={continuing}
        />
      );
      break;
    case 4:
      main = <ActivationStep state={state} onEditStep={onEditStep} />;
      break;
    default:
      main = null;
  }

  if (!hydrated) {
    return <div className="onboarding onboarding--loading" aria-busy="true" />;
  }

  return (
    <div className="onboarding">
      {showResume ? (
        <ResumeBanner
          onResume={() => setShowResume(false)}
          onStartOver={handleStartOver}
        />
      ) : null}

      <OnboardingProgress stepIndex={state.stepIndex} />

      <details className="onboarding-mobile-summary">
        <summary className="onboarding-mobile-summary-trigger">Setup summary</summary>
        <SummaryPanel state={state} onEditStep={onEditStep} compact />
      </details>

      <div className="onboarding-layout">
        <div className="onboarding-main">{main}</div>
        <div className="onboarding-aside">
          <SummaryPanel state={state} onEditStep={onEditStep} />
        </div>
      </div>
    </div>
  );
}
