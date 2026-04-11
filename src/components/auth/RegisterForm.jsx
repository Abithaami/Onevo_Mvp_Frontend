import PasswordField from './PasswordField.jsx';

export default function RegisterForm({ register, setRegister, loading, onSubmit }) {
  return (
    <form id="registerForm" autoComplete="on" role="tabpanel" aria-labelledby="tab-register" onSubmit={onSubmit}>
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
  );
}
