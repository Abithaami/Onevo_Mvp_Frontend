import { plans } from '../../../data/onevoData';

export default function LandingPlansSection({ onOpenLogin }) {
  return (
    <section className="section plans-section" id="plans" aria-labelledby="plans-title">
      <div className="section-heading centered">
        <p className="eyebrow">Plans</p>
        <h2 id="plans-title">
          Choose a plan for your <span>growth rhythm.</span>
        </h2>
      </div>
      <div className="plans-grid">
        {plans.map((plan) => (
          <article className={`plan-card ${plan.featured ? 'featured' : ''}`} key={plan.name}>
            <h3>{plan.name}</h3>
            <p className="price">
              {plan.price}
              <span>/mo</span>
            </p>
            <ul>
              {plan.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <button type="button" onClick={onOpenLogin} className={plan.featured ? 'primary-btn' : 'secondary-btn'}>
              Choose plan
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
