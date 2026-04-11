import ApprovalActionBar from './ApprovalActionBar.jsx';
import './workbench.css';

const TYPE_LABELS = {
  post_draft: 'Post draft',
  campaign: 'Campaign',
  reply: 'Reply',
  action: 'Action'
};

function formatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function RecommendationCard({ item, onAction }) {
  return (
    <article className={`db-rec-card ${item.urgency === 'high' ? 'db-rec-card--urgent' : ''}`} aria-label={item.title}>
      <header className="db-rec-card-header">
        <div>
          <p className="db-rec-card-meta">
            <span className="db-rec-chip">{TYPE_LABELS[item.type] ?? item.type}</span>
            {item.targetChannel ? <span className="db-rec-channel">{item.targetChannel}</span> : null}
          </p>
          <h3 className="db-rec-card-title">{item.title}</h3>
        </div>
        <time className="db-rec-time" dateTime={item.createdAt}>
          {formatTime(item.createdAt)}
        </time>
      </header>
      <p className="db-rec-summary">{item.summary}</p>
      <p className="db-rec-reason">
        <strong>Why this matters:</strong> {item.reason}
      </p>
      <div className="db-rec-preview">
        <p className="db-rec-preview-label">Preview</p>
        <p className="db-rec-preview-body">{item.previewContent}</p>
      </div>
      <ApprovalActionBar actions={item.actions} onAction={onAction} />
    </article>
  );
}
