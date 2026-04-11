import PasswordField from './PasswordField.jsx';
import { GoogleIcon } from './AuthIcons.jsx';
import { googleOAuthLoginUrl } from '../../lib/apiBase.js';

export default function LoginForm({ login, setLogin, loading, onSubmit, onShowToast }) {
  return (
    <form id="loginForm" autoComplete="on" role="tabpanel" aria-labelledby="tab-login" onSubmit={onSubmit}>
      <div className="form-shell" id="login-panel">
        <div className="field">
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            name="email"
            placeholder="you@example.com"
            required
            autoComplete="username"
            aria-required="true"
            value={login.email}
            onChange={(event) => setLogin((current) => ({ ...current, email: event.target.value }))}
          />
        </div>

        <PasswordField
          id="password"
          label="Password"
          placeholder="Enter your password"
          autoComplete="current-password"
          value={login.password}
          onChange={(event) => setLogin((current) => ({ ...current, password: event.target.value }))}
        />

        <div className="row">
          <label className="checkbox">
            <input
              type="checkbox"
              name="remember"
              checked={login.remember}
              onChange={(event) => setLogin((current) => ({ ...current, remember: event.target.checked }))}
            />
            Remember me
          </label>
          <button className="link link-button" type="button" onClick={() => onShowToast('Password reset flow would open here.', 'info')}>
            Forgot password?
          </button>
        </div>

        <div className="actions">
          <button type="submit" className={`primary-btn ${loading === 'login' ? 'loading' : ''}`}>
            {loading === 'login' ? 'Signing in...' : 'Sign in'}
          </button>

          <div className="divider">
            <span>Or continue with</span>
          </div>

          <div className="social-grid">
            <a className="social-btn" href={googleOAuthLoginUrl()} aria-label="Continue with Google">
              <GoogleIcon />
            </a>
          </div>
        </div>
      </div>
    </form>
  );
}
