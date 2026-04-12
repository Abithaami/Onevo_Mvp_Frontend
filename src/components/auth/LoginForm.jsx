import { GoogleIcon } from './AuthIcons.jsx';
import { googleOAuthLoginUrl } from '../../lib/apiBase.js';

export default function LoginForm({ googleReturnUrl, onShowToast }) {
  return (
    <div className="auth-mode-body" id="login-panel" role="tabpanel" aria-labelledby="tab-login">
      <p className="auth-card-kicker">Continue with Google to return to your workspace.</p>

      <div className="auth-google-stack">
        <a className="primary-btn auth-google-primary auth-google-primary--lead" href={googleOAuthLoginUrl(googleReturnUrl)}>
          <GoogleIcon />
          Continue with Google
        </a>
        <p className="auth-google-caption">The only live sign-in path—opens your real session on the API.</p>
      </div>

      <div className="auth-soon" aria-live="polite">
        <p className="auth-soon__line">
          Email and password aren’t available yet.
          <button
            type="button"
            className="auth-soon__inline-btn"
            onClick={() => onShowToast('Use Continue with Google. Email sign-in will ship when the API supports it.', 'info')}
          >
            Learn more
          </button>
        </p>
      </div>
    </div>
  );
}
