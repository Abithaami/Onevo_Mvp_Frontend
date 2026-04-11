import { stories } from '../../../data/onevoData';

export default function LandingStoriesSection() {
  return (
    <section className="section stories-section" id="stories" aria-labelledby="stories-title">
      <div className="section-heading">
        <p className="eyebrow">Stories</p>
        <h2 id="stories-title">
          Follow the signal from <span>attention to outcome.</span>
        </h2>
      </div>
      <div className="story-grid">
        {stories.map((story) => (
          <article className="story-card" key={story.title}>
            <img src={story.image} alt="" width="900" height="620" loading="lazy" />
            <div className="story-overlay">
              <h3>{story.title}</h3>
              <p>{story.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
