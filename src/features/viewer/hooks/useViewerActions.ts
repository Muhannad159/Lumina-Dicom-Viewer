import { useCallback, useState } from 'react';
import type { RefObject } from 'react';
import type { RenderingEngine } from '@cornerstonejs/core';
import type { ViewerAction, ViewportHandle } from '../types';
import { framesFor } from '../runtime';
import { applyViewportAction } from '../commands';
export function useViewerActions({
  handle,
  engine,
  root,
  stopCine,
  notify,
}: {
  handle?: ViewportHandle;
  engine?: RenderingEngine;
  root: RefObject<HTMLDivElement | null>;
  stopCine: () => void;
  notify: (message: string) => void;
}) {
  const [screenshot, setScreenshot] = useState<ViewportHandle>();
  const [metadata, setMetadata] = useState<Record<string, string>>();
  const [measurements, setMeasurements] = useState(false);
  const action = useCallback(
    async (name: ViewerAction) => {
      try {
        if (name === 'fullscreen') {
          if (document.fullscreenElement) await document.exitFullscreen();
          else if (root.current?.requestFullscreen) await root.current.requestFullscreen();
          else notify('Fullscreen is not available in this browser.');
          return;
        }
        if (!handle) return;
        if (name === 'measurements') {
          stopCine();
          setMeasurements((open) => !open);
          return;
        }
        if (name === 'reset' || name === 'screenshot') stopCine();
        if (name === 'screenshot') {
          setScreenshot(handle);
          return;
        }
        if (name === 'metadata') {
          const frame = framesFor(handle.series)[handle.viewport.getCurrentImageIdIndex()];
          setMetadata({
            File: frame.instance.relativePath,
            Frame: `${frame.frame} / ${frame.instance.frames}`,
            ...frame.instance.tags,
          });
          return;
        }
        applyViewportAction(name, handle, engine);
      } catch {
        notify(
          name === 'fullscreen'
            ? 'Fullscreen is not available in this browser.'
            : 'This action is unavailable for the current image.',
        );
      }
    },
    [handle, engine, root, stopCine, notify],
  );
  return {
    action,
    screenshot,
    metadata,
    measurements,
    closeMeasurements: () => setMeasurements(false),
    closeScreenshot: () => setScreenshot(undefined),
    closeMetadata: () => setMetadata(undefined),
  };
}
