export function OnevoLogo({ className = '' }) {
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

export function EyeIcon({ visible }) {
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

export function GoogleIcon() {
  return (
    <svg viewBox="0 0 533.5 544.3" aria-hidden="true">
      <path fill="#4285f4" d="M533.5 278.4c0-17.4-1.4-34.1-4-50.4H272.1v95.5h146.5c-6.3 34-25.2 62.9-53.9 82.3v68.2h87.1c50.9-46.9 80.7-116 80.7-195.6z" />
      <path fill="#34a853" d="M272.1 544.3c72.6 0 133.6-24.1 178.1-65.5l-87.1-68.2c-24.2 16.2-55.2 25.8-91 25.8-69.9 0-129.2-47.2-150.4-110.6H33.3v69.3c44.6 88.5 136.8 149.2 238.8 149.2z" />
      <path fill="#fbbc04" d="M121.7 328.3c-10.4-31.2-10.4-64.5 0-95.7V163.3H33.3c-44.8 87.9-44.8 192.9 0 280.8l88.4-68.2z" />
      <path fill="#ea4335" d="M272.1 107.3c39.5 0 75 13.6 103 40.4l77.2-77.2C405.8 24.9 344.8 0 272.1 0 170.1 0 77.9 60.8 33.3 149.3l88.4 69.3C142.9 154.5 202.2 107.3 272.1 107.3z" />
    </svg>
  );
}
