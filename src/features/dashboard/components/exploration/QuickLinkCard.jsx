import { Link } from 'react-router-dom';

export default function QuickLinkCard({ label, description, to }) {
  return (
    <Link className="db-quick-link" to={to}>
      <span className="db-quick-link-label">{label}</span>
      <span className="db-quick-link-desc">{description}</span>
    </Link>
  );
}
