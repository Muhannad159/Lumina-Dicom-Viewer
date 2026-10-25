import { formatDate } from '../dicom/catalog';
import type { ViewportHandle } from './types';
export default function ViewerFooter({
  studyCount,
  handle,
}: {
  studyCount: number;
  handle?: ViewportHandle;
}) {
  return (
    <footer className="flex min-h-8 shrink-0 items-center justify-between gap-4 border-t border-line px-3 text-[9px] text-muted">
      <span className="flex items-center gap-2">
        <i className="size-1.5 rounded-full bg-accent" />
        Local session · {studyCount} {studyCount === 1 ? 'study' : 'studies'}
      </span>
      <span className="hidden lg:inline portrait:hidden">
        Wheel to scroll · Right-drag to zoom · Middle-drag to pan
      </span>
      <span className="mr-44 hidden md:inline">
        {handle
          ? `${handle.series.modality} · ${formatDate(handle.study.date)}`
          : 'Select a series'}
      </span>
    </footer>
  );
}
