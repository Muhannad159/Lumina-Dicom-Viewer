import { useEffect, useMemo, useReducer } from 'react';
import { eventTarget, Enums } from '@cornerstonejs/core';
import { Enums as ToolEnums } from '@cornerstonejs/tools';
import type { ViewportHandle } from '../types';
import { getViewerAvailability } from '../availability';
import { browserMprLimits } from '../mpr/eligibility';

export function useViewerAvailability(
  handle: ViewportHandle | undefined,
  handles: Map<string, ViewportHandle>,
  active: string,
) {
  const [, refresh] = useReducer((value: number) => value + 1, 0);
  const mprLimits = useMemo(browserMprLimits, []);
  useEffect(() => {
    const events = [
      ToolEnums.Events.ANNOTATION_ADDED,
      ToolEnums.Events.ANNOTATION_REMOVED,
      ToolEnums.Events.ANNOTATION_SELECTION_CHANGE,
    ];
    events.forEach((event) => eventTarget.addEventListener(event, refresh));
    handles.forEach(({ element }) =>
      element.addEventListener(Enums.Events.STACK_NEW_IMAGE, refresh),
    );
    return () => {
      events.forEach((event) => eventTarget.removeEventListener(event, refresh));
      handles.forEach(({ element }) =>
        element.removeEventListener(Enums.Events.STACK_NEW_IMAGE, refresh),
      );
    };
  }, [handles]);
  return getViewerAvailability(handle, handles, active, mprLimits);
}
