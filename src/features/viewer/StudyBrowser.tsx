import { useState } from 'react';
import { Layers, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import type { LocalStudy } from '../dicom/types';
import IconButton from '../../components/IconButton';
import { cn } from '../../lib/classes';
import StudyGroup from './StudyGroup';
export default function StudyBrowser({
  studies,
  selectedSeries,
  onSelect,
}: {
  studies: LocalStudy[];
  selectedSeries: string | null;
  onSelect: (id: string) => void;
}) {
  const [closed, setClosed] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  function toggle(id: string) {
    setCollapsed((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  return (
    <aside
      data-testid="study-browser"
      aria-label="Studies and series"
      className={cn(
        'flex min-h-0 shrink-0 flex-col border-r border-line bg-panel compact:max-h-52 compact:w-full compact:border-t compact:border-r-0',
        closed ? 'w-13' : 'w-60',
      )}
    >
      <div className="flex min-h-11 shrink-0 items-center justify-between border-b border-line px-2 compact:px-3">
        <span
          className={cn('flex items-center gap-2 pl-1 text-xs', closed && 'hidden compact:flex')}
        >
          <Layers size={16} className="text-muted" />
          <strong>Studies</strong>
          <span className="grid min-w-5 place-items-center rounded bg-accent-soft px-1 py-0.5 text-[10px] text-accent">
            {studies.length}
          </span>
        </span>
        <IconButton
          label={closed ? 'Expand studies' : 'Collapse studies'}
          onClick={() => setClosed(!closed)}
        >
          {closed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </IconButton>
      </div>
      {!closed && (
        <div
          data-testid="study-groups"
          className="flex-1 overflow-y-auto overscroll-contain compact:flex compact:flex-none compact:items-start compact:overflow-x-auto compact:overflow-y-hidden compact:pb-1"
        >
          {studies.map((study) => (
            <StudyGroup
              key={study.id}
              study={study}
              collapsed={collapsed.has(study.id)}
              onToggle={() => toggle(study.id)}
              selectedSeries={selectedSeries}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </aside>
  );
}
