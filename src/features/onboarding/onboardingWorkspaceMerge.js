import { normalizeWorkspaceSetup } from '../../data/setupData.js';
import { ROLE_OPTIONS } from './onboardingMvpConstants.js';

const WORKSPACE_KEY = 'onevo_workspace_setup_v1';

function roleLabel(roleId) {
  if (!roleId) return '';
  return ROLE_OPTIONS.find((r) => r.id === roleId)?.label ?? '';
}

/**
 * Maps MVP onboarding draft into workspace payload shape (localStorage).
 * Keeps fields aligned with `normalizeWorkspaceSetup` for dashboard consumption.
 * `growthData.approvalOwner` stores "Full name · Role" for dashboard display until a real user profile API exists.
 */
export function buildWorkspacePayloadFromOnboarding(state) {
  const primaryGoal = state.goalIds?.[0]
    ? GOAL_LABEL(state.goalIds[0])
    : '';
  const successMetric = state.goalIds?.[1]
    ? GOAL_LABEL(state.goalIds[1])
    : primaryGoal;

  const name = state.fullName?.trim() || '';
  const role = roleLabel(state.role);
  const approvalOwner = [name, role].filter(Boolean).join(' · ');

  const notes = state.dataManualNotes?.trim();
  const basePromise = state.shortDescription?.trim() || '';
  return {
    brandData: {
      brandInputMode: state.learningMethod === 'website' ? 'website' : 'manual',
      websiteUrl: state.websiteUrl?.trim() || '',
      brandExtractStatus: 'idle',
      businessName: state.businessName?.trim() || '',
      industry: state.businessType?.trim() || '',
      serviceArea: state.location?.trim() || '',
      audience: state.targetCustomers?.trim() || '',
      brandPromise: notes ? `${basePromise}${basePromise ? '\n\n' : ''}Data notes: ${notes}` : basePromise,
      offerings: state.productsOrServices?.trim()
        ? state.productsOrServices.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
    },
    growthData: {
      primaryGoal,
      successMetric,
      monthlyTarget: '',
      responseWindow: '',
      approvalOwner,
      trackedOutcomes: state.brandTone?.trim() ? [`Brand tone: ${state.brandTone.trim()}`] : [],
      connectGoogleBusiness: Boolean(state.trackGoogleBusiness),
      connectPos: Boolean(state.trackPos),
      connectBooking: Boolean(state.trackBooking),
      fallbackExcelName: state.dataExcelName || '',
      fallbackCsvName: state.dataCsvName || '',
      fallbackImageName: state.dataPhotoName || '',
    },
    connectionData: {
      facebook: Boolean(state.socialFacebook),
      instagram: Boolean(state.socialInstagram),
      linkedin: Boolean(state.socialLinkedin),
    },
    stepStates: ['completed', 'completed', 'completed'],
  };
}

function GOAL_LABEL(id) {
  const map = {
    customers: 'Get more customers',
    bookings: 'Increase bookings',
    social: 'Improve social presence',
    consistent: 'Post consistently',
    local: 'Grow local visibility',
    engagement: 'Get more engagement',
  };
  return map[id] || id;
}

export function persistWorkspaceFromOnboarding(state) {
  const raw = buildWorkspacePayloadFromOnboarding(state);
  const normalized = normalizeWorkspaceSetup(raw);
  try {
    window.localStorage.setItem(WORKSPACE_KEY, JSON.stringify({
      brandData: normalized.brandData,
      growthData: normalized.growthData,
      connectionData: normalized.connectionData,
      stepStates: normalized.stepStates,
    }));
  } catch {
    /* quota */
  }
}
