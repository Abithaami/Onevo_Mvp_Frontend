export const navItems = [
  { href: '#home', label: 'Home' },
  { href: '#about', label: 'About' },
  { href: '#services', label: 'Services' },
  { href: '#plans', label: 'Plans' },
  { href: '#stories', label: 'Stories' },
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

/** Step 3 — social networks only (Facebook, Instagram, LinkedIn). */
export const socialMediaSources = [
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
    id: 'linkedin',
    name: 'LinkedIn',
    type: 'Social',
    description: 'Pull in company page updates, comments, and professional audience signals.',
    signal: 'Page posts, comments, messages',
    recommended: true,
  },
];

/** Step 2 — business systems to connect when available. */
export const growthIntegrationSources = [
  {
    id: 'google-business',
    name: 'Google Business Profile',
    type: 'Local & reviews',
    description: 'Reviews, maps visibility, and profile activity.',
    signal: 'Reviews, profile activity',
  },
  {
    id: 'pos',
    name: 'POS system',
    type: 'Operations',
    description: 'Sales and visit patterns from your point of sale.',
    signal: 'Sales, receipts, visits',
  },
  {
    id: 'booking',
    name: 'Booking system',
    type: 'Operations',
    description: 'Appointments, reservations, and capacity signals.',
    signal: 'Bookings, cancellations',
  },
];
