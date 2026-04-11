import { useState } from 'react';
import { EyeIcon } from './AuthIcons.jsx';

export default function PasswordField({ id, label, placeholder, autoComplete, value, onChange }) {
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
