import { useCallback, useEffect, useState } from 'react';
import type { ViewportHandle } from '../types';
export function useCine(handle: ViewportHandle | undefined, notify: (message: string) => void) {
  const [playing, setPlaying] = useState(false);
  const [fps, setFps] = useState(10);
  const stop = useCallback(() => setPlaying(false), []);
  const toggle = useCallback(() => setPlaying((value) => !value), []);
  useEffect(() => {
    if (!playing) return;
    if (!handle || handle.viewport.getImageIds().length < 2) {
      stop();
      return;
    }
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      if (!alive) return;
      try {
        await handle.viewport.setImageIdIndex(
          (handle.viewport.getCurrentImageIdIndex() + 1) % handle.viewport.getImageIds().length,
        );
        if (alive) timer = setTimeout(tick, 1000 / fps);
      } catch {
        if (alive) {
          stop();
          notify('Cine stopped because an image could not be decoded.');
        }
      }
    };
    timer = setTimeout(tick, 1000 / fps);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [handle, playing, fps, notify, stop]);
  return { playing, fps, setFps, toggle, stop };
}
