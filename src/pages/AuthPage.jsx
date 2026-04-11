import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm.jsx';
import RegisterForm from '../components/auth/RegisterForm.jsx';
import ToastAlert from '../components/auth/ToastAlert.jsx';
import { OnevoLogo } from '../components/auth/AuthIcons.jsx';

const POST_AUTH_REDIRECT_MS = 900;

export default function AuthPage() {
  const navigate = useNavigate();
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
      window.setTimeout(() => navigate('/app/dashboard', { replace: true }), POST_AUTH_REDIRECT_MS);
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
      showToast('Account created! Taking you to onboarding…', 'success');
      window.setTimeout(() => navigate('/app/onboarding', { replace: true }), POST_AUTH_REDIRECT_MS);
    }, 1200);
  }

  return (
    <>
      <a href="/" className="brand" aria-label="Onevo Home">
        <OnevoLogo />
        <span>Onevo</span>
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
              <LoginForm login={login} setLogin={setLogin} loading={loading} onSubmit={handleLoginSubmit} onShowToast={showToast} />
            ) : (
              <RegisterForm register={register} setRegister={setRegister} loading={loading} onSubmit={handleRegisterSubmit} />
            )}
          </div>
        </section>
      </main>

      <ToastAlert toast={toast} />
    </>
  );
}
