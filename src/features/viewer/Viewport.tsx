import type { RenderingEngine } from '@cornerstonejs/core';
import { AlertCircle, LoaderCircle, ScanLine } from 'lucide-react';
import type { LocalSeries, LocalStudy } from '../dicom/types';
import type { ToolName } from './runtime';
import type { ViewportHandle } from './types';
import { useCornerstoneViewport } from './hooks/useCornerstoneViewport';
import { cn } from '../../lib/classes';
import InstanceScrollbar from './InstanceScrollbar';
import ViewportOverlay from './ViewportOverlay';
import Button from '../../components/Button';
import ReferenceLineOverlay from './comparison/ReferenceLineOverlay';

export default function Viewport({
  slot,
  series,
  study,
  active,
  engine,
  tool,
  onActivate,
  onDropSeries,
  onReady,
  referenceSource,
  handle,
}: {
  slot: string;
  series?: LocalSeries;
  study?: LocalStudy;
  active: boolean;
  engine: RenderingEngine;
  tool: ToolName;
  onActivate: () => void;
  onDropSeries: (id: string) => void;
  onReady: (slot: string, handle: ViewportHandle | null) => void;
  referenceSource?: ViewportHandle;
  handle?: ViewportHandle;
}) {
  const view = useCornerstoneViewport({ slot, series, study, engine, tool, onReady });
  return (
    <section
      data-testid="viewport"
      data-active={active}
      className={cn(
        'relative min-h-0 min-w-0 overflow-hidden border bg-black',
        active ? 'border-accent' : 'border-[#253135]',
      )}
      aria-label={`Viewport ${Number(slot.split('-')[1]) + 1}`}
      onPointerDownCapture={onActivate}
      onFocusCapture={onActivate}
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes('application/x-dicom-series')) event.preventDefault();
      }}
      onDrop={(event) => {
        const id = event.dataTransfer.getData('application/x-dicom-series');
        if (id) {
          event.preventDefault();
          event.stopPropagation();
          onActivate();
          onDropSeries(id);
        }
      }}
    >
      <div
        data-testid="dicom-canvas"
        className="absolute inset-0 touch-none"
        ref={view.element}
        data-annotation-group={series?.id}
        onContextMenu={(event) => event.preventDefault()}
      />
      {series && study && (
        <>
          <ViewportOverlay
            study={study}
            series={series}
            instance={view.instance}
            index={view.index}
            total={view.frames.length}
            voi={view.voi}
            active={active}
          />
          {!view.loading && (
            <InstanceScrollbar
              currentIndex={view.index}
              totalImages={view.frames.length}
              onChange={(value) => void view.jump(value)}
            />
          )}
        </>
      )}
      {referenceSource && <ReferenceLineOverlay source={referenceSource} target={handle} />}
      {!series && (
        <button
          data-testid="empty-viewport"
          className="absolute inset-0 flex size-full flex-col items-center justify-center gap-2.5 bg-[#060a0a] text-[#668078]"
          onClick={onActivate}
        >
          <ScanLine size={32} />
          <strong className="mt-1 text-sm font-normal text-[#a6b9b1]">Choose a series</strong>
          <span className="px-4 text-[10px]">Select a thumbnail or drop it here</span>
        </button>
      )}
      {view.loading && (
        <div
          data-testid="viewport-loading"
          className="absolute top-1/2 left-1/2 flex -translate-1/2 flex-col items-center gap-3 text-xs text-[#a9c6bb]"
        >
          <LoaderCircle className="animate-spin motion-reduce:animate-none" size={24} />
          <span>Preparing images…</span>
        </div>
      )}
      {view.error && (
        <div
          data-testid="viewport-error"
          role="alert"
          className="absolute top-1/2 left-1/2 grid w-[min(85%,300px)] -translate-1/2 justify-items-center gap-3 rounded-lg border border-[#5a6561] bg-[#192423ee] p-5 text-center text-xs text-[#f0d2be]"
        >
          <AlertCircle size={20} />
          <span>{view.error}</span>
          <Button size="sm" onClick={() => void view.jump(view.index)}>
            Retry
          </Button>
        </div>
      )}
    </section>
  );
}
