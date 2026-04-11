const STORAGE_KEY = 'onevo_onboarding_v1';

export function createInitialState() {
  return {
    stepIndex: 0,
    preferredName: '',
    role: '',
    heardAbout: '',
    businessName: '',
    industry: '',
    tools: [],
    website: '',
    goalIds: [],
    integrationSkipped: false,
    connectedIntegrationId: null,
    connectingIntegrationId: null,
    integrationConnectPhase: 'idle'
  };
}

export function loadOnboardingState() {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return null;
    }
    return { ...createInitialState(), ...parsed };
  } catch {
    return null;
  }
}

export function saveOnboardingState(state) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota / private mode
  }
}

export function clearOnboardingState() {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
