import { useEffect, useState } from 'react';
import { RenderingEngine } from '@cornerstonejs/core';
import { initializeCornerstone } from '../runtime';
export function useRenderingEngine() {
  const [engine, setEngine] = useState<RenderingEngine>();
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    let instance: RenderingEngine | undefined;
    initializeCornerstone()
      .then(() => {
        if (!alive) return;
        instance = new RenderingEngine(`local-viewer-${crypto.randomUUID()}`);
        setEngine(instance);
      })
      .catch(() => {
        if (alive)
          setError(
            'The image renderer could not start. Enable browser hardware acceleration, then reload.',
          );
      });
    return () => {
      alive = false;
      instance?.destroy();
    };
  }, []);
  return { engine, error };
}
