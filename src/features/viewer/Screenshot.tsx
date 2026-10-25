import { capture } from './capture';
import { useEffect, useRef, useState } from 'react';
import { Download, Crop, RotateCcw } from 'lucide-react';
import Modal from '../../components/Modal';
import type { ViewportHandle } from './types';
import Button from '../../components/Button';
import { cn } from '../../lib/classes';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
export default function Screenshot({
  handle,
  onClose,
}: {
  handle: ViewportHandle;
  onClose: () => void;
}) {
  const [canvas, setCanvas] = useState<HTMLCanvasElement>();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [crop, setCrop] = useState<Rect>();
  const [cropping, setCropping] = useState(false);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => {
    let alive = true;
    capture(handle)
      .then((result) => {
        if (alive) {
          setCanvas(result);
          setUrl(result.toDataURL('image/png'));
        }
      })
      .catch(() => {
        if (alive)
          setError(
            'Unable to capture this viewport. Try again after the image finishes rendering.',
          );
      });
    return () => {
      alive = false;
    };
  }, [handle]);
  function point(event: React.PointerEvent) {
    const rect = image.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
    };
  }
  function download() {
    if (!canvas) return;
    const output = document.createElement('canvas');
    const area =
      crop && crop.width > 0.01 && crop.height > 0.01 ? crop : { x: 0, y: 0, width: 1, height: 1 };
    output.width = Math.max(1, Math.round(canvas.width * area.width));
    output.height = Math.max(1, Math.round(canvas.height * area.height));
    output
      .getContext('2d')!
      .drawImage(
        canvas,
        area.x * canvas.width,
        area.y * canvas.height,
        output.width,
        output.height,
        0,
        0,
        output.width,
        output.height,
      );
    output.toBlob((blob) => {
      if (!blob) {
        setError('PNG export failed.');
        return;
      }
      const link = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      link.href = objectUrl;
      link.download = `lumina-image-${handle.viewport.getCurrentImageIdIndex() + 1}.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    }, 'image/png');
  }
  return (
    <Modal title="Screenshot & crop" onClose={onClose} wide>
      <p className="text-xs leading-6 text-muted">
        Capture the active view. Select Crop, then drag across the image to choose an area.
      </p>
      {error && (
        <p role="alert" className="text-xs text-[#edaa8c]">
          {error}
        </p>
      )}
      {!url && !error && <p>Capturing image…</p>}
      {url && (
        <div
          className={cn(
            'relative mx-auto my-5 w-fit max-w-full touch-none overflow-hidden leading-none',
            cropping && 'cursor-crosshair',
          )}
          onPointerDown={(event) => {
            if (!cropping) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            origin.current = point(event);
            setCrop(undefined);
          }}
          onPointerMove={(event) => {
            if (!origin.current) return;
            const next = point(event);
            const start = origin.current;
            setCrop({
              x: Math.min(start.x, next.x),
              y: Math.min(start.y, next.y),
              width: Math.abs(next.x - start.x),
              height: Math.abs(next.y - start.y),
            });
          }}
          onPointerUp={() => {
            origin.current = null;
          }}
          onPointerCancel={() => {
            origin.current = null;
          }}
        >
          <img
            ref={image}
            src={url}
            alt="Viewport capture"
            draggable={false}
            className="block max-h-[53dvh] max-w-full object-contain select-none"
          />
          {crop && (
            <div
              className="pointer-events-none absolute border-2 border-[#99e6ca] bg-[#94e9c415] shadow-[0_0_0_2000px_#0008]"
              style={{
                left: `${crop.x * 100}%`,
                top: `${crop.y * 100}%`,
                width: `${crop.width * 100}%`,
                height: `${crop.height * 100}%`,
              }}
            />
          )}
        </div>
      )}
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <Button
          aria-pressed={cropping}
          className={cropping ? 'ring-1 ring-accent' : undefined}
          disabled={!canvas}
          onClick={() => setCropping(!cropping)}
        >
          <Crop size={17} />
          Crop
        </Button>
        <Button disabled={!canvas} onClick={() => setCrop(undefined)}>
          <RotateCcw size={17} />
          Full image
        </Button>
        <Button variant="primary" disabled={!canvas} onClick={download}>
          <Download size={17} />
          Download PNG
        </Button>
      </div>
    </Modal>
  );
}
