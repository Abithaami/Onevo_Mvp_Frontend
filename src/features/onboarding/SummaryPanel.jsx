import {
  getGoalById,
  getHeardLabel,
  getIndustryLabel,
  getIntegrationById,
  getRoleLabel,
  TOOL_CHIPS
} from './constants.js';

function toolLabels(ids) {
  if (!ids?.length) {
    return '—';
  }
  return ids
    .map((id) => TOOL_CHIPS.find((t) => t.id === id)?.label ?? id)
    .join(', ');
}

export default function SummaryPanel({ state, onEditStep, compact = false }) {
  const { preferredName, role, heardAbout, businessName, industry, tools, website, goalIds, integrationSkipped, connectedIntegrationId } =
    state;

  const rows = [
    { label: 'Name', value: preferredName.trim() || '—', step: 0 },
    { label: 'Role', value: role ? getRoleLabel(role) : '—', step: 0 },
    { label: 'Heard about', value: heardAbout ? getHeardLabel(heardAbout) : '—', step: 0 },
    { label: 'Business', value: businessName.trim() || '—', step: 1 },
    { label: 'Industry', value: industry ? getIndustryLabel(industry) : '—', step: 1 },
    { label: 'Tools', value: toolLabels(tools), step: 1 },
    { label: 'Website', value: website.trim() || '—', step: 1 },
    {
      label: 'Goals',
      value:
        goalIds.length === 0
          ? '—'
          : goalIds
              .map((id) => getGoalById(id)?.title ?? id)
              .join(' · '),
      step: 2
    },
    {
      label: 'Integration',
      value: integrationSkipped
        ? 'Connect later'
        : connectedIntegrationId
          ? getIntegrationById(connectedIntegrationId)?.label ?? connectedIntegrationId
          : '—',
      step: 3
    }
  ];

  return (
    <aside className={`onboarding-summary ${compact ? 'onboarding-summary--compact' : ''}`} aria-label="Setup summary">
      <h2 className="onboarding-summary-title">What Onevo is learning</h2>
      <p className="onboarding-summary-lead">Your answers shape recommendations and your first dashboard.</p>
      <ul className="onboarding-summary-list">
        {rows.map((row) => (
          <li key={row.label} className="onboarding-summary-row">
            <div className="onboarding-summary-main">
              <span className="onboarding-summary-label">{row.label}</span>
              <span className="onboarding-summary-value">{row.value}</span>
            </div>
            {!compact && (
              <button type="button" className="onboarding-summary-edit" onClick={() => onEditStep(row.step)}>
                Edit
              </button>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}
