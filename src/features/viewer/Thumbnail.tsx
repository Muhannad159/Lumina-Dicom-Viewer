import { useEffect, useRef, useState } from 'react';
import { ImageOff, ScanLine } from 'lucide-react';
import { utilities, imageLoader } from '@cornerstonejs/core';
import type { LocalSeries } from '../dicom/types';
import { framesFor, getSessionGeneration, thumbnailCache, trackTask } from './runtime';

// Serial thumbnail work leaves decoder capacity for the user's active images.
let queue = Promise.resolve();
export default function Thumbnail({ series }: { series: LocalSeries }) {
  const ref = useRef<HTMLDivElement>(null);
  const [url, setUrl] = useState(thumbnailCache.get(series.id));
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    const generation = getSessionGeneration();
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        queue = queue
          .catch(() => {})
          .then(async () => {
            if (!alive || generation !== getSessionGeneration()) return;
            const cached = thumbnailCache.get(series.id);
            if (cached) {
              setUrl(cached);
              return;
            }
            try {
              const frames = framesFor(series);
              const frame = frames[Math.floor(frames.length / 2)];
              if (!frame) throw new Error('No image');
              const canvas = document.createElement('canvas');
              canvas.width = 160;
              canvas.height = 120;
              const decoded = await trackTask(imageLoader.loadAndCacheImage(frame.imageId));
              if (generation !== getSessionGeneration()) return;
              await utilities.renderToCanvasCPU(canvas, decoded, series.modality);
              const blob = await new Promise<Blob | null>((resolve) =>
                canvas.toBlob(resolve, 'image/png'),
              );
              if (!blob || generation !== getSessionGeneration()) return;
              const next = URL.createObjectURL(blob);
              thumbnailCache.set(series.id, next);
              if (alive) setUrl(next);
            } catch {
              if (alive) setFailed(true);
            }
          });
      },
      { rootMargin: '100px' },
    );
    if (ref.current) observer.observe(ref.current);
    return () => {
      alive = false;
      observer.disconnect();
    };
  }, [series]);
  return (
    <div
      ref={ref}
      data-testid="thumbnail"
      className="relative grid h-16 w-18 shrink-0 place-items-center overflow-hidden rounded bg-[#050707] text-[#64716d] compact:h-12 compact:w-13"
    >
      {url ? (
        <img src={url} alt={`${series.description} preview`} className="size-full object-contain" />
      ) : failed ? (
        <ImageOff size={22} aria-label="Preview unavailable" />
      ) : (
        <ScanLine size={26} />
      )}
      <span className="absolute bottom-1 left-1 rounded bg-[#0c191bc9] px-1 py-0.5 text-[8px] text-[#c4d7d2]">
        {series.modality}
      </span>
    </div>
  );
}
