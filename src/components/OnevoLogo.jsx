export default function OnevoLogo({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="logoGradient" x1="34" y1="20" x2="128" y2="145" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7DE2FF" />
          <stop offset="0.34" stopColor="#218EE7" />
          <stop offset="0.72" stopColor="#213EA4" />
          <stop offset="1" stopColor="#79E6FF" />
        </linearGradient>
        <linearGradient id="logoHighlight" x1="48" y1="28" x2="111" y2="74" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" stopOpacity="0.52" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M31 96C20 54 53 18 96 21c32 2 58 23 67 52 2 7-7 11-12 6-13-14-31-22-52-22-28 0-50 14-60 36-2 5-6 8-11 8-2 0-5-1-7-2Z"
        fill="url(#logoGradient)"
      />
      <path
        d="M129 64c11 42-22 78-65 75-32-2-58-23-67-52-2-7 7-11 12-6 13 14 31 22 52 22 28 0 50-14 60-36 2-5 6-8 11-8 2 0 5 1 7 2Z"
        fill="url(#logoGradient)"
      />
      <path d="M52 42c21-12 50-12 72 2" stroke="url(#logoHighlight)" strokeWidth="8" strokeLinecap="round" opacity="0.85" />
      <path d="M36 91c-5-30 10-54 34-64" stroke="#8BEAFF" strokeWidth="4" strokeLinecap="round" opacity="0.32" />
      <path d="M124 69c5 30-10 54-34 64" stroke="#B8F4FF" strokeWidth="4" strokeLinecap="round" opacity="0.28" />
    </svg>
  );
}
