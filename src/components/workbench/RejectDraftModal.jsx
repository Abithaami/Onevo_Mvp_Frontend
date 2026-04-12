import './workbench.css';

/**
 * Shared destructive confirmation for rejecting a draft — dashboard workbench + approval queue.
 */
export default function RejectDraftModal({ open, title, onCancel, onConfirm }) {
  if (!open) {
    return null;
  }

  return (
    <div className="wb-modal-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="wb-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wb-reject-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="wb-reject-title" className="wb-modal-title">
          Reject this draft?
        </h2>
        <p className="wb-modal-body">This will discard &quot;{title}&quot;. You can&apos;t undo this from the queue.</p>
        <div className="wb-modal-actions">
          <button type="button" className="wb-modal-btn wb-modal-btn--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="wb-modal-btn wb-modal-btn--danger" onClick={onConfirm}>
            Reject draft
          </button>
        </div>
      </div>
    </div>
  );
}
