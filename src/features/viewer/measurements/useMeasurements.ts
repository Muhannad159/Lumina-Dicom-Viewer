import { useEffect, useMemo, useState } from 'react';
import { eventTarget, type RenderingEngine } from '@cornerstonejs/core';
import { annotation, Enums, utilities } from '@cornerstonejs/tools';
import type { ViewportHandle } from '../types';
import { framesFor } from '../runtime';
import { measurementRow, type MeasurementRow } from './model';

export function useMeasurements(handle: ViewportHandle | undefined, engine: RenderingEngine) {
  const [rows, setRows] = useState<MeasurementRow[]>([]);
  const indices = useMemo(
    () => new Map(handle ? framesFor(handle.series).map((f, i) => [f.imageId, i]) : []),
    [handle],
  );
  useEffect(() => {
    let frame = 0;
    const refresh = () => {
      frame = 0;
      setRows(
        annotation.state
          .getAllAnnotations()
          .flatMap((item) => {
            const index = indices.get(item.metadata?.referencedImageId ?? '');
            return item.annotationUID && index !== undefined ? [measurementRow(item, index)] : [];
          })
          .sort((a, b) => a.frameIndex - b.frameIndex),
      );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(refresh);
    };
    const events = [
      Enums.Events.ANNOTATION_ADDED,
      Enums.Events.ANNOTATION_COMPLETED,
      Enums.Events.ANNOTATION_MODIFIED,
      Enums.Events.ANNOTATION_REMOVED,
      Enums.Events.ANNOTATION_SELECTION_CHANGE,
      Enums.Events.ANNOTATION_VISIBILITY_CHANGE,
    ];
    schedule();
    events.forEach((event) => eventTarget.addEventListener(event, schedule));
    return () => {
      cancelAnimationFrame(frame);
      events.forEach((event) => eventTarget.removeEventListener(event, schedule));
    };
  }, [indices]);
  const get = (id: string) => {
    const item = annotation.state.getAnnotation(id);
    return item && indices.has(item.metadata?.referencedImageId ?? '') ? item : undefined;
  };
  const render = () => {
    if (!engine.hasBeenDestroyed) engine.render();
  };
  return {
    rows,
    async select(row: MeasurementRow) {
      if (!handle || !get(row.id)) return;
      await handle.viewport.setImageIdIndex(row.frameIndex);
      if (!get(row.id) || engine.hasBeenDestroyed) return;
      annotation.selection.setAnnotationSelected(row.id, true);
      annotation.visibility.setAnnotationVisibility(row.id, true);
      render();
    },
    rename(id: string, label: string) {
      const item = get(id);
      if (item && handle) utilities.setAnnotationLabel(item, handle.element, label);
      render();
    },
    toggle(row: MeasurementRow) {
      if (get(row.id)) annotation.visibility.setAnnotationVisibility(row.id, !row.visible);
      render();
    },
    remove(id: string) {
      if (get(id)) annotation.state.removeAnnotation(id);
      render();
    },
  };
}
