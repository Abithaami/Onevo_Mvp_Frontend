import { growthIntegrationSources, socialMediaSources } from './onevoData';

export function emptyConnectionData() {
  return socialMediaSources.reduce((accumulator, source) => ({ ...accumulator, [source.id]: false }), {});
}

export function emptyBrandData() {
  return {
    brandInputMode: 'manual',
    websiteUrl: '',
    brandExtractStatus: 'idle',
    businessName: '',
    industry: '',
    serviceArea: '',
    audience: '',
    brandPromise: '',
    offerings: [],
  };
}

export function emptyGrowthData() {
  return {
    primaryGoal: '',
    successMetric: '',
    monthlyTarget: '',
    responseWindow: '',
    approvalOwner: '',
    trackedOutcomes: [],
    connectGoogleBusiness: false,
    connectPos: false,
    connectBooking: false,
    fallbackExcelName: '',
    fallbackCsvName: '',
    fallbackImageName: '',
  };
}

function integrationKeyToGrowthField(id) {
  if (id === 'google-business') return 'connectGoogleBusiness';
  if (id === 'pos') return 'connectPos';
  if (id === 'booking') return 'connectBooking';
  return null;
}

/** Full payload from onboarding completion */
export function normalizeWorkspaceSetup(payload) {
  if (!payload) {
    return {
      brandData: emptyBrandData(),
      growthData: emptyGrowthData(),
      connectionData: emptyConnectionData(),
      stepStates: ['pending', 'pending', 'pending'],
    };
  }

  const mergedGrowth = { ...emptyGrowthData(), ...payload.growthData };
  const oldConn = payload.connectionData || {};

  growthIntegrationSources.forEach((source) => {
    const field = integrationKeyToGrowthField(source.id);
    if (!field) return;
    if (mergedGrowth[field] === false && oldConn[source.id]) {
      mergedGrowth[field] = true;
    }
  });

  const mergedConnection = { ...emptyConnectionData() };
  if (payload.connectionData) {
    socialMediaSources.forEach((s) => {
      if (payload.connectionData[s.id] !== undefined) {
        mergedConnection[s.id] = Boolean(payload.connectionData[s.id]);
      }
    });
  }

  return {
    brandData: { ...emptyBrandData(), ...payload.brandData },
    growthData: mergedGrowth,
    connectionData: mergedConnection,
    stepStates: payload.stepStates ?? ['pending', 'pending', 'pending'],
  };
}
