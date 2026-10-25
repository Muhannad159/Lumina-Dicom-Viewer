import type { LocalSeries } from '../dicom/types';
import Thumbnail from './Thumbnail';
import { cn } from '../../lib/classes';
export default function SeriesCard({
  series,
  selected,
  onSelect,
}: {
  series: LocalSeries;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      data-testid="series-card"
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData('application/x-dicom-series', series.id);
        event.dataTransfer.effectAllowed = 'copy';
      }}
      onClick={() => onSelect(series.id)}
      aria-pressed={selected}
      title={series.description}
      className={cn(
        'flex min-w-0 items-center gap-2.5 rounded-lg border p-2 text-left compact:w-40 compact:shrink-0 compact:gap-2 compact:p-1.5',
        selected
          ? 'border-accent bg-accent-soft'
          : 'border-line bg-background hover:border-accent/50',
      )}
    >
      <Thumbnail series={series} />
      <span className="flex min-w-0 flex-col gap-1.5 compact:gap-1">
        <strong className="line-clamp-2 text-[11px] leading-4 font-normal compact:text-[10px]">
          {series.description}
        </strong>
        <small className="text-[9px] text-muted">
          #{series.number ?? '—'} · {series.frameCount}{' '}
          {series.frameCount === 1 ? 'image' : 'images'}
        </small>
      </span>
    </button>
  );
}
