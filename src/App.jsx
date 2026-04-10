import { useState } from 'react';

function OnevoLogo({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="logoGradient" x1="10" y1="20" x2="150" y2="140" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5DA5FF" />
          <stop offset="1" stopColor="#1E58D4" />
        </linearGradient>
      </defs>
      <path
        d="M80 12c20 0 38 7 52 19 14 12 23 29 25 49-8-5-17-8-27-9-8-19-27-32-49-32-29 0-53 24-53 53 0 22 13 41 32 49-1 10-4 19-9 27-20-2-37-11-49-25C19 118 12 100 12 80 12 38 38 12 80 12Z"
        fill="url(#logoGradient)"
        opacity="0.95"
      />
      <path
        d="M80 148c-20 0-38-7-52-19-14-12-23-29-25-49 8 5 17 8 27 9 8 19 27 32 49 32 29 0 53-24 53-53 0-22-13-41-32-49 1-10 4-19 9-27 20 2 37 11 49 25 12 14 19 32 19 52 0 42-26 68-68 68Z"
        fill="url(#logoGradient)"
        opacity="0.85"
      />
    </svg>
  );
}

function EyeIcon({ visible }) {
  if (visible) {
    return (
      <svg className="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }

  return (
    <svg className="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 533.5 544.3" aria-hidden="true">
      <path fill="#4285f4" d="M533.5 278.4c0-17.4-1.4-34.1-4-50.4H272.1v95.5h146.5c-6.3 34-25.2 62.9-53.9 82.3v68.2h87.1c50.9-46.9 80.7-116 80.7-195.6z" />
      <path fill="#34a853" d="M272.1 544.3c72.6 0 133.6-24.1 178.1-65.5l-87.1-68.2c-24.2 16.2-55.2 25.8-91 25.8-69.9 0-129.2-47.2-150.4-110.6H33.3v69.3c44.6 88.5 136.8 149.2 238.8 149.2z" />
      <path fill="#fbbc04" d="M121.7 328.3c-10.4-31.2-10.4-64.5 0-95.7V163.3H33.3c-44.8 87.9-44.8 192.9 0 280.8l88.4-68.2z" />
      <path fill="#ea4335" d="M272.1 107.3c39.5 0 75 13.6 103 40.4l77.2-77.2C405.8 24.9 344.8 0 272.1 0 170.1 0 77.9 60.8 33.3 149.3l88.4 69.3C142.9 154.5 202.2 107.3 272.1 107.3z" />
    </svg>
  );
}

function PasswordField({ id, label, placeholder, autoComplete, value, onChange }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="input-wrapper">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          name="password"
          placeholder={placeholder}
          required
          autoComplete={autoComplete}
          aria-required="true"
          value={value}
          onChange={onChange}
        />
        <button
          type="button"
          className="password-toggle"
          aria-label={visible ? 'Hide password' : 'Show password'}
          onClick={() => setVisible((current) => !current)}
        >
          <EyeIcon visible={visible} />
        </button>
      </div>
    </div>
  );
}

function Toast({ toast }) {
  if (!toast) {
    return null;
  }

  return (
    <div className={`toast-alert toast-alert--${toast.type}`} role="status" aria-live="polite">
      {toast.message}
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState('sign-in');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(null);
  const [login, setLogin] = useState({ email: '', password: '', remember: false });
  const [register, setRegister] = useState({ fullName: '', email: '', password: '', terms: false });

  function showToast(message, type = 'info') {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 4000);
  }

  function selectMode(nextMode) {
    setMode(nextMode);
    setToast(null);
  }

  function handleLoginSubmit(event) {
    event.preventDefault();

    if (!login.email.trim() || !login.password.trim()) {
      showToast('Please enter both email and password.', 'error');
      return;
    }

    setLoading('login');
    window.setTimeout(() => {
      setLoading(null);
      showToast('Login successful! Redirecting...', 'success');
    }, 1200);
  }

  function handleRegisterSubmit(event) {
    event.preventDefault();

    if (!register.fullName.trim() || !register.email.trim() || !register.password.trim()) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    if (register.password.length < 8) {
      showToast('Password must be at least 8 characters long.', 'error');
      return;
    }

    if (!register.terms) {
      showToast('Please agree to the Terms of Service.', 'error');
      return;
    }

    setLoading('register');
    window.setTimeout(() => {
      setLoading(null);
      showToast('Account created successfully!', 'success');
    }, 1200);
  }

  return (
    <>
      <a href="/" className="brand" aria-label="Onevo Home">
        <OnevoLogo />
        <span>ONEVO</span>
      </a>

      <main className="page" aria-label="Authentication page">
        <section className="hero">
          <h1>
            <span className="accent">Onevo</span> turns signals into action
          </h1>
          <p>Bring goals, insights, and next steps into one focused workspace so your team always knows what to do next.</p>
          <small>Signal-to-action workspace</small>
        </section>

        <section className="card" role="main" aria-label="Login and registration form">
          <div className="panel">
            <div className="tabs" role="tablist" aria-label="Authentication mode">
              <button
                className={`tab ${mode === 'sign-in' ? 'active' : ''}`}
                type="button"
                role="tab"
                aria-selected={mode === 'sign-in'}
                aria-controls="login-panel"
                id="tab-login"
                onClick={() => selectMode('sign-in')}
              >
                Sign in
              </button>
              <button
                className={`tab ${mode === 'create-account' ? 'active' : ''}`}
                type="button"
                role="tab"
                aria-selected={mode === 'create-account'}
                aria-controls="register-panel"
                id="tab-register"
                onClick={() => selectMode('create-account')}
              >
                Create account
              </button>
            </div>

            {mode === 'sign-in' ? (
              <form id="loginForm" autoComplete="on" role="tabpanel" aria-labelledby="tab-login" onSubmit={handleLoginSubmit}>
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
                    <button className="link link-button" type="button" onClick={() => showToast('Password reset flow would open here.', 'info')}>
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
                      <a className="social-btn" href="/api/auth/google/login" aria-label="Continue with Google">
                        <GoogleIcon />
                      </a>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <form id="registerForm" autoComplete="on" role="tabpanel" aria-labelledby="tab-register" onSubmit={handleRegisterSubmit}>
                <div className="form-shell" id="register-panel">
                  <div className="field">
                    <label htmlFor="fullName">Full Name</label>
                    <input
                      id="fullName"
                      type="text"
                      name="fullName"
                      placeholder="John Doe"
                      required
                      autoComplete="name"
                      aria-required="true"
                      value={register.fullName}
                      onChange={(event) => setRegister((current) => ({ ...current, fullName: event.target.value }))}
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="registerEmail">Email Address</label>
                    <input
                      id="registerEmail"
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      required
                      autoComplete="username"
                      aria-required="true"
                      value={register.email}
                      onChange={(event) => setRegister((current) => ({ ...current, email: event.target.value }))}
                    />
                  </div>

                  <PasswordField
                    id="registerPassword"
                    label="Password"
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                    value={register.password}
                    onChange={(event) => setRegister((current) => ({ ...current, password: event.target.value }))}
                  />

                  <div className="field">
                    <label className="checkbox">
                      <input
                        type="checkbox"
                        name="terms"
                        required
                        checked={register.terms}
                        onChange={(event) => setRegister((current) => ({ ...current, terms: event.target.checked }))}
                      />
                      <span>
                        I agree to the{' '}
                        <a className="link" href="/" onClick={(event) => event.preventDefault()}>
                          Terms of Service
                        </a>{' '}
                        and{' '}
                        <a className="link" href="/" onClick={(event) => event.preventDefault()}>
                          Privacy Policy
                        </a>
                      </span>
                    </label>
                  </div>

                  <div className="actions">
                    <button type="submit" className={`primary-btn ${loading === 'register' ? 'loading' : ''}`}>
                      {loading === 'register' ? 'Creating account...' : 'Create account'}
                    </button>
                  </div>

                  <p className="terms">
                    By creating an account, you agree to our
                    <br />
                    <a href="/" onClick={(event) => event.preventDefault()}>
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="/" onClick={(event) => event.preventDefault()}>
                      Privacy Policy
                    </a>
                  </p>
                </div>
              </form>
            )}
          </div>
        </section>
      </main>

      <Toast toast={toast} />
    </>
  );
}
