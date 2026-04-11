import { services } from '../../../data/onevoData';

export default function LandingServicesSection() {
  return (
    <section className="section services-section" id="services" aria-labelledby="services-title">
      <div className="section-heading centered">
        <p className="eyebrow">Services</p>
        <h2 id="services-title">
          From incoming noise to <span>guided decisions.</span>
        </h2>
        <p>Onevo keeps the operating loop simple: capture, rank, recommend, approve, learn.</p>
      </div>
      <div className="service-grid">
        {services.map((service) => (
          <article className="service-card" key={service.title}>
            <strong>{service.stat}</strong>
            <h3>{service.title}</h3>
            <p>{service.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
