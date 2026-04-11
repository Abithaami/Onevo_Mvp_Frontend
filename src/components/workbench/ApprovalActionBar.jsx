const LABELS = {
  approve: 'Approve',
  edit: 'Edit',
  reject: 'Reject',
  details: 'Details',
  later: 'Save for later'
};

export default function ApprovalActionBar({ actions, onAction }) {
  return (
    <div className="db-approval-bar" role="toolbar" aria-label="Approval actions">
      {actions.map((key) => (
        <button
          key={key}
          type="button"
          className={`db-approval-btn db-approval-btn--${key === 'reject' ? 'danger' : key === 'approve' ? 'primary' : 'ghost'}`}
          onClick={() => onAction?.(key)}
        >
          {LABELS[key] ?? key}
        </button>
      ))}
    </div>
  );
}
