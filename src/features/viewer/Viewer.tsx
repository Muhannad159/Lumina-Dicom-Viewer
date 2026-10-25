import { useEffect, useRef, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import type { LocalStudy } from '../dicom/types';
import { useRenderingEngine } from './hooks/useRenderingEngine';
import { useViewportAssignments } from './hooks/useViewportAssignments';
import { useViewportRegistry } from './hooks/useViewportRegistry';
import { useCine } from './hooks/useCine';
import { useViewerActions } from './hooks/useViewerActions';
import { useViewerShortcuts } from './hooks/useViewerShortcuts';
import { applyWindowPreset } from './commands';
import StatusMessage from '../../components/StatusMessage';
import Toolbar from './Toolbar';
import StudyBrowser from './StudyBrowser';
import ViewportGrid from './ViewportGrid';
import ViewerFooter from './ViewerFooter';
import Screenshot from './Screenshot';
import MetadataDialog from './MetadataDialog';
import ArrowTextDialog from './annotations/ArrowTextDialog';
import MeasurementPanel from './measurements/MeasurementPanel';
import { useViewportLinks } from './comparison/useViewportLinks';
import { useKeyImages } from './bookmarks/useKeyImages';
import BookmarksPanel from './bookmarks/BookmarksPanel';
import { useViewerAvailability } from './hooks/useViewerAvailability';
import MprWorkspace from './mpr/MprWorkspace';

export default function Viewer({
  studies,
  onNotice,
}: {
  studies: LocalStudy[];
  onNotice: (message: string) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [mprSource, setMprSource] = useState<{
    series: LocalStudy['series'][number];
    study: LocalStudy;
  }>();
  const { engine, error } = useRenderingEngine();
  const views = useViewportAssignments(studies);
  const { handles, onReady } = useViewportRegistry();
  const handle = handles.get(views.active);
  const availability = useViewerAvailability(handle, handles, views.active);
  const cine = useCine(handle, onNotice);
  const actions = useViewerActions({ handle, engine, root, stopCine: cine.stop, notify: onNotice });
  const comparison = useViewportLinks(handles, views.active, onNotice, availability);
  const keys = useKeyImages(handle, views.selectSeries, cine.stop, onNotice);
  const action = async (name: Parameters<typeof actions.action>[0]) => {
    if (!availability.actions[name].enabled) return;
    if (name === 'bookmark') {
      keys.add();
      return;
    }
    if (name === 'bookmarks') {
      actions.closeMeasurements();
      keys.show();
      return;
    }
    if (name === 'measurements') keys.close();
    await actions.action(name);
  };
  const selectTool = (tool: Parameters<typeof views.selectTool>[0]) => {
    if (!availability.tools[tool].enabled) return;
    cine.stop();
    views.selectTool(tool);
  };
  const activeTool = views.tools[views.active] ?? 'scroll';
  const setActiveTool = views.selectTool;
  const effectiveTool = availability.tools[activeTool].enabled
    ? activeTool
    : availability.tools.scroll.enabled
      ? 'scroll'
      : 'pan';
  useEffect(() => {
    if (handle && activeTool !== effectiveTool) setActiveTool(effectiveTool);
  }, [handle, activeTool, effectiveTool, setActiveTool]);
  useViewerShortcuts(
    selectTool,
    action,
    () => {
      if (availability.cine.enabled) cine.toggle();
    },
    availability,
  );
  const preset = (value: string) => {
    if (availability.presets[value]?.enabled) applyWindowPreset(value, handle);
  };
  const selectSeries = (id: string, slot = views.active) => {
    cine.stop();
    views.selectSeries(id, slot);
  };
  const activate = (slot: string) => {
    if (slot !== views.active) {
      cine.stop();
      views.setActive(slot);
    }
  };
  if (error) return <StatusMessage error>{error}</StatusMessage>;
  if (!engine)
    return (
      <StatusMessage>
        <LoaderCircle className="animate-spin motion-reduce:animate-none" />
        Starting image workspace…
      </StatusMessage>
    );
  return (
    <div
      ref={root}
      data-testid="viewer"
      className="relative flex min-h-0 flex-1 flex-col bg-background fullscreen:h-dvh fullscreen:w-screen"
    >
      {mprSource ? (
        <MprWorkspace
          key={mprSource.series.id}
          series={mprSource.series}
          study={mprSource.study}
          engine={engine}
          onExit={() => setMprSource(undefined)}
        />
      ) : (
        <>
          <Toolbar
            tool={effectiveTool}
            onTool={selectTool}
            onAction={(name) => void action(name)}
            links={comparison.links}
            onToggleLink={comparison.toggleLink}
            availability={availability.sync}
            options={availability.syncOptions}
            toolAvailability={availability}
            onMpr={() => {
              if (!availability.mpr.enabled || !handle) return;
              cine.stop();
              actions.closeMeasurements();
              actions.closeMetadata();
              actions.closeScreenshot();
              keys.close();
              setMprSource({ series: handle.series, study: handle.study });
            }}
            layout={views.layout}
            onLayout={(layout) => {
              cine.stop();
              views.changeLayout(layout);
            }}
            playing={cine.playing}
            onPlay={cine.toggle}
            fps={cine.fps}
            onFps={cine.setFps}
            cine={availability.cine}
            onPreset={preset}
          />
          <div className="flex min-h-0 flex-1 max-md:flex-col-reverse portrait:flex-col-reverse">
            <StudyBrowser
              studies={studies}
              selectedSeries={views.currentSeriesId}
              onSelect={selectSeries}
            />
            <ViewportGrid
              studies={studies}
              engine={engine}
              layout={views.layout}
              assignments={views.assignments}
              active={views.active}
              tools={{ ...views.tools, [views.active]: effectiveTool }}
              onActivate={activate}
              onSelect={selectSeries}
              onReady={onReady}
              handles={handles}
              referenceSource={comparison.effective.referenceLines ? handle : undefined}
            />
          </div>
          <ViewerFooter studyCount={studies.length} handle={handle} />
        </>
      )}
      <ArrowTextDialog />
      {keys.open && (
        <BookmarksPanel
          onClose={keys.close}
          onJump={keys.jump}
          onAdd={keys.add}
          disabled={!handle}
        />
      )}
      {actions.measurements && (
        <MeasurementPanel
          key={views.active + (handle?.series.id ?? '')}
          handle={handle}
          engine={engine}
          onClose={actions.closeMeasurements}
          onSelect={cine.stop}
          onNotice={onNotice}
        />
      )}
      {actions.screenshot && (
        <Screenshot handle={actions.screenshot} onClose={actions.closeScreenshot} />
      )}
      {actions.metadata && (
        <MetadataDialog metadata={actions.metadata} onClose={actions.closeMetadata} />
      )}
    </div>
  );
}
