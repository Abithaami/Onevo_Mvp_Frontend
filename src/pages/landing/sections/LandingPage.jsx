import LandingAboutSection from './LandingAboutSection';
import LandingHeroSection from './LandingHeroSection';
import LandingPlansSection from './LandingPlansSection';
import LandingReviewsSection from './LandingReviewsSection';
import LandingServicesSection from './LandingServicesSection';
import LandingStoriesSection from './LandingStoriesSection';

export default function LandingPage({ onOpenLogin }) {
  return (
    <main id="home">
      <LandingHeroSection onOpenLogin={onOpenLogin} />
      <LandingAboutSection />
      <LandingServicesSection />
      <LandingPlansSection onOpenLogin={onOpenLogin} />
      <LandingStoriesSection />
      <LandingReviewsSection />
    </main>
  );
}
