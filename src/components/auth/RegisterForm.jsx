import { GoogleIcon } from './AuthIcons.jsx';
import { googleOAuthLoginUrl } from '../../lib/apiBase.js';

export default function RegisterForm({ googleReturnUrl, onShowToast }) {
  return (
    <div className="auth-mode-body" id="register-panel" role="tabpanel" aria-labelledby="tab-register">
      <p className="auth-card-kicker">Start with Google—new workspaces begin in onboarding.</p>

      <div className="auth-google-stack">
        <a className="primary-btn auth-google-primary auth-google-primary--lead" href={googleOAuthLoginUrl(googleReturnUrl)}>
          <GoogleIcon />
          Start with Google
        </a>
        <p className="auth-google-caption">Creates your tenant on first sign-in, then takes you into setup.</p>
      </div>

      <div className="auth-soon" aria-live="polite">
        <p className="auth-soon__line">
          Manual email signup is coming soon.
          <button
            type="button"
            className="auth-soon__inline-btn"
            onClick={() =>
              onShowToast('New accounts use Google for now—you’ll land in onboarding after sign-in.', 'info')
            }
          >
            Learn more
          </button>
        </p>
      </div>
    </div>
  );
}
