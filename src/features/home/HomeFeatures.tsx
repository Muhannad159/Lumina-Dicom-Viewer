import { HardDrive, Layers3, Monitor } from 'lucide-react';
const features = [
  {
    Icon: Layers3,
    title: 'Order, automatically',
    description: 'Studies and series, neatly organized using the information in your images.',
  },
  {
    Icon: Monitor,
    title: 'Space to see more',
    description: 'Flexible layouts and familiar tools. From your desktop to your phone.',
  },
  {
    Icon: HardDrive,
    title: 'Local from the start',
    description: 'No account. No uploads. Just you and the images you choose to open.',
  },
];
export default function HomeFeatures() {
  return (
    <section
      aria-label="Workspace features"
      className="relative mx-auto my-9 grid max-w-80 gap-6 md:my-12 md:max-w-[970px] md:grid-cols-3 md:gap-8"
    >
      {features.map(({ Icon, title, description }) => (
        <article key={title} className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-line bg-accent-soft text-accent">
            <Icon size={20} />
          </span>
          <div>
            <h3 className="mt-0.5 mb-2 text-xs font-medium">{title}</h3>
            <p className="text-[11px] leading-5 text-muted">{description}</p>
          </div>
        </article>
      ))}
    </section>
  );
}
