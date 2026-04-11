import { useEffect, useState } from 'react';
import SelectionChip from '../../../../components/SelectionChip';
import { brandOfferingOptions } from '../../../../data/onboardingFieldOptions';
import { cloneBrandData, isLikelyWebsiteUrl } from '../../../../lib/workspaceUtils';

export default function BrandDnaEditPanel({ brandData, onBrandChange }) {
  const [draft, setDraft] = useState(() => cloneBrandData(brandData));

  useEffect(() => {
    setDraft(cloneBrandData(brandData));
  }, [brandData]);

  function toggleOffering(option) {
    setDraft((current) => {
      const offerings = current.offerings.includes(option)
        ? current.offerings.filter((item) => item !== option)
        : [...current.offerings, option];
      return { ...current, offerings };
    });
  }

  function runBrandExtract() {
    if (!isLikelyWebsiteUrl(draft.websiteUrl)) return;
    setDraft((current) => ({ ...current, brandExtractStatus: 'loading' }));
    window.setTimeout(() => {
      setDraft((current) => ({
        ...current,
        brandExtractStatus: 'done',
        businessName: current.businessName.trim() || 'Your business (from website)',
        industry: current.industry.trim() || 'Services & retail',
        serviceArea: current.serviceArea.trim() || 'Define your regions below',
        audience: current.audience.trim() || 'Local customers and online visitors',
        brandPromise: current.brandPromise.trim() || 'Reliable service and clear value.',
        offerings: current.offerings.length > 0 ? current.offerings : [brandOfferingOptions[0]],
      }));
    }, 900);
  }

  function handleSave() {
    onBrandChange(cloneBrandData(draft));
  }

  function handleCancel() {
    setDraft(cloneBrandData(brandData));
  }

  return (
    <div className="dashboard-edit">
      <header className="dashboard-edit__head">
        <p className="eyebrow">Workspace</p>
        <h1 className="dashboard-edit__title">Brand DNA</h1>
        <p className="dashboard-edit__lede">Start from your website or enter details manually—same as onboarding.</p>
      </header>
      <div className="onboarding-panel dashboard-edit__panel">
        <div className="brand-input-mode" role="group" aria-label="How to add brand details">
          <button
            type="button"
            className={`brand-input-mode__card ${draft.brandInputMode === 'website' ? 'is-active' : ''}`}
            onClick={() => setDraft((current) => ({ ...current, brandInputMode: 'website', brandExtractStatus: 'idle' }))}
          >
            <strong>From website</strong>
            <span>URL extract preview, then edit fields.</span>
          </button>
          <button
            type="button"
            className={`brand-input-mode__card ${draft.brandInputMode === 'manual' ? 'is-active' : ''}`}
            onClick={() => setDraft((current) => ({ ...current, brandInputMode: 'manual' }))}
          >
            <strong>Manual entry</strong>
            <span>Type brand details directly.</span>
          </button>
        </div>

        {draft.brandInputMode === 'website' ? (
          <div className="onboarding-field brand-website-extract">
            <label htmlFor="dash-brand-website-url">Website URL</label>
            <div className="brand-website-extract__row">
              <input
                id="dash-brand-website-url"
                type="url"
                inputMode="url"
                placeholder="https://yourbusiness.com"
                value={draft.websiteUrl}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, websiteUrl: event.target.value, brandExtractStatus: 'idle' }))
                }
              />
              <button
                type="button"
                className="primary-btn"
                disabled={!isLikelyWebsiteUrl(draft.websiteUrl) || draft.brandExtractStatus === 'loading'}
                onClick={runBrandExtract}
              >
                {draft.brandExtractStatus === 'loading' ? 'Extracting…' : 'Extract from website'}
              </button>
            </div>
            {draft.brandExtractStatus === 'done' ? (
              <p className="brand-website-extract__hint">Preview loaded—edit fields below before saving.</p>
            ) : null}
          </div>
        ) : null}

        <div className="onboarding-field-grid">
          <div className="onboarding-field">
            <label htmlFor="dash-business-name">Business name</label>
            <input
              id="dash-business-name"
              type="text"
              placeholder="Onevo Studio"
              value={draft.businessName}
              onChange={(event) => setDraft((d) => ({ ...d, businessName: event.target.value }))}
            />
          </div>
          <div className="onboarding-field">
            <label htmlFor="dash-industry">Business category</label>
            <input
              id="dash-industry"
              type="text"
              placeholder="Boutique retail, wellness, cafe..."
              value={draft.industry}
              onChange={(event) => setDraft((d) => ({ ...d, industry: event.target.value }))}
            />
          </div>
          <div className="onboarding-field">
            <label htmlFor="dash-service-area">Service area</label>
            <input
              id="dash-service-area"
              type="text"
              placeholder="Colombo and nearby delivery zones"
              value={draft.serviceArea}
              onChange={(event) => setDraft((d) => ({ ...d, serviceArea: event.target.value }))}
            />
          </div>
          <div className="onboarding-field">
            <label htmlFor="dash-audience">Ideal audience</label>
            <input
              id="dash-audience"
              type="text"
              placeholder="Busy professionals looking for premium convenience"
              value={draft.audience}
              onChange={(event) => setDraft((d) => ({ ...d, audience: event.target.value }))}
            />
          </div>
        </div>
        <div className="onboarding-field">
          <label htmlFor="dash-brand-promise">Brand promise</label>
          <textarea
            id="dash-brand-promise"
            rows="4"
            placeholder="What makes your brand useful, different, and worth choosing?"
            value={draft.brandPromise}
            onChange={(event) => setDraft((d) => ({ ...d, brandPromise: event.target.value }))}
          />
        </div>
        <div className="onboarding-chip-group">
          <span>What do you offer most often?</span>
          <div className="selection-chip-row">
            {brandOfferingOptions.map((option) => (
              <SelectionChip key={option} active={draft.offerings.includes(option)} onClick={() => toggleOffering(option)}>
                {option}
              </SelectionChip>
            ))}
          </div>
        </div>

        <div className="dashboard-edit__actions">
          <button type="button" className="secondary-btn" onClick={handleCancel}>
            Cancel
          </button>
          <button type="button" className="primary-btn dashboard-edit__save" onClick={handleSave}>
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
