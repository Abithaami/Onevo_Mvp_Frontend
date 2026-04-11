export default function SourceLogo({ id, name }) {
  if (id === 'instagram') {
    return (
      <svg className="source-logo" viewBox="0 0 64 64" role="img" aria-label={`${name} logo`}>
        <defs>
          <linearGradient id="instagramGradient" x1="12" y1="56" x2="54" y2="10" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FEDA75" />
            <stop offset="0.28" stopColor="#FA7E1E" />
            <stop offset="0.52" stopColor="#D62976" />
            <stop offset="0.75" stopColor="#962FBF" />
            <stop offset="1" stopColor="#4F5BD5" />
          </linearGradient>
        </defs>
        <rect x="10" y="10" width="44" height="44" rx="13" fill="url(#instagramGradient)" />
        <circle cx="32" cy="32" r="10" fill="none" stroke="#FFFFFF" strokeWidth="4" />
        <circle cx="45" cy="19" r="3" fill="#FFFFFF" />
      </svg>
    );
  }

  if (id === 'facebook') {
    return (
      <svg className="source-logo" viewBox="0 0 64 64" role="img" aria-label={`${name} logo`}>
        <circle cx="32" cy="32" r="24" fill="#1877F2" />
        <path
          d="M37.9 33.5h-4.2V49h-6.4V33.5h-3.2v-5.4h3.2v-3.3c0-4.6 2.8-7.2 7.1-7.2 2 0 4.1.4 4.1.4v4.7h-2.3c-2.3 0-2.5 1.2-2.5 2.8v2.6h4.7l-.5 5.4Z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  if (id === 'google-business') {
    return (
      <svg className="source-logo" viewBox="0 0 64 64" role="img" aria-label={`${name} logo`}>
        <path d="M14 25h36l-3-10H17l-3 10Z" fill="#4285F4" />
        <path d="M14 25h9v9a4.5 4.5 0 0 1-9 0v-9Z" fill="#EA4335" />
        <path d="M23 25h9v9a4.5 4.5 0 0 1-9 0v-9Z" fill="#FBBC04" />
        <path d="M32 25h9v9a4.5 4.5 0 0 1-9 0v-9Z" fill="#34A853" />
        <path d="M41 25h9v9a4.5 4.5 0 0 1-9 0v-9Z" fill="#4285F4" />
        <path d="M18 36h28v14H18V36Z" fill="#FFFFFF" />
        <path d="M23 41h9v9h-9v-9Z" fill="#D7FBF5" />
        <path d="M36 41h6v9h-6v-9Z" fill="#D7FBF5" />
        <path d="M18 36h28v14H18V36Z" fill="none" stroke="#D8E8E7" strokeWidth="2" />
      </svg>
    );
  }

  if (id === 'website') {
    return (
      <svg className="source-logo" viewBox="0 0 64 64" role="img" aria-label={`${name} logo`}>
        <circle cx="32" cy="32" r="23" fill="#0EA5A4" />
        <path d="M10 32h44M32 9c7 7 10 14 10 23s-3 16-10 23M32 9c-7 7-10 14-10 23s3 16 10 23" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }

  if (id === 'pos') {
    return (
      <svg className="source-logo" viewBox="0 0 64 64" role="img" aria-label={`${name} logo`}>
        <rect x="14" y="12" width="36" height="40" rx="8" fill="#3B82F6" />
        <rect x="20" y="18" width="24" height="12" rx="3" fill="#D7FBF5" />
        <path d="M22 38h20M22 44h14" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg className="source-logo" viewBox="0 0 64 64" role="img" aria-label={`${name} logo`}>
      <rect x="13" y="12" width="38" height="40" rx="8" fill="#FF6B5A" />
      <path d="M32 40V21M24 29l8-8 8 8M22 46h20" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
