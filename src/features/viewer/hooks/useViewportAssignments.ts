import { useCallback, useState } from 'react';
import type { Layout, LocalStudy } from '../../dicom/types';
import { assignLayout } from '../../dicom/catalog';
import type { ToolName } from '../runtime';
export function useViewportAssignments(studies: LocalStudy[]) {
  const [layout, setLayout] = useState<Layout>('1x1');
  const [assignments, setAssignments] = useState(() => assignLayout('1x1', null, studies));
  const [active, setActive] = useState('viewport-0');
  const [tools, setTools] = useState<Record<string, ToolName>>({});
  const currentSeriesId = assignments.find((a) => a.viewportId === active)?.seriesId ?? null;
  const selectTool = useCallback(
    (tool: ToolName) => setTools((previous) => ({ ...previous, [active]: tool })),
    [active],
  );
  function selectSeries(id: string, slot = active) {
    if (!studies.some((study) => study.series.some((series) => series.id === id))) return;
    setAssignments((previous) =>
      previous.map((a) => (a.viewportId === slot ? { ...a, seriesId: id } : a)),
    );
  }
  function changeLayout(next: Layout) {
    setLayout(next);
    setAssignments(assignLayout(next, currentSeriesId, studies));
    setActive('viewport-0');
  }
  return {
    layout,
    assignments,
    active,
    tools,
    currentSeriesId,
    selectTool,
    selectSeries,
    changeLayout,
    setActive,
  };
}
