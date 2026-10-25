import HomeHero from './HomeHero';
import DropZone from './DropZone';
import HomeFeatures from './HomeFeatures';
export default function HomePage() {
  return (
    <main
      data-testid="home-page"
      className="relative mx-auto max-w-[1600px] overflow-hidden px-5 pt-11 sm:px-[8%] sm:pt-16"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-[620px] size-[900px] rounded-full border border-hero-glow bg-radial from-hero-glow to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-25 -right-[660px] size-[900px] rounded-full border border-hero-glow"
      />
      <HomeHero />
      <DropZone />
      <HomeFeatures />
    </main>
  );
}
