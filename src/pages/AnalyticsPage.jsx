/**
 * Analytics is not part of the MVP; this route shows a workspace-style placeholder only.
 * No published-post or LinkedIn analytics API calls are made from this page.
 */
export default function AnalyticsPage() {
  return (
    <div className="analytics-page-placeholder" aria-label="Analytics">
      <section className="dashboard-placeholder" aria-labelledby="analytics-placeholder-title">
        <h1 id="analytics-placeholder-title">Coming soon</h1>
        <p>This part of the workspace is not available in the MVP yet.</p>
      </section>
    </div>
  );
}
