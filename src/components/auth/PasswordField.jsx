import { useState } from 'react';
import { EyeIcon } from './AuthIcons.jsx';

export default function PasswordField({ id, label, placeholder, autoComplete, value, onChange, disabled }) {
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
          required={!disabled}
          autoComplete={autoComplete}
          aria-required={!disabled}
          value={value}
          onChange={onChange}
          disabled={disabled}
          aria-disabled={disabled ? 'true' : undefined}
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
