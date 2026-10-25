import type { LocalInstance, LocalSeries, LocalStudy } from '../dicom/types';
import { formatDate } from '../dicom/catalog';
import { cn } from '../../lib/classes';
const base =
  'pointer-events-none absolute flex max-w-[43%] flex-col overflow-hidden text-[8px] leading-7/4 text-[#c8d6d3] text-shadow-sm text-shadow-black sm:text-[10px] [&_span]:truncate [&_strong]:font-medium [&_strong]:text-[#edf7f2]';
export default function ViewportOverlay({
  study,
  series,
  instance,
  index,
  total,
  voi,
  active,
}: {
  study: LocalStudy;
  series: LocalSeries;
  instance?: LocalInstance;
  index: number;
  total: number;
  voi: { width: number; level: number };
  active: boolean;
}) {
  return (
    <>
      <div data-testid="patient-overlay" className={cn(base, 'top-2 left-2 sm:top-3 sm:left-3')}>
        <strong>{study.patientName}</strong>
        <span>
          {study.patientId || 'No patient ID'}
          {instance?.patientSex ? ` · ${instance.patientSex}` : ''}
          {instance?.patientAge ? ` · ${instance.patientAge}` : ''}
        </span>
        <span>{study.description}</span>
      </div>
      <div
        data-testid="series-overlay"
        className={cn(base, 'top-2 right-9 text-right sm:top-3 sm:right-10')}
      >
        <strong>{series.modality}</strong>
        <span>{formatDate(study.date)}</span>
        <span>{series.description}</span>
      </div>
      <div data-testid="window-overlay" className={cn(base, 'bottom-3 left-2 sm:left-3')}>
        <span>
          W {voi.width} / L {voi.level}
        </span>
        <span>
          {instance?.columns} × {instance?.rows}
        </span>
      </div>
      <div className={cn(base, 'right-9 bottom-3 text-right sm:right-10')}>
        <strong data-testid="slice-counter">
          {index + 1} <span>/ {total}</span>
        </strong>
        <span className={cn('text-[6px] tracking-widest sm:text-[7px]', active && 'text-accent')}>
          {active ? 'ACTIVE VIEW' : 'CLICK TO ACTIVATE'}
        </span>
      </div>
    </>
  );
}
