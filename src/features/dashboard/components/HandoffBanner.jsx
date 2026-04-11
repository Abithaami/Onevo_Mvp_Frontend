export default function HandoffBanner({ title, body, onDismiss }) {
  return (
    <div className="db-handoff" role="status">
      <div className="db-handoff-inner">
        <p className="db-handoff-title">{title}</p>
        <p className="db-handoff-body">{body}</p>
      </div>
      {onDismiss ? (
        <button type="button" className="db-handoff-dismiss" onClick={onDismiss}>
          Got it
        </button>
      ) : null}
    </div>
  );
}
