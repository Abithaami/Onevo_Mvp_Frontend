/**
 * Maps onboarding Business Data (section 2) UI state ↔ manual submission JSON + data source intents.
 */
import {
  createDataSource,
  createManualDataSubmission,
  DATA_SOURCE_TYPES,
  listDataSources,
  ONBOARDING_EXTERNAL_REF,
  updateManualDataSubmission,
} from './businessContextDataApi.js';

/**
 * @param {Record<string, unknown>} state - onboarding MVP state
 * @returns {Record<string, unknown>}
 */
export function buildOnboardingBusinessDataPayload(state) {
  const excelId = String(state.businessDataFileExcelId ?? '').trim();
  const csvId = String(state.businessDataFileCsvId ?? '').trim();
  const photoId = String(state.businessDataFilePhotoId ?? '').trim();
  return {
    schemaVersion: '1',
    kind: 'onboarding_business_data',
    intent: {
      pos: Boolean(state.trackPos),
      booking: Boolean(state.trackBooking),
      googleBusiness: Boolean(state.trackGoogleBusiness),
    },
    manualNotes: String(state.dataManualNotes ?? '').trim(),
    fileHints: {
      excel: String(state.dataExcelName ?? '').trim(),
      csv: String(state.dataCsvName ?? '').trim(),
      photo: String(state.dataPhotoName ?? '').trim(),
    },
    uploadedFileIds: {
      excel: excelId || null,
      csv: csvId || null,
      photo: photoId || null,
    },
  };
}

/**
 * @param {any[]} items
 * @param {string} sourceType
 */
function findDs(items, sourceType) {
  return items.find((x) => {
    const st = x.sourceType ?? x.SourceType;
    const ext = x.externalAccountReference ?? x.ExternalAccountReference;
    return st === sourceType && ext === ONBOARDING_EXTERNAL_REF;
  });
}

/**
 * Ensure `manual_business_data` + onboarding ref exists (for file uploads before section sync).
 * @param {string} [existingManualSourceId]
 * @returns {Promise<{ ok: true, manualDsId: string, error: '' } | { ok: false, manualDsId: '', error: string }>}
 */
export async function ensureOnboardingManualDataSource(existingManualSourceId) {
  const existing = String(existingManualSourceId ?? '').trim();
  if (existing) {
    return { ok: true, manualDsId: existing, error: '' };
  }
  const listRes = await listDataSources(false);
  if (!listRes.ok) {
    return { ok: false, manualDsId: '', error: listRes.error };
  }
  const items = listRes.items;
  const row = findDs(items, DATA_SOURCE_TYPES.manualBusinessData);
  if (row) {
    return { ok: true, manualDsId: String(row.id ?? row.Id ?? ''), error: '' };
  }
  const cr = await createDataSource({
    sourceType: DATA_SOURCE_TYPES.manualBusinessData,
    externalAccountReference: ONBOARDING_EXTERNAL_REF,
    displayName: 'Manual business data (onboarding)',
    connectorMetadataJson: JSON.stringify({ onboarding: true }),
    isActive: true,
  });
  if (!cr.ok) {
    return { ok: false, manualDsId: '', error: cr.error || 'Could not create manual data source.' };
  }
  const id = String(cr.data?.id ?? cr.data?.Id ?? '');
  if (!id) {
    return { ok: false, manualDsId: '', error: 'Invalid data source response.' };
  }
  return { ok: true, manualDsId: id, error: '' };
}

/**
 * Persist Business Data to API: manual submission JSON + optional intent data sources (POS / booking / GBP).
 * Best-effort; returns statePatch with server IDs for resume (draft).
 *
 * @param {Record<string, unknown>} state
 * @returns {Promise<{ ok: boolean, error: string, statePatch: Record<string, string> }>}
 */
export async function syncOnboardingBusinessData(state) {
  /** @type {Record<string, string>} */
  const statePatch = {};

  const listRes = await listDataSources(false);
  if (!listRes.ok) {
    return { ok: false, error: listRes.error, statePatch };
  }
  let items = listRes.items;

  /**
   * @param {string} sourceType
   * @param {string} displayName
   * @returns {Promise<string | null>}
   */
  async function ensureDs(sourceType, displayName) {
    const existing = findDs(items, sourceType);
    if (existing) {
      return String(existing.id ?? existing.Id ?? '');
    }
    const cr = await createDataSource({
      sourceType,
      externalAccountReference: ONBOARDING_EXTERNAL_REF,
      displayName,
      connectorMetadataJson: JSON.stringify({ onboarding: true }),
      isActive: true,
    });
    if (!cr.ok) {
      return null;
    }
    const id = String(cr.data?.id ?? cr.data?.Id ?? '');
    const again = await listDataSources(false);
    if (again.ok) {
      items = again.items;
    }
    return id || null;
  }

  let manualDsId = String(state.businessDataManualSourceId ?? '').trim();
  if (!manualDsId) {
    manualDsId = (await ensureDs(DATA_SOURCE_TYPES.manualBusinessData, 'Manual business data (onboarding)')) ?? '';
  }
  if (!manualDsId) {
    return {
      ok: false,
      error: 'Could not register manual business data with the server.',
      statePatch,
    };
  }
  statePatch.businessDataManualSourceId = manualDsId;

  if (state.trackPos) {
    await ensureDs(DATA_SOURCE_TYPES.pos, 'POS (onboarding)');
  }
  if (state.trackBooking) {
    await ensureDs(DATA_SOURCE_TYPES.booking, 'Booking (onboarding)');
  }
  if (state.trackGoogleBusiness) {
    await ensureDs(DATA_SOURCE_TYPES.googleBusiness, 'Google Business (onboarding)');
  }

  const payloadJson = JSON.stringify(buildOnboardingBusinessDataPayload(state));
  const subId = String(state.businessDataManualSubmissionId ?? '').trim();

  if (subId) {
    const up = await updateManualDataSubmission(subId, payloadJson);
    if (up.ok) {
      return { ok: true, error: '', statePatch };
    }
    const cr = await createManualDataSubmission(manualDsId, payloadJson);
    if (cr.ok) {
      const newId = String(cr.data?.id ?? cr.data?.Id ?? '');
      if (newId) statePatch.businessDataManualSubmissionId = newId;
      return {
        ok: true,
        error: `${up.error || 'Update failed'}; saved as new submission.`,
        statePatch,
      };
    }
    return {
      ok: false,
      error: [up.error, cr.error].filter(Boolean).join(' '),
      statePatch,
    };
  }

  const cr = await createManualDataSubmission(manualDsId, payloadJson);
  if (!cr.ok) {
    return { ok: false, error: cr.error || 'Could not save business data.', statePatch };
  }
  const newId = String(cr.data?.id ?? cr.data?.Id ?? '');
  if (newId) statePatch.businessDataManualSubmissionId = newId;
  return { ok: true, error: '', statePatch };
}
