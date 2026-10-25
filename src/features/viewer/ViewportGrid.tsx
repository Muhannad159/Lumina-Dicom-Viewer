import type { RenderingEngine } from '@cornerstonejs/core';
import type { Layout, LocalStudy, ViewportAssignment } from '../dicom/types';
import type { ViewportHandle } from './types';
import type { ToolName } from './runtime';
import { cn } from '../../lib/classes';
import Viewport from './Viewport';
const layouts: Record<Layout, string> = {
  '1x1': 'grid-cols-1 grid-rows-1',
  '1x2': 'grid-cols-2 grid-rows-1',
  '2x1': 'grid-cols-1 grid-rows-2',
  '2x2': 'grid-cols-2 grid-rows-2',
};
export default function ViewportGrid({
  studies,
  layout,
  assignments,
  active,
  tools,
  engine,
  onActivate,
  onSelect,
  onReady,
  referenceSource,
  handles,
}: {
  studies: LocalStudy[];
  layout: Layout;
  assignments: ViewportAssignment[];
  active: string;
  tools: Record<string, ToolName>;
  engine: RenderingEngine;
  onActivate: (slot: string) => void;
  onSelect: (id: string, slot: string) => void;
  onReady: (slot: string, handle: ViewportHandle | null) => void;
  referenceSource?: ViewportHandle;
  handles: Map<string, ViewportHandle>;
}) {
  return (
    <div
      data-testid="viewport-grid"
      className={cn('grid min-h-0 min-w-0 flex-1 gap-0.5 bg-black p-0.5', layouts[layout])}
    >
      {assignments.map((assignment) => {
        const study = studies.find((s) =>
          s.series.some((series) => series.id === assignment.seriesId),
        );
        const series = study?.series.find((s) => s.id === assignment.seriesId);
        return (
          <Viewport
            key={`${assignment.viewportId}:${assignment.seriesId}`}
            slot={assignment.viewportId}
            engine={engine}
            series={series}
            study={study}
            active={assignment.viewportId === active}
            tool={tools[assignment.viewportId] ?? 'scroll'}
            onActivate={() => onActivate(assignment.viewportId)}
            onDropSeries={(id) => onSelect(id, assignment.viewportId)}
            onReady={onReady}
            referenceSource={referenceSource}
            handle={handles.get(assignment.viewportId)}
          />
        );
      })}
    </div>
  );
}
