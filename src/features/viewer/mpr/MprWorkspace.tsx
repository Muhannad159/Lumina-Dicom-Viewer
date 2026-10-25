import { useState } from 'react';
import type { RenderingEngine } from '@cornerstonejs/core';
import { Maximize2, Minimize2 } from 'lucide-react';
import type { LocalSeries, LocalStudy } from '../../dicom/types';
import IconButton from '../../../components/IconButton';
import InstanceScrollbar from '../InstanceScrollbar';
import MprToolbar, { type MprTool } from './MprToolbar';
import { useMprVolume } from './useMprVolume';
import { useMprViewports } from './useMprViewports';
import { useMprCrosshairs } from './useMprCrosshairs';
import MprCrosshair from './MprCrosshair';
import { planes } from './planes';

export default function MprWorkspace({
  series,
  study,
  engine,
  onExit,
}: {
  series: LocalSeries;
  study: LocalStudy;
  engine: RenderingEngine;
  onExit: () => void;
}) {
  const { volumeId, progress, total, error: volumeError } = useMprVolume(series);
  const [tool, setTool] = useState<MprTool>('crosshairs');
  const [expanded, setExpanded] = useState<number | null>(null);
  const views = useMprViewports(engine, volumeId, tool);
  const crosshairs = useMprCrosshairs(views.viewports, volumeId);
  const problem = volumeError || views.error;
  return (
    <div data-testid="mpr-workspace" className="flex min-h-0 flex-1 flex-col bg-background">
      <MprToolbar
        tool={tool}
        onTool={setTool}
        onReset={views.reset}
        onExit={onExit}
        ready={views.ready && !problem}
      />
      <div className="flex items-center justify-between gap-3 border-b border-line bg-panel px-4 py-2 text-xs">
        <div className="min-w-0 truncate">
          <span className="font-semibold text-foreground">{study.patientName}</span>
          <span className="ml-3 text-muted">{series.description}</span>
        </div>
        <span className="shrink-0 text-muted">MPR · {total} slices</span>
      </div>
      {progress < total && !problem && (
        <div
          role="status"
          className="flex items-center gap-3 bg-panel px-4 py-1.5 text-xs text-muted"
        >
          <span>
            {views.ready ? 'Loading slices' : 'Preparing MPR'} {progress} / {total}
          </span>
          <progress
            aria-label="MPR loading progress"
            value={progress}
            max={total}
            className="h-1 min-w-0 flex-1 accent-accent"
          />
        </div>
      )}
      <div
        className={`grid min-h-0 flex-1 gap-1 bg-black p-1 ${expanded === null ? 'grid-cols-1 grid-rows-3 md:grid-cols-3 md:grid-rows-1' : 'grid-cols-1 grid-rows-1'}`}
      >
        {planes.map(({ name, color }, index) => (
          <section
            key={name}
            data-testid="mpr-viewport"
            aria-label={`${name} MPR view`}
            className={`relative min-h-0 min-w-0 overflow-hidden rounded-md border border-white/15 bg-black ${expanded !== null && expanded !== index ? 'hidden' : ''}`}
          >
            <div
              ref={(element) => {
                views.elements.current[index] = element;
              }}
              className="absolute inset-0 touch-none"
              data-testid="mpr-canvas"
            />
            {views.ready && !problem && crosshairs.overlays[index] && (
              <MprCrosshair
                overlay={crosshairs.overlays[index]}
                active={tool === 'crosshairs'}
                plane={index}
                onLocate={(point) => crosshairs.locate(index, point)}
              />
            )}
            <div className="pointer-events-none absolute inset-x-2 top-2 flex items-center justify-between pr-6">
              <span className="flex items-center gap-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
                <svg width="8" height="8" aria-hidden="true">
                  <circle cx="4" cy="4" r="4" fill={color} />
                </svg>
                {name}
              </span>
              <IconButton
                label={`${expanded === index ? 'Restore' : 'Expand'} ${name} view`}
                className="pointer-events-auto bg-black/70 text-white"
                onClick={() => setExpanded(expanded === index ? null : index)}
              >
                {expanded === index ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </IconButton>
            </div>
            {views.ready && (
              <span
                data-testid="mpr-slice-count"
                className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-xs text-white/80"
              >
                {(views.slices[index]?.index ?? 0) + 1} / {views.slices[index]?.total ?? 1}
              </span>
            )}
            {views.ready && views.slices[index]?.total > 1 && (
              <InstanceScrollbar
                currentIndex={views.slices[index].index}
                totalImages={views.slices[index].total}
                disabled={Boolean(problem)}
                onChange={(value) => views.scrollTo(index, value)}
              />
            )}
          </section>
        ))}
      </div>
      <div className="border-t border-line bg-panel px-3 py-1.5 text-center text-xs text-muted">
        {tool === 'crosshairs'
          ? 'Click or drag to locate across all planes · Arrow keys move the crosshair'
          : 'Drag to adjust the view · Scroll to move through slices'}
      </div>
      {problem && (
        <div
          role="alert"
          className="absolute inset-x-4 top-1/2 z-10 mx-auto max-w-sm rounded-lg border border-line bg-panel p-5 text-center text-sm text-foreground shadow-xl"
        >
          {problem}
          <button
            type="button"
            className="mt-3 block w-full rounded bg-accent px-3 py-2 text-accent-ink"
            onClick={onExit}
          >
            Return to viewer
          </button>
        </div>
      )}
    </div>
  );
}
