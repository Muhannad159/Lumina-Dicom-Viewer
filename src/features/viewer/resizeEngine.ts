import type { RenderingEngine } from '@cornerstonejs/core';

const pending = new WeakMap<RenderingEngine, number>();

// All viewport observers share one resize. Cornerstone clears every output canvas
// during resize, then renders on the next animation frame. Keep the previous
// pixels visible in that interval, including during a continuous window drag.
export function scheduleEngineResize(engine: RenderingEngine) {
  if (pending.has(engine) || engine.hasBeenDestroyed) return;
  pending.set(
    engine,
    requestAnimationFrame(() => {
      pending.delete(engine);
      if (engine.hasBeenDestroyed) return;
      const snapshots = engine.getViewports().map(({ canvas }) => {
        const copy = document.createElement('canvas');
        copy.width = canvas.width;
        copy.height = canvas.height;
        if (canvas.width && canvas.height) copy.getContext('2d')?.drawImage(canvas, 0, 0);
        return { canvas, copy };
      });
      engine.resize(true, true);
      snapshots.forEach(({ canvas, copy }) => {
        if (copy.width && copy.height && canvas.width && canvas.height)
          canvas.getContext('2d')?.drawImage(copy, 0, 0, canvas.width, canvas.height);
      });
    }),
  );
}
