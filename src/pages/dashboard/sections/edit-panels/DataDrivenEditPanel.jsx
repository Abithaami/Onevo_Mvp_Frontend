import { useEffect, useState } from 'react';
import SelectionChip from '../../../../components/SelectionChip';
import SourceLogo from '../../../../components/SourceLogo';
import { growthGoalOptions, outcomeOptions, successMetricOptions } from '../../../../data/onboardingFieldOptions';
import { growthIntegrationSources } from '../../../../data/onevoData';
import { cloneGrowthData } from '../../../../lib/workspaceUtils';

export default function DataDrivenEditPanel({ growthData, onGrowthChange }) {
  const [draft, setDraft] = useState(() => cloneGrowthData(growthData));
  const [fileResetKey, setFileResetKey] = useState(0);

  useEffect(() => {
    setDraft(cloneGrowthData(growthData));
  }, [growthData]);

  function toggleOutcome(option) {
    setDraft((current) => {
      const trackedOutcomes = current.trackedOutcomes.includes(option)
        ? current.trackedOutcomes.filter((item) => item !== option)
        : [...current.trackedOutcomes, option];
      return { ...current, trackedOutcomes };
    });
  }

  function toggleGrowthIntegration(sourceId) {
    const key =
      sourceId === 'google-business' ? 'connectGoogleBusiness' : sourceId === 'pos' ? 'connectPos' : 'connectBooking';
    setDraft((current) => ({ ...current, [key]: !current[key] }));
  }

  function handleSave() {
    onGrowthChange(cloneGrowthData(draft));
  }

  function handleCancel() {
    setDraft(cloneGrowthData(growthData));
    setFileResetKey((k) => k + 1);
  }

  return (
    <div className="dashboard-edit">
      <header className="dashboard-edit__head">
        <p className="eyebrow">Workspace</p>
        <h1 className="dashboard-edit__title">Data-driven growth</h1>
        <p className="dashboard-edit__lede">Link POS, Google Business, or booking—or upload Excel / an image if you use neither yet.</p>
      </header>
      <div className="onboarding-panel dashboard-edit__panel">
        <div className="growth-integrations">
          <h3 className="growth-integrations__title">Business data connections</h3>
          <p className="growth-integrations__lede">Toggle what you plan to connect; real OAuth follows in a later release.</p>
          <div className="onboarding-connection-grid onboarding-connection-grid--growth">
            {growthIntegrationSources.map((source) => {
              const on =
                source.id === 'google-business'
                  ? draft.connectGoogleBusiness
                  : source.id === 'pos'
                    ? draft.connectPos
                    : draft.connectBooking;

              return (
                <article key={source.id} className={`onboarding-connection-card ${on ? 'active' : ''}`}>
                  <div className="onboarding-connection-top">
                    <SourceLogo id={source.id} name={source.name} />
                    <span className={`onboarding-source-badge ${on ? 'active' : ''}`}>{on ? 'On' : 'Off'}</span>
                  </div>
                  <div className="onboarding-connection-copy">
                    <p>{source.type}</p>
                    <h3>{source.name}</h3>
                    <small>{source.signal}</small>
                  </div>
                  <button type="button" className={on ? 'secondary-btn' : 'primary-btn'} onClick={() => toggleGrowthIntegration(source.id)}>
                    {on ? 'Disconnect' : 'Connect'}
                  </button>
                </article>
              );
            })}
          </div>
        </div>

        <div className="growth-fallback-uploads">
          <h3 className="growth-fallback-uploads__title">Upload reference data</h3>
          <p className="growth-fallback-uploads__lede">Excel / CSV or an image when systems are not connected.</p>
          <div className="growth-fallback-uploads__row">
            <div className="onboarding-field">
              <label htmlFor="dash-growth-excel">Excel / CSV</label>
              <input
                key={`excel-${fileResetKey}`}
                id="dash-growth-excel"
                type="file"
                accept=".csv,.xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setDraft((current) => ({ ...current, fallbackExcelName: file ? file.name : '' }));
                }}
              />
              {draft.fallbackExcelName ? <p className="growth-fallback-uploads__file">{draft.fallbackExcelName}</p> : null}
            </div>
            <div className="onboarding-field">
              <label htmlFor="dash-growth-image">Image</label>
              <input
                key={`image-${fileResetKey}`}
                id="dash-growth-image"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setDraft((current) => ({ ...current, fallbackImageName: file ? file.name : '' }));
                }}
              />
              {draft.fallbackImageName ? <p className="growth-fallback-uploads__file">{draft.fallbackImageName}</p> : null}
            </div>
          </div>
        </div>

        <div className="onboarding-chip-group">
          <span>Primary growth goal</span>
          <div className="selection-chip-row">
            {growthGoalOptions.map((option) => (
              <SelectionChip key={option} active={draft.primaryGoal === option} onClick={() => setDraft((d) => ({ ...d, primaryGoal: option }))}>
                {option}
              </SelectionChip>
            ))}
          </div>
        </div>
        <div className="onboarding-chip-group">
          <span>Success metric ONEVO should prioritize</span>
          <div className="selection-chip-row">
            {successMetricOptions.map((option) => (
              <SelectionChip key={option} active={draft.successMetric === option} onClick={() => setDraft((d) => ({ ...d, successMetric: option }))}>
                {option}
              </SelectionChip>
            ))}
          </div>
        </div>
        <div className="onboarding-field-grid">
          <div className="onboarding-field">
            <label htmlFor="dash-monthly-target">Monthly target</label>
            <input
              id="dash-monthly-target"
              type="text"
              placeholder="25 qualified inquiries"
              value={draft.monthlyTarget}
              onChange={(event) => setDraft((d) => ({ ...d, monthlyTarget: event.target.value }))}
            />
          </div>
          <div className="onboarding-field">
            <label htmlFor="dash-response-window">Target response window</label>
            <input
              id="dash-response-window"
              type="text"
              placeholder="Reply within 30 minutes"
              value={draft.responseWindow}
              onChange={(event) => setDraft((d) => ({ ...d, responseWindow: event.target.value }))}
            />
          </div>
          <div className="onboarding-field onboarding-field--wide">
            <label htmlFor="dash-approval-owner">Who approves high-impact actions?</label>
            <input
              id="dash-approval-owner"
              type="text"
              placeholder="Owner, branch manager, marketing lead..."
              value={draft.approvalOwner}
              onChange={(event) => setDraft((d) => ({ ...d, approvalOwner: event.target.value }))}
            />
          </div>
        </div>
        <div className="onboarding-chip-group">
          <span>Which outcomes should be tracked first?</span>
          <div className="selection-chip-row">
            {outcomeOptions.map((option) => (
              <SelectionChip key={option} active={draft.trackedOutcomes.includes(option)} onClick={() => toggleOutcome(option)}>
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
