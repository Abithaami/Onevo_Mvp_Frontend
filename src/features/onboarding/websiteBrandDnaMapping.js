/**
 * Maps backend BrandDnaWebExtractionDto (preview / save) ↔ onboarding MVP field shape.
 * Keeps DTO assumptions out of UI components.
 */

/** @param {unknown} v */
function pickString(v) {
  if (v == null) return '';
  const s = String(v).trim();
  return s;
}

/**
 * @param {string} text
 * @param {string[]} [fallback]
 * @returns {string[]}
 */
function splitOfferings(text, fallback = []) {
  const t = pickString(text);
  if (!t) return [...fallback];
  return t
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Map preview JSON into partial onboarding state updates (business profile fields only).
 * @param {Record<string, unknown>} dto - BrandDnaWebExtractionDto from POST .../preview
 * @returns {{ businessType: string, productsOrServices: string, location: string, brandTone: string, targetCustomers: string, shortDescription: string }}
 */
export function mapBrandDnaPreviewToOnboardingFields(dto) {
  if (!dto || typeof dto !== 'object') {
    return {
      businessType: '',
      productsOrServices: '',
      location: '',
      brandTone: '',
      targetCustomers: '',
      shortDescription: '',
    };
  }

  const c = /** @type {Record<string, unknown>} */ (dto.canonical ?? dto.Canonical ?? {});
  const headingTwo = /** @type {string[]} */ (dto.headingTwo ?? dto.HeadingTwo ?? []);
  const keyPhrases = /** @type {string[]} */ (dto.keyPhrases ?? dto.KeyPhrases ?? []);
  const offeringsRaw = c.offerings ?? c.Offerings;
  const offerings = Array.isArray(offeringsRaw) ? offeringsRaw.map((x) => pickString(x)).filter(Boolean) : [];

  const category = pickString(c.category ?? c.Category);
  const businessType =
    category ||
    (headingTwo[0] ? headingTwo[0] : '') ||
    (keyPhrases[0] ? keyPhrases[0] : '');

  let productsOrServices = '';
  if (offerings.length > 0) {
    productsOrServices = offerings.join(', ');
  } else if (keyPhrases.length > 1) {
    productsOrServices = keyPhrases.slice(1).join(', ');
  }

  const location = pickString(c.marketOrArea ?? c.MarketOrArea);

  const ogDesc = pickString(dto.openGraphDescription ?? dto.OpenGraphDescription);
  const metaDesc = pickString(dto.metaDescription ?? dto.MetaDescription);
  let brandTone = '';
  if (ogDesc) {
    brandTone = ogDesc.split(/[.!?]/)[0]?.trim() ?? '';
    if (brandTone.length > 160) brandTone = `${brandTone.slice(0, 157)}…`;
  } else if (keyPhrases.length > 2) {
    brandTone = keyPhrases[2];
  }

  const targetCustomers = pickString(c.audience ?? c.Audience);

  const brandPromise = pickString(c.brandPromise ?? c.BrandPromise);
  const suggestedTagline = pickString(dto.suggestedTagline ?? dto.SuggestedTagline);
  const shortDescription =
    brandPromise ||
    suggestedTagline ||
    metaDesc ||
    ogDesc ||
    pickString(dto.pageTitle ?? dto.PageTitle).slice(0, 500);

  return {
    businessType,
    productsOrServices,
    location,
    brandTone,
    targetCustomers,
    shortDescription,
  };
}

/**
 * Merge current onboarding edits into the last preview DTO for POST .../save.
 * @param {Record<string, unknown>} previewDto - last successful preview payload (mutated copy ok)
 * @param {Record<string, unknown>} state - onboarding wizard state
 * @returns {Record<string, unknown>}
 */
/**
 * Merge `BrandDnaWithAgentPreviewDto` into a `BrandDnaWebExtractionDto`-shaped object for save + onboarding mapping.
 * Uses merged `brandDna` canonical as `canonical` on the scrape payload.
 *
 * @param {Record<string, unknown>} json - API body from POST .../preview-with-agent
 * @returns {Record<string, unknown> | null}
 */
export function mergeBrandDnaWithAgentResponseToWebExtractionDto(json) {
  if (!json || typeof json !== 'object') return null;
  const o = /** @type {Record<string, unknown>} */ (json);
  const scrape = o.scrape ?? o.Scrape;
  const brandDna = o.brandDna ?? o.BrandDna;
  if (!scrape || typeof scrape !== 'object') return null;
  let base;
  try {
    base = /** @type {Record<string, unknown>} */ (JSON.parse(JSON.stringify(scrape)));
  } catch {
    return null;
  }
  if (brandDna && typeof brandDna === 'object' && !Array.isArray(brandDna)) {
    base.canonical = brandDna;
  }
  return base;
}

/**
 * @param {Record<string, unknown>} json - API body from POST .../preview-with-agent
 * @returns {{ websiteBrandDnaAgentSummary: string, websiteBrandDnaAgentStructuredJson: string }}
 */
export function extractAgentPreviewMetadata(json) {
  if (!json || typeof json !== 'object') {
    return { websiteBrandDnaAgentSummary: '', websiteBrandDnaAgentStructuredJson: '' };
  }
  const o = /** @type {Record<string, unknown>} */ (json);
  const sum = o.websiteBrandDnaAgentSummary ?? o.WebsiteBrandDnaAgentSummary;
  const sj = o.websiteBrandDnaAgentStructuredJson ?? o.WebsiteBrandDnaAgentStructuredJson;
  return {
    websiteBrandDnaAgentSummary: sum != null ? String(sum) : '',
    websiteBrandDnaAgentStructuredJson: sj != null ? String(sj) : '',
  };
}

export function buildWebsiteBrandDnaSavePayload(previewDto, state) {
  const base = JSON.parse(JSON.stringify(previewDto));
  const url = pickString(state.websiteUrl) || pickString(base.sourceUrl ?? base.SourceUrl);
  base.sourceUrl = url;
  base.schemaVersion = base.schemaVersion ?? base.SchemaVersion ?? '1.1';

  const prevCanon = /** @type {Record<string, unknown>} */ (base.canonical ?? base.Canonical ?? {});
  const prevOfferings = Array.isArray(prevCanon.offerings ?? prevCanon.Offerings)
    ? /** @type {string[]} */ (prevCanon.offerings ?? prevCanon.Offerings)
    : [];

  base.canonical = {
    businessName: pickString(state.businessName) || pickString(prevCanon.businessName ?? prevCanon.BusinessName) || null,
    category: pickString(state.businessType) || pickString(prevCanon.category ?? prevCanon.Category) || null,
    marketOrArea: pickString(state.location) || pickString(prevCanon.marketOrArea ?? prevCanon.MarketOrArea) || null,
    audience: pickString(state.targetCustomers) || pickString(prevCanon.audience ?? prevCanon.Audience) || null,
    brandPromise: pickString(state.shortDescription) || pickString(prevCanon.brandPromise ?? prevCanon.BrandPromise) || null,
    offerings: splitOfferings(state.productsOrServices, prevOfferings),
  };

  const uiPrev = base.uiExtractState ?? base.UiExtractState ?? {};
  const ui = typeof uiPrev === 'object' && uiPrev !== null ? { ...uiPrev } : {};
  const tone = pickString(state.brandTone);
  if (tone) ui.brandTone = tone;
  base.uiExtractState = ui;

  return base;
}
