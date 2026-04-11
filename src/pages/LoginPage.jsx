import { useState } from 'react';

function EyeIcon({ visible }) {
  if (visible) {
    return (
      <svg className="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }

  return (
    <svg className="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-.9 2.4-1.9 3.1l3.1 2.4c1.8-1.7 2.9-4.1 2.9-7 0-.8-.1-1.6-.2-2.3H12Z" />
      <path fill="#34A853" d="M6.4 14.3 5.7 15l-2.5 1.9C4.8 20.1 8.1 22 12 22c2.6 0 4.9-.9 6.5-2.4l-3.1-2.4c-.9.6-2 1-3.4 1-2.6 0-4.8-1.7-5.6-3.9Z" />
      <path fill="#FBBC05" d="M3.2 7.1C2.4 8.6 2 10.3 2 12s.4 3.4 1.2 4.9l3.2-2.5c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4L3.2 7.1Z" />
      <path fill="#4285F4" d="M12 5.8c1.4 0 2.7.5 3.7 1.5l2.8-2.8C16.8 2.9 14.6 2 12 2 8.1 2 4.8 3.9 3.2 7.1l3.2 2.5c.8-2.3 3-3.8 5.6-3.8Z" />
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
        <button type="button" className="password-toggle" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible((current) => !current)}>
          <EyeIcon visible={visible} />
        </button>
      </div>
    </div>
  );
}

function AuthPanel({ mode, selectMode, login, setLogin, register, setRegister, loading, showToast, handleLoginSubmit, handleRegisterSubmit }) {
  return (
    <section className="auth-panel" aria-label="Login and registration form">
      <div className="tabs" role="tablist" aria-label="Authentication mode">
        <button className={`tab ${mode === 'sign-in' ? 'active' : ''}`} type="button" role="tab" aria-selected={mode === 'sign-in'} aria-controls="login-panel" id="tab-login" onClick={() => selectMode('sign-in')}>
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
                <input type="checkbox" name="remember" checked={login.remember} onChange={(event) => setLogin((current) => ({ ...current, remember: event.target.checked }))} />
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
                <input type="checkbox" name="terms" required checked={register.terms} onChange={(event) => setRegister((current) => ({ ...current, terms: event.target.checked }))} />
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
    </section>
  );
}

export default function LoginPage({ mode, selectMode, login, setLogin, register, setRegister, loading, showToast, handleLoginSubmit, handleRegisterSubmit }) {
  return (
    <main className="login-page" id="access">
      <section className="section access-section" aria-labelledby="access-title">
        <div className="access-copy">
          <p className="eyebrow">Login</p>
          <h1 id="access-title">
            <span>Onevo</span> turns signals into action
          </h1>
          <p>Review what needs attention, approve the next step, and keep the learning loop moving.</p>
          <small>Signal-to-action workspace</small>
        </div>
        <AuthPanel
          mode={mode}
          selectMode={selectMode}
          login={login}
          setLogin={setLogin}
          register={register}
          setRegister={setRegister}
          loading={loading}
          showToast={showToast}
          handleLoginSubmit={handleLoginSubmit}
          handleRegisterSubmit={handleRegisterSubmit}
        />
      </section>
    </main>
  );
}
