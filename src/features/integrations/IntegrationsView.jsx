import LinkedInCommentIntentSection from './components/LinkedInCommentIntentSection.jsx';
import LinkedInIntegrationSection from './components/LinkedInIntegrationSection.jsx';
import './integrations.css';

export default function IntegrationsView() {
  return (
    <div className="int-page">
      <header className="int-page-header">
        <h1 className="int-page-title">Integrations</h1>
        <p className="int-page-lead">
          Connect your <strong>LinkedIn</strong> account so Onevo can use live OAuth data for publishing and engagement
          flows.
        </p>
      </header>

      <LinkedInIntegrationSection />

      <LinkedInCommentIntentSection />
    </div>
  );
}
