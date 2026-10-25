import { useEffect, useState } from 'react';
import { useSession } from '../../session/SessionProvider';
import type { ViewportHandle } from '../types';
import { framesFor } from '../runtime';
import type { KeyImage } from './useBookmarks';
export function useKeyImages(
  handle: ViewportHandle | undefined,
  selectSeries: (id: string) => void,
  stopCine: () => void,
  notify: (message: string) => void,
) {
  const { addBookmark } = useSession();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<KeyImage>();
  useEffect(() => {
    if (!pending || !handle || handle.series.id !== pending.seriesId) return;
    const index = framesFor(handle.series).findIndex(
      (frame) => frame.instance.id === pending.instanceId && frame.frame === pending.frame,
    );
    let alive = true;
    if (index >= 0)
      void handle.viewport
        .setImageIdIndex(index)
        .catch(() => {
          if (alive) notify('This bookmarked image could not be decoded.');
        })
        .finally(() => {
          if (alive) setPending(undefined);
        });
    else setPending(undefined);
    return () => {
      alive = false;
    };
  }, [pending, handle, notify]);
  return {
    open,
    close: () => setOpen(false),
    show: () => setOpen(true),
    add() {
      if (!handle) return;
      const index = handle.viewport.getCurrentImageIdIndex();
      const frame = framesFor(handle.series)[index];
      if (!frame) return;
      addBookmark({
        id: `${frame.instance.id}:${frame.frame}`,
        seriesId: handle.series.id,
        instanceId: frame.instance.id,
        frame: frame.frame,
        label: `Image ${index + 1}`,
        patient: handle.study.patientName,
        series: handle.series.description,
      });
      notify('Key image saved to session bookmarks.');
    },
    jump(item: KeyImage) {
      stopCine();
      setPending(item);
      selectSeries(item.seriesId);
      setOpen(false);
    },
  };
}
