export default function AttentionBanner({ title, body }) {
  return (
    <div className="db-attention-banner">
      <p className="db-attention-banner-eyebrow">First focus</p>
      <h2 className="db-attention-banner-title">{title}</h2>
      <p className="db-attention-banner-body">{body}</p>
    </div>
  );
}
