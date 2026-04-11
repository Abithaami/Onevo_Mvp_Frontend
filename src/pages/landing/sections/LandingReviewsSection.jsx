import { reviews } from '../../../data/onevoData';

export default function LandingReviewsSection() {
  return (
    <section className="section review-section" aria-labelledby="review-title">
      <div className="section-heading centered">
        <p className="eyebrow">Review</p>
        <h2 id="review-title">
          Teams stay in control <span>before action.</span>
        </h2>
      </div>
      <div className="review-grid">
        {reviews.map((review) => (
          <article className="review-card" key={review.name}>
            <span className="quote-mark" aria-hidden="true">
              "
            </span>
            <p>{review.quote}</p>
            <div>
              <h3>{review.name}</h3>
              <small>{review.role}</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
