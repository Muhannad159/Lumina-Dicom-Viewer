import { ChevronDown, ChevronRight } from 'lucide-react';
import type { LocalStudy } from '../dicom/types';
import { formatDate } from '../dicom/catalog';
import SeriesCard from './SeriesCard';
export default function StudyGroup({
  study,
  collapsed,
  onToggle,
  selectedSeries,
  onSelect,
}: {
  study: LocalStudy;
  collapsed: boolean;
  onToggle: () => void;
  selectedSeries: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <section
      data-testid="study-group"
      className="border-b border-line compact:flex compact:shrink-0 compact:items-center compact:border-r compact:border-b-0"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        className="flex w-full items-start gap-1.5 px-3 py-3.5 text-left compact:w-44 compact:shrink-0 compact:items-center compact:py-2"
      >
        {collapsed ? (
          <ChevronRight size={15} className="mt-0.5 shrink-0 text-accent compact:hidden" />
        ) : (
          <ChevronDown size={15} className="mt-0.5 shrink-0 text-accent compact:hidden" />
        )}
        <span className="grid min-w-0 gap-1 compact:gap-0.5">
          <strong className="truncate text-xs font-medium compact:text-[10px]">
            {study.patientName}
          </strong>
          <span className="truncate text-[11px] text-muted compact:text-[9px]">
            {study.description}
          </span>
          <small className="text-[9px] text-faint compact:text-[8px]">
            {formatDate(study.date)} · {study.series.length} series
            {study.patientId ? ` · ${study.patientId}` : ''}
          </small>
        </span>
        <ChevronRight
          size={20}
          className={`hidden shrink-0 text-accent compact:block ${collapsed ? '' : 'rotate-180'}`}
        />
      </button>
      {!collapsed && (
        <div
          data-testid="series-list"
          className="flex flex-col gap-2 px-3 pb-3 compact:shrink-0 compact:flex-row compact:gap-1.5 compact:px-2 compact:py-2"
        >
          {study.series.map((series) => (
            <SeriesCard
              key={series.id}
              series={series}
              selected={series.id === selectedSeries}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </section>
  );
}
