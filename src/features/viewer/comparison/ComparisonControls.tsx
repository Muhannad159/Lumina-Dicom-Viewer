import { PanelsTopLeft } from 'lucide-react';
import Popover from '../../../components/Popover';
import type { ViewportLinks } from './useViewportLinks';
import type { Availability } from '../availability';
export interface ComparisonControlsProps {
  links: ViewportLinks;
  onToggleLink: (key: keyof ViewportLinks) => void;
  availability: Availability;
  options: Record<keyof ViewportLinks, Availability>;
}
export default function ComparisonControls({
  links,
  onToggleLink,
  availability,
  options,
}: ComparisonControlsProps) {
  const choices = [
    ['windowLevel', 'Link window / level'],
    ['zoomPan', 'Link zoom / pan'],
    ['slices', 'Link spatial slices'],
    ['referenceLines', 'Reference lines'],
  ] as const;
  return (
    <Popover
      label="Sync views"
      disabled={!availability.enabled}
      disabledReason={availability.reason}
      className={Object.values(links).some(Boolean) ? 'text-accent bg-accent-soft' : undefined}
      trigger={
        <>
          <PanelsTopLeft size={18} />
          <span className="hidden xl:inline">Sync Views</span>
        </>
      }
    >
      {() => (
        <>
          <p className="px-2 py-2 text-xs font-medium">Follow the active viewport</p>
          {choices.map(([key, label]) => (
            <label
              key={key}
              title={options[key].reason}
              className="flex min-h-11 items-center gap-3 rounded px-2 text-xs hover:bg-accent-soft has-disabled:opacity-40"
            >
              <input
                type="checkbox"
                checked={links[key]}
                disabled={!options[key].enabled}
                aria-description={options[key].reason}
                onChange={() => onToggleLink(key)}
                className="size-4 accent-accent"
              />
              {label}
            </label>
          ))}
        </>
      )}
    </Popover>
  );
}
