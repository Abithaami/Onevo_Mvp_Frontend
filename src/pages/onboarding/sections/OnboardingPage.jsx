import { Fragment, useEffect, useState } from 'react';
import SelectionChip from '../../../components/SelectionChip';
import SourceLogo from '../../../components/SourceLogo';
import { onboardingSteps } from '../../../data/onboardingSteps';
import { brandOfferingOptions, growthGoalOptions, outcomeOptions, successMetricOptions } from '../../../data/onboardingFieldOptions';
import { growthIntegrationSources, socialMediaSources } from '../../../data/onevoData';
import { emptyBrandData, emptyConnectionData, emptyGrowthData } from '../../../data/setupData';
import { getOnboardingSegmentFill, growthHasDataPath, isLikelyWebsiteUrl } from '../../../lib/workspaceUtils';

function StepStatusIcon({ status }) {
  if (status === 'completed') {
    return (
      <span className="onboarding-step-icon onboarding-step-icon--completed" aria-hidden="true">
        <svg viewBox="0 0 20 20" fill="none">
          <path d="M5 10.5 8.5 14 15 7.5" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }

  if (status === 'skipped') {
    return (
      <span className="onboarding-step-icon onboarding-step-icon--skipped" aria-hidden="true">
        <svg viewBox="0 0 20 20" fill="none">
          <path d="m6 6 8 8M14 6l-8 8" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
        </svg>
      </span>
    );
  }

  return <span className="onboarding-step-icon onboarding-step-icon--pending" aria-hidden="true" />;
}

function StepPreviewIcon({ stepId, status, active }) {
  const variant = active ? 'current' : status;

  return (
    <span className={`onboarding-step-preview onboarding-step-preview--${variant}`} aria-hidden="true">
      {stepId === 'brand' && (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M12 3.5 13.8 8.2 18.5 10 13.8 11.8 12 16.5 10.2 11.8 5.5 10l4.7-1.8L12 3.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M18.2 4.8 18.8 6.2 20.2 6.8 18.8 7.4 18.2 8.8 17.6 7.4 16.2 6.8 17.6 6.2 18.2 4.8Z" fill="currentColor" />
        </svg>
      )}
      {stepId === 'growth' && (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M5 18.5h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M7.5 15V11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M12 15V8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M16.5 15V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )}
      {stepId === 'connections' && (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M9.5 14.5 14.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M8.2 17a3 3 0 0 1 0-4.2l1.7-1.7a3 3 0 0 1 4.2 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M15.8 7a3 3 0 0 1 0 4.2l-1.7 1.7a3 3 0 0 1-4.2 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )}
    </span>
  );
}

function StatusPill({ status }) {
  const label = status === 'completed' ? 'Completed' : status === 'skipped' ? 'Skipped' : 'In progress';

  return <span className={`onboarding-status-pill onboarding-status-pill--${status}`}>{label}</span>;
}

export default function OnboardingPage({ onBackToLanding, onOpenConnections, onCompleteOnboarding }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showError, setShowError] = useState(false);
  const [stepStates, setStepStates] = useState(['pending', 'pending', 'pending']);
  const [brandData, setBrandData] = useState(() => emptyBrandData());
  const [growthData, setGrowthData] = useState(() => emptyGrowthData());
  const [connectionData, setConnectionData] = useState(() => emptyConnectionData());

  const completedCount = stepStates.filter((state) => state === 'completed').length;
  const skippedCount = stepStates.filter((state) => state === 'skipped').length;
  const selectedConnections = socialMediaSources.filter((source) => connectionData[source.id]);
  const currentStepMeta = onboardingSteps[currentStep];

  useEffect(() => {
    setStepStates((current) => (current[0] === 'skipped' ? current.map((state, index) => (index === 0 ? 'pending' : state)) : current));
  }, [brandData]);

  useEffect(() => {
    setStepStates((current) => (current[1] === 'skipped' ? current.map((state, index) => (index === 1 ? 'pending' : state)) : current));
  }, [growthData]);

  useEffect(() => {
    setStepStates((current) => (current[2] === 'skipped' ? current.map((state, index) => (index === 2 ? 'pending' : state)) : current));
  }, [connectionData]);

  function moveForward(nextState) {
    const nextStepStates = stepStates.map((state, index) => (index === currentStep ? nextState : state));
    setStepStates(nextStepStates);
    setShowError(false);

    if (currentStep === onboardingSteps.length - 1) {
      if (onCompleteOnboarding) {
        onCompleteOnboarding({
          brandData: { ...brandData },
          growthData: { ...growthData },
          connectionData: { ...connectionData },
          stepStates: nextStepStates,
        });
      } else {
        setFinished(true);
      }
      return;
    }

    setCurrentStep((value) => value + 1);
  }

  function toggleOffering(option) {
    setBrandData((current) => ({
      ...current,
      offerings: current.offerings.includes(option) ? current.offerings.filter((item) => item !== option) : [...current.offerings, option],
    }));
  }

  function toggleOutcome(option) {
    setGrowthData((current) => ({
      ...current,
      trackedOutcomes: current.trackedOutcomes.includes(option)
        ? current.trackedOutcomes.filter((item) => item !== option)
        : [...current.trackedOutcomes, option],
    }));
  }

  function toggleConnection(sourceId) {
    setConnectionData((current) => ({ ...current, [sourceId]: !current[sourceId] }));
  }

  function toggleGrowthIntegration(sourceId) {
    const key =
      sourceId === 'google-business' ? 'connectGoogleBusiness' : sourceId === 'pos' ? 'connectPos' : 'connectBooking';
    setGrowthData((current) => ({ ...current, [key]: !current[key] }));
  }

  function runBrandExtract() {
    if (!isLikelyWebsiteUrl(brandData.websiteUrl)) return;
    setBrandData((current) => ({ ...current, brandExtractStatus: 'loading' }));
    window.setTimeout(() => {
      setBrandData((current) => ({
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

  function isStepReady() {
    if (currentStepMeta.id === 'brand') {
      const base = Boolean(
        brandData.businessName.trim() &&
          brandData.industry.trim() &&
          brandData.audience.trim() &&
          brandData.brandPromise.trim() &&
          brandData.offerings.length > 0,
      );
      if (brandData.brandInputMode === 'website') {
        return base && isLikelyWebsiteUrl(brandData.websiteUrl) && brandData.brandExtractStatus === 'done';
      }
      return base;
    }

    if (currentStepMeta.id === 'growth') {
      return Boolean(
        growthData.primaryGoal &&
          growthData.successMetric &&
          growthData.responseWindow.trim() &&
          growthData.approvalOwner.trim() &&
          growthData.trackedOutcomes.length > 0 &&
          growthHasDataPath(growthData),
      );
    }

    return selectedConnections.length > 0;
  }

  function handleNext() {
    if (!isStepReady()) {
      setShowError(true);
      return;
    }

    moveForward('completed');
  }

  function handleSkip() {
    moveForward('skipped');
  }

  function renderBrandStep() {
    return (
      <div className="onboarding-panel">
        <div className="brand-input-mode" role="group" aria-label="How to add brand details">
          <button
            type="button"
            className={`brand-input-mode__card ${brandData.brandInputMode === 'website' ? 'is-active' : ''}`}
            onClick={() => setBrandData((current) => ({ ...current, brandInputMode: 'website', brandExtractStatus: 'idle' }))}
          >
            <strong>From website</strong>
            <span>Paste your URL—we&apos;ll extract a starting profile you can edit.</span>
          </button>
          <button
            type="button"
            className={`brand-input-mode__card ${brandData.brandInputMode === 'manual' ? 'is-active' : ''}`}
            onClick={() => setBrandData((current) => ({ ...current, brandInputMode: 'manual' }))}
          >
            <strong>Manual entry</strong>
            <span>Enter brand details yourself—no website required.</span>
          </button>
        </div>

        {brandData.brandInputMode === 'website' ? (
          <div className="onboarding-field brand-website-extract">
            <label htmlFor="brand-website-url">Website URL</label>
            <div className="brand-website-extract__row">
              <input
                id="brand-website-url"
                type="url"
                inputMode="url"
                autoComplete="url"
                placeholder="https://yourbusiness.com"
                value={brandData.websiteUrl}
                onChange={(event) =>
                  setBrandData((current) => ({ ...current, websiteUrl: event.target.value, brandExtractStatus: 'idle' }))
                }
              />
              <button
                type="button"
                className="primary-btn"
                disabled={!isLikelyWebsiteUrl(brandData.websiteUrl) || brandData.brandExtractStatus === 'loading'}
                onClick={runBrandExtract}
              >
                {brandData.brandExtractStatus === 'loading' ? 'Extracting…' : 'Extract from website'}
              </button>
            </div>
            {brandData.brandExtractStatus === 'done' ? (
              <p className="brand-website-extract__hint">Preview ready—adjust any field below, then continue.</p>
            ) : null}
            <p className="brand-website-extract__note">Extraction is a local preview for MVP; refine everything before launch.</p>
          </div>
        ) : null}

        <div className="onboarding-field-grid">
          <div className="onboarding-field">
            <label htmlFor="business-name">Business name</label>
            <input
              id="business-name"
              type="text"
              placeholder="Onevo Studio"
              value={brandData.businessName}
              onChange={(event) => setBrandData((current) => ({ ...current, businessName: event.target.value }))}
            />
          </div>

          <div className="onboarding-field">
            <label htmlFor="industry">Business category</label>
            <input
              id="industry"
              type="text"
              placeholder="Boutique retail, wellness, cafe..."
              value={brandData.industry}
              onChange={(event) => setBrandData((current) => ({ ...current, industry: event.target.value }))}
            />
          </div>

          <div className="onboarding-field">
            <label htmlFor="service-area">Service area</label>
            <input
              id="service-area"
              type="text"
              placeholder="Colombo and nearby delivery zones"
              value={brandData.serviceArea}
              onChange={(event) => setBrandData((current) => ({ ...current, serviceArea: event.target.value }))}
            />
          </div>

          <div className="onboarding-field">
            <label htmlFor="audience">Ideal audience</label>
            <input
              id="audience"
              type="text"
              placeholder="Busy professionals looking for premium convenience"
              value={brandData.audience}
              onChange={(event) => setBrandData((current) => ({ ...current, audience: event.target.value }))}
            />
          </div>
        </div>

        <div className="onboarding-field">
          <label htmlFor="brand-promise">Brand promise</label>
          <textarea
            id="brand-promise"
            rows="4"
            placeholder="What makes your brand useful, different, and worth choosing?"
            value={brandData.brandPromise}
            onChange={(event) => setBrandData((current) => ({ ...current, brandPromise: event.target.value }))}
          />
        </div>

        <div className="onboarding-chip-group">
          <span>What do you offer most often?</span>
          <div className="selection-chip-row">
            {brandOfferingOptions.map((option) => (
              <SelectionChip key={option} active={brandData.offerings.includes(option)} onClick={() => toggleOffering(option)}>
                {option}
              </SelectionChip>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderGrowthStep() {
    return (
      <div className="onboarding-panel">
        <div className="growth-integrations">
          <h3 className="growth-integrations__title">Connect your business systems</h3>
          <p className="growth-integrations__lede">
            If you use Google Business Profile, a POS, or a booking tool, mark them—we&apos;ll prioritize these connections. OAuth
            happens after setup.
          </p>
          <div className="onboarding-connection-grid onboarding-connection-grid--growth">
            {growthIntegrationSources.map((source) => {
              const on =
                source.id === 'google-business'
                  ? growthData.connectGoogleBusiness
                  : source.id === 'pos'
                    ? growthData.connectPos
                    : growthData.connectBooking;

              return (
                <article key={source.id} className={`onboarding-connection-card ${on ? 'active' : ''}`}>
                  <div className="onboarding-connection-top">
                    <SourceLogo id={source.id} name={source.name} />
                    <span className={`onboarding-source-badge ${on ? 'active' : ''}`}>{on ? 'Selected' : 'Optional'}</span>
                  </div>
                  <div className="onboarding-connection-copy">
                    <p>{source.type}</p>
                    <h3>{source.name}</h3>
                    <small>{source.signal}</small>
                  </div>
                  <button type="button" className={on ? 'secondary-btn' : 'primary-btn'} onClick={() => toggleGrowthIntegration(source.id)}>
                    {on ? 'Remove' : 'Connect'}
                  </button>
                </article>
              );
            })}
          </div>
        </div>

        <div className="growth-fallback-uploads">
          <h3 className="growth-fallback-uploads__title">Or upload data instead</h3>
          <p className="growth-fallback-uploads__lede">
            If you are not connecting systems yet, add an Excel sheet (.xlsx, .csv) or an image snapshot (e.g. POS export or
            dashboard screenshot).
          </p>
          <div className="growth-fallback-uploads__row">
            <div className="onboarding-field">
              <label htmlFor="onboarding-growth-excel">Excel / CSV</label>
              <input
                id="onboarding-growth-excel"
                type="file"
                accept=".csv,.xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setGrowthData((current) => ({ ...current, fallbackExcelName: file ? file.name : '' }));
                }}
              />
              {growthData.fallbackExcelName ? <p className="growth-fallback-uploads__file">{growthData.fallbackExcelName}</p> : null}
            </div>
            <div className="onboarding-field">
              <label htmlFor="onboarding-growth-image">Image</label>
              <input
                id="onboarding-growth-image"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setGrowthData((current) => ({ ...current, fallbackImageName: file ? file.name : '' }));
                }}
              />
              {growthData.fallbackImageName ? <p className="growth-fallback-uploads__file">{growthData.fallbackImageName}</p> : null}
            </div>
          </div>
        </div>

        <div className="onboarding-chip-group">
          <span>Primary growth goal</span>
          <div className="selection-chip-row">
            {growthGoalOptions.map((option) => (
              <SelectionChip key={option} active={growthData.primaryGoal === option} onClick={() => setGrowthData((current) => ({ ...current, primaryGoal: option }))}>
                {option}
              </SelectionChip>
            ))}
          </div>
        </div>

        <div className="onboarding-chip-group">
          <span>Success metric ONEVO should prioritize</span>
          <div className="selection-chip-row">
            {successMetricOptions.map((option) => (
              <SelectionChip key={option} active={growthData.successMetric === option} onClick={() => setGrowthData((current) => ({ ...current, successMetric: option }))}>
                {option}
              </SelectionChip>
            ))}
          </div>
        </div>

        <div className="onboarding-field-grid">
          <div className="onboarding-field">
            <label htmlFor="monthly-target">Monthly target</label>
            <input
              id="monthly-target"
              type="text"
              placeholder="25 qualified inquiries"
              value={growthData.monthlyTarget}
              onChange={(event) => setGrowthData((current) => ({ ...current, monthlyTarget: event.target.value }))}
            />
          </div>

          <div className="onboarding-field">
            <label htmlFor="response-window">Target response window</label>
            <input
              id="response-window"
              type="text"
              placeholder="Reply within 30 minutes"
              value={growthData.responseWindow}
              onChange={(event) => setGrowthData((current) => ({ ...current, responseWindow: event.target.value }))}
            />
          </div>

          <div className="onboarding-field onboarding-field--wide">
            <label htmlFor="approval-owner">Who approves high-impact actions?</label>
            <input
              id="approval-owner"
              type="text"
              placeholder="Owner, branch manager, marketing lead..."
              value={growthData.approvalOwner}
              onChange={(event) => setGrowthData((current) => ({ ...current, approvalOwner: event.target.value }))}
            />
          </div>
        </div>

        <div className="onboarding-chip-group">
          <span>Which outcomes should be tracked first?</span>
          <div className="selection-chip-row">
            {outcomeOptions.map((option) => (
              <SelectionChip key={option} active={growthData.trackedOutcomes.includes(option)} onClick={() => toggleOutcome(option)}>
                {option}
              </SelectionChip>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderConnectionsStep() {
    return (
      <div className="onboarding-panel">
        <div className="onboarding-connection-grid onboarding-connection-grid--social">
          {socialMediaSources.map((source) => {
            const active = connectionData[source.id];

            return (
              <article key={source.id} className={`onboarding-connection-card ${active ? 'active' : ''}`}>
                <div className="onboarding-connection-top">
                  <SourceLogo id={source.id} name={source.name} />
                  <span className={`onboarding-source-badge ${active ? 'active' : ''}`}>{active ? 'Selected' : 'Later'}</span>
                </div>
                <div className="onboarding-connection-copy">
                  <p>{source.type}</p>
                  <h3>{source.name}</h3>
                  <small>{source.signal}</small>
                </div>
                <button type="button" className={active ? 'secondary-btn' : 'primary-btn'} onClick={() => toggleConnection(source.id)}>
                  {active ? 'Remove' : 'Add source'}
                </button>
              </article>
            );
          })}
        </div>

        <div className="onboarding-tip-card">
          <strong>Facebook, Instagram &amp; LinkedIn only</strong>
          <p>Select which social accounts should feed your first signal loop. OAuth with each provider can be finished in the dashboard later.</p>
        </div>
      </div>
    );
  }

  function renderCurrentStep() {
    if (currentStepMeta.id === 'brand') {
      return renderBrandStep();
    }

    if (currentStepMeta.id === 'growth') {
      return renderGrowthStep();
    }

    return renderConnectionsStep();
  }

  function renderCompletionView() {
    return (
      <section className="onboarding-finish-card" aria-labelledby="onboarding-finish-title">
        <p className="eyebrow">Setup snapshot ready</p>
        <h2 id="onboarding-finish-title">Your first ONEVO operating context is ready.</h2>
        <p>The setup captured brand context, growth priorities, and source readiness so the platform can stay approval-first and opportunity-focused.</p>

        <div className="onboarding-finish-grid">
          {onboardingSteps.map((step, index) => (
            <article key={step.id} className="onboarding-finish-item">
              <div className="onboarding-finish-item-top">
                <StepStatusIcon status={stepStates[index]} />
                <div>
                  <strong>{step.title}</strong>
                  <p>{stepStates[index] === 'completed' ? 'Completed and saved for setup.' : 'Skipped for now. You can return later.'}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="onboarding-finish-actions">
          {onOpenConnections && (
            <button type="button" className="primary-btn" onClick={onOpenConnections}>
              Open connections workspace
            </button>
          )}
          {onBackToLanding && (
            <button type="button" className="secondary-btn" onClick={() => onBackToLanding('#home')}>
              Back to landing
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <main className="onboarding-page" id="onboarding" aria-label="Onboarding page">
      <section className="onboarding-shell">
        <div className="onboarding-welcome">
          <h1>Welcome to onboarding</h1>
          <p>Set up your business context, growth priorities, and source connections in a clean three-step flow.</p>
        </div>

        <div className="onboarding-flow-head">
          <div className="onboarding-stepper" aria-label="Onboarding progress">
            <div className="onboarding-stepper-track">
              {onboardingSteps.map((step, index) => {
                const status = stepStates[index];
                const active = index === currentStep && !finished;
                const statusLabel = status === 'completed' ? 'Done' : status === 'skipped' ? 'Skipped' : active ? 'Current' : 'Pending';

                return (
                  <Fragment key={step.id}>
                    <div className="onboarding-stepper-item">
                      <button
                        type="button"
                        className={`onboarding-step-card ${active ? 'active' : ''} ${status !== 'pending' ? `is-${status}` : ''}`}
                        onClick={() => {
                          setFinished(false);
                          setCurrentStep(index);
                          setShowError(false);
                        }}
                      >
                        <div className="onboarding-step-node">
                          <StepPreviewIcon stepId={step.id} status={status} active={active} />
                          <span className={`onboarding-step-count onboarding-step-count--${active ? 'current' : status}`}>{index + 1}</span>
                        </div>
                        <div className="onboarding-step-card-body">
                          <strong>{step.title}</strong>
                          <span className={`onboarding-step-state onboarding-step-state--${active ? 'current' : status}`}>{statusLabel}</span>
                        </div>
                      </button>
                    </div>

                    {index < onboardingSteps.length - 1 && (() => {
                      const seg = getOnboardingSegmentFill(index, stepStates, brandData, growthData);
                      const pct = Math.round(seg.progress * 100);
                      const ariaLabel =
                        index === 0
                          ? seg.tone === 'red'
                            ? 'Brand step was skipped; fill details to show progress in green'
                            : `Brand step completion toward step two: ${pct} percent`
                          : seg.tone === 'red'
                            ? 'A step on this path was skipped; complete growth and connections to show green progress'
                            : `Growth step completion toward step three: ${pct} percent`;

                      return (
                        <div
                          className={`onboarding-step-connector onboarding-step-connector--segment-${index}`}
                          role="progressbar"
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={seg.tone === 'red' ? 100 : pct}
                          aria-label={ariaLabel}
                        >
                          <div className="onboarding-step-connector-track" />
                          <div
                            className={`onboarding-step-connector-fill ${seg.tone === 'red' ? 'onboarding-step-connector-fill--skipped' : ''}`}
                            style={{ width: `${seg.progress * 100}%` }}
                          />
                        </div>
                      );
                    })()}
                  </Fragment>
                );
              })}
            </div>
          </div>
        </div>

        <div className="onboarding-layout">
          <section className="onboarding-main" aria-labelledby="onboarding-step-title">
            {!finished ? (
              <div className="onboarding-card">
                <div className="onboarding-card-head">
                  <div className="onboarding-stage">
                    <div className="onboarding-stage-copy">
                      <p className="eyebrow">{currentStepMeta.eyebrow}</p>
                      <h2 id="onboarding-step-title">{currentStepMeta.heading}</h2>
                      <p>{currentStepMeta.description}</p>
                    </div>

                    <div className="onboarding-stage-visual">
                      <img src={currentStepMeta.image} alt={currentStepMeta.imageAlt} />
                      <div className="onboarding-stage-overlay">
                        <span>{currentStepMeta.kicker}</span>
                        <ul className="onboarding-stage-prompt-list">
                          {currentStepMeta.prompts.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                  <StatusPill status={stepStates[currentStep] === 'pending' ? 'pending' : stepStates[currentStep]} />
                </div>

                {renderCurrentStep()}

                {showError && (
                  <div className="onboarding-inline-alert" role="alert">
                    Add the core details for this step, or use Skip if you want to come back later.
                  </div>
                )}

                <div className="onboarding-actions">
                  <button type="button" className="secondary-btn" onClick={handleSkip}>
                    {currentStep === onboardingSteps.length - 1 ? 'Skip and finish' : 'Skip step'}
                  </button>
                  <button type="button" className="primary-btn" onClick={handleNext}>
                    {currentStep === onboardingSteps.length - 1 ? 'Finish setup' : 'Save and continue'}
                  </button>
                </div>
              </div>
            ) : (
              renderCompletionView()
            )}
          </section>

          <aside className="onboarding-sidebar" aria-label="Setup summary">
            <section className="onboarding-side-card">
              <span className="summary-label">Setup progress</span>
              <strong>
                {completedCount} completed
                <small>{skippedCount} skipped</small>
              </strong>
              <div className="summary-meter" aria-label={`${completedCount} of ${onboardingSteps.length} steps completed`}>
                <span style={{ width: `${((completedCount + skippedCount) / onboardingSteps.length) * 100}%` }} />
              </div>
            </section>

            <section className="onboarding-side-card">
              <h3>Why ONEVO needs this</h3>
              <ul className="onboarding-side-list">
                {currentStepMeta.evidence.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="onboarding-side-card">
              <h3>Captured so far</h3>
              <div className="onboarding-snapshot">
                <span>Brand</span>
                <strong>{brandData.businessName.trim() || 'Not added yet'}</strong>
                <p>{brandData.offerings.length > 0 ? brandData.offerings.join(', ') : 'Offerings not selected yet'}</p>
              </div>
              <div className="onboarding-snapshot">
                <span>Growth</span>
                <strong>{growthData.primaryGoal || 'Goal not chosen yet'}</strong>
                <p>{growthData.successMetric || 'Success metric not chosen yet'}</p>
              </div>
              <div className="onboarding-snapshot">
                <span>Connections</span>
                <strong>{selectedConnections.length} selected</strong>
                <p>{selectedConnections.length > 0 ? selectedConnections.map((source) => source.name).join(', ') : 'No sources selected yet'}</p>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
