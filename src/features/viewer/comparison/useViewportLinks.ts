import { useEffect, useState } from 'react';
import { Enums } from '@cornerstonejs/core';
import type { ViewportHandle } from '../types';
import { framesFor } from '../runtime';
import { nearestSlice } from './geometry';
import type { ViewerAvailability } from '../availability';
export interface ViewportLinks {
  windowLevel: boolean;
  zoomPan: boolean;
  slices: boolean;
  referenceLines: boolean;
}
export function useViewportLinks(
  handles: Map<string, ViewportHandle>,
  active: string,
  notify: (message: string) => void,
  availability: ViewerAvailability,
) {
  const [links, setLinks] = useState<ViewportLinks>({
    windowLevel: false,
    zoomPan: false,
    slices: false,
    referenceLines: false,
  });
  const effective: ViewportLinks = {
    windowLevel: links.windowLevel && availability.syncOptions.windowLevel.enabled,
    zoomPan: links.zoomPan && availability.syncOptions.zoomPan.enabled,
    slices: links.slices && availability.syncOptions.slices.enabled,
    referenceLines: links.referenceLines && availability.syncOptions.referenceLines.enabled,
  };
  const { windowLevel, zoomPan, slices } = effective;
  useEffect(() => {
    const source = handles.get(active);
    if (!source) return;
    let alive = true,
      animation = 0,
      dirtyVOI = true,
      dirtyCamera = true,
      dirtySlice = true;
    const pending = new Map<ViewportHandle, { index: number; running: boolean }>();
    async function jump(target: ViewportHandle, index: number) {
      const previous = pending.get(target);
      if (previous) {
        previous.index = index;
        return;
      }
      const job = { index, running: true };
      pending.set(target, job);
      try {
        while (alive && job.running) {
          const next = job.index;
          if (target.viewport.getCurrentImageIdIndex() !== next)
            await target.viewport.setImageIdIndex(next);
          job.running = job.index !== next;
        }
      } catch {
        if (alive) notify('A linked image could not be decoded.');
      } finally {
        pending.delete(target);
      }
    }
    const apply = () => {
      animation = 0;
      if (!alive) return;
      const image = framesFor(source.series)[source.viewport.getCurrentImageIdIndex()]?.instance;
      handles.forEach((target, slot) => {
        if (slot === active) return;
        // Presentation links are explicitly opt-in; VOI only transfers within a modality.
        if (windowLevel && dirtyVOI && source.series.modality === target.series.modality) {
          const { voiRange, invert } = source.viewport.getProperties();
          if (voiRange) target.viewport.setProperties({ voiRange, invert });
          target.viewport.render();
        }
        if (zoomPan && dirtyCamera) {
          target.viewport.setZoom(source.viewport.getZoom());
          target.viewport.setPan(source.viewport.getPan());
          target.viewport.render();
        }
        if (slices && dirtySlice && image) {
          const index = nearestSlice(image, target.series);
          if (index !== undefined) void jump(target, index);
        }
      });
      dirtyVOI = dirtyCamera = dirtySlice = false;
    };
    const schedule = () => {
      if (!animation) animation = requestAnimationFrame(apply);
    };
    const voi = () => {
      dirtyVOI = true;
      schedule();
    };
    const camera = () => {
      dirtyCamera = true;
      schedule();
    };
    const slice = () => {
      dirtySlice = dirtyVOI = true;
      schedule();
    };
    source.element.addEventListener(Enums.Events.VOI_MODIFIED, voi);
    source.element.addEventListener(Enums.Events.CAMERA_MODIFIED, camera);
    source.element.addEventListener(Enums.Events.STACK_NEW_IMAGE, slice);
    schedule();
    return () => {
      alive = false;
      cancelAnimationFrame(animation);
      source.element.removeEventListener(Enums.Events.VOI_MODIFIED, voi);
      source.element.removeEventListener(Enums.Events.CAMERA_MODIFIED, camera);
      source.element.removeEventListener(Enums.Events.STACK_NEW_IMAGE, slice);
    };
  }, [handles, active, windowLevel, zoomPan, slices, notify]);
  return {
    links,
    effective,
    toggleLink: (key: keyof ViewportLinks) =>
      setLinks((previous) =>
        availability.syncOptions[key].enabled ? { ...previous, [key]: !previous[key] } : previous,
      ),
  };
}
