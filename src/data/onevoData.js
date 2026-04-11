export const navItems = [
  { href: '#home', label: 'Home' },
  { href: '#about', label: 'About' },
  { href: '#services', label: 'Services' },
  { href: '#plans', label: 'Plans' },
  { href: '#stories', label: 'Stories' },
  // { href: '#connections', label: 'Connect', page: 'connections' },
  { href: '#contact', label: 'Contact' },
  { href: '#access', label: 'Login', page: 'login' },
];

export const services = [
  {
    title: 'Signal capture',
    text: 'Gather customer comments, conversations, inbox notes, and manual inputs into one clean queue.',
    stat: '12 sources',
  },
  {
    title: 'Opportunity ranking',
    text: 'Bring high-intent buyers, urgent replies, and repeatable growth chances to the top.',
    stat: 'Priority first',
  },
  {
    title: 'Next best action',
    text: 'Review practical recommendations with rationale before anything moves forward.',
    stat: 'Approval ready',
  },
  {
    title: 'Outcome learning',
    text: 'Track what happened after each action so future guidance keeps improving.',
    stat: 'Closed loop',
  },
];

export const plans = [
  {
    name: 'Starter',
    price: '$49',
    items: ['Signal inbox', 'Opportunity summary', 'Google Auth access', 'Weekly insight snapshot'],
  },
  {
    name: 'Growth',
    price: '$149',
    featured: true,
    items: ['Priority recommendations', 'Approval queue', 'Conversation discovery', 'Outcome tracking'],
  },
  {
    name: 'Scale',
    price: '$299',
    items: ['Multi-user review', 'Content approval flow', 'Admin oversight', 'Learning reports'],
  },
];

export const stories = [
  {
    title: 'Missed inquiries become reviewable opportunities',
    image: 'https://images.unsplash.com/photo-1552581234-26160f608093?auto=format&fit=crop&w=900&q=80',
    text: 'Onevo keeps urgent buying signals visible before they disappear in busy channels.',
  },
  {
    title: 'Recommendations stay tied to clear reasons',
    image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=80',
    text: 'Every suggested step carries enough context for a business owner to approve with confidence.',
  },
  {
    title: 'Teams learn what actually converts',
    image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80',
    text: 'Closed outcomes help the next recommendation become sharper and more useful.',
  },
];

export const reviews = [
  {
    name: 'Maya Fernando',
    role: 'Boutique owner',
    quote: 'The approval queue helped us reply faster without losing control of the message.',
  },
  {
    name: 'Kavin Perera',
    role: 'Agency lead',
    quote: 'The team finally sees which conversations deserve attention today.',
  },
  {
    name: 'Nora Silva',
    role: 'Cafe operator',
    quote: 'Onevo made scattered comments feel like a real growth pipeline.',
  },
];

export const socialSources = [
  {
    id: 'instagram',
    name: 'Instagram',
    type: 'Social',
    description: 'Collect comments, mentions, post signals, and audience engagement patterns.',
    signal: 'Comments, DMs, engagement',
    recommended: true,
  },
  {
    id: 'facebook',
    name: 'Facebook',
    type: 'Social',
    description: 'Bring page interactions, inquiries, and campaign responses into Onevo.',
    signal: 'Page messages, comments',
    recommended: true,
  },
  {
    id: 'google-business',
    name: 'Google Business Profile',
    type: 'Local discovery',
    description: 'Use reviews, visibility, and customer discovery signals for local growth.',
    signal: 'Reviews, profile activity',
    recommended: true,
  },
  {
    id: 'website',
    name: 'Website',
    type: 'Owned channel',
    description: 'Capture contact intent, page interest, and lead-form context.',
    signal: 'Forms, traffic, intent',
  },
  {
    id: 'pos',
    name: 'POS or booking data',
    type: 'Operations',
    description: 'Add bookings, sales patterns, repeat visits, and slow-period signals.',
    signal: 'Sales, bookings, repeat visits',
  },
  {
    id: 'manual-upload',
    name: 'Manual uploads',
    type: 'Fallback',
    description: 'Upload notes or CSV exports when platform integrations are not ready yet.',
    signal: 'CSV, notes, exports',
  },
];
