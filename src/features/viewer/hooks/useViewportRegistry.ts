import { useCallback, useState } from 'react';
import type { ViewportHandle } from '../types';
export function useViewportRegistry() {
  const [handles, setHandles] = useState<Map<string, ViewportHandle>>(() => new Map());
  const onReady = useCallback((slot: string, handle: ViewportHandle | null) => {
    setHandles((previous) => {
      const next = new Map(previous);
      if (handle) next.set(slot, handle);
      else next.delete(slot);
      return next;
    });
  }, []);
  return { handles, onReady };
}
