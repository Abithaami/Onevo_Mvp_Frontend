/** Shared helpers for onboarding + dashboard workspace state (brand, growth, connections). */

export function isLikelyWebsiteUrl(value) {
  const v = value.trim();
  if (!v) return false;
  try {
    const withProto = v.startsWith('http://') || v.startsWith('https://') ? v : `https://${v}`;
    const u = new URL(withProto);
    return Boolean(u.hostname?.includes('.'));
  } catch {
    return false;
  }
}

export function growthHasDataPath(growthData) {
  return Boolean(
    growthData.connectGoogleBusiness ||
      growthData.connectPos ||
      growthData.connectBooking ||
      growthData.fallbackExcelName?.trim() ||
      growthData.fallbackCsvName?.trim() ||
      growthData.fallbackImageName?.trim(),
  );
}

export function cloneBrandData(data) {
  return {
    ...data,
    offerings: [...(data.offerings ?? [])],
  };
}

export function cloneGrowthData(data) {
  return {
    ...data,
    trackedOutcomes: [...(data.trackedOutcomes ?? [])],
  };
}

export function cloneConnectionData(data) {
  return { ...data };
}

/** 0–1 ratio for brand step progress UI. */
export function getBrandStepCompletionRatio(brandData) {
  let filled = 0;
  if (brandData.businessName.trim()) filled += 1;
  if (brandData.industry.trim()) filled += 1;
  if (brandData.audience.trim()) filled += 1;
  if (brandData.brandPromise.trim()) filled += 1;
  if (brandData.offerings.length > 0) filled += 1;
  let ratio = filled / 5;
  if (
    brandData.brandInputMode === 'website' &&
    (brandData.brandExtractStatus !== 'done' || !isLikelyWebsiteUrl(brandData.websiteUrl))
  ) {
    ratio = Math.min(ratio, 0.82);
  }
  return ratio;
}

/** 0–1 ratio for growth step progress UI. */
export function getGrowthStepCompletionRatio(growthData) {
  let filled = 0;
  if (growthData.primaryGoal) filled += 1;
  if (growthData.successMetric) filled += 1;
  if (growthData.responseWindow.trim()) filled += 1;
  if (growthData.approvalOwner.trim()) filled += 1;
  if (growthData.trackedOutcomes.length > 0) filled += 1;
  if (growthHasDataPath(growthData)) filled += 1;
  return filled / 6;
}

/**
 * segmentIndex 0 = line after brand, 1 = after growth.
 */
export function getOnboardingSegmentFill(segmentIndex, stepStates, brandData, growthData) {
  if (segmentIndex === 0) {
    if (stepStates[0] === 'skipped') return { tone: 'red', progress: 1 };
    if (stepStates[0] === 'completed') return { tone: 'green', progress: 1 };
    return { tone: 'green', progress: getBrandStepCompletionRatio(brandData) };
  }

  if (segmentIndex === 1) {
    if (stepStates[1] === 'skipped' || stepStates[2] === 'skipped') return { tone: 'red', progress: 1 };
    if (stepStates[1] === 'completed') return { tone: 'green', progress: 1 };
    return { tone: 'green', progress: getGrowthStepCompletionRatio(growthData) };
  }

  return { tone: 'green', progress: 0 };
}
