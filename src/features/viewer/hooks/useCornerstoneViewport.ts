import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Enums, eventTarget, type RenderingEngine, type Types } from '@cornerstonejs/core';
import { ToolGroupManager } from '@cornerstonejs/tools';
import type { LocalSeries, LocalStudy } from '../../dicom/types';
import type { ViewportHandle } from '../types';
import { configureToolGroup, framesFor, toolClasses, type ToolName } from '../runtime';
import { scheduleEngineResize } from '../resizeEngine';
import { arrowTextConfiguration, cancelTextRequest } from '../annotations/textRequest';
import { releaseMagnifier } from '../tools/releaseMagnifier';

export function useCornerstoneViewport({
  slot,
  series,
  study,
  engine,
  tool,
  onReady,
}: {
  slot: string;
  series?: LocalSeries;
  study?: LocalStudy;
  engine: RenderingEngine;
  tool: ToolName;
  onReady: (slot: string, handle: ViewportHandle | null) => void;
}) {
  const element = useRef<HTMLDivElement>(null);
  const unique = useId();
  const viewportId = `${slot}-${unique}`;
  const frames = useMemo(() => (series ? framesFor(series) : []), [series]);
  const [loading, setLoading] = useState(Boolean(series));
  const [error, setError] = useState('');
  const [index, setIndex] = useState(0);
  const [voi, setVoi] = useState({ width: 0, level: 0 });
  const toolRef = useRef(tool);
  toolRef.current = tool;
  const studyRef = useRef(study);
  studyRef.current = study;
  const seriesRef = useRef(series);
  seriesRef.current = series;
  const framesRef = useRef(frames);
  framesRef.current = frames;
  const updateStack = useRef<() => void>(() => {});
  const seriesId = series?.id;
  useEffect(() => {
    const host = element.current,
      currentStudy = studyRef.current;
    if (!host || !seriesId || !currentStudy || !framesRef.current.length) return;
    let alive = true,
      ready = false;
    engine.enableElement({
      viewportId,
      type: Enums.ViewportType.STACK,
      element: host,
      defaultOptions: { background: [0, 0, 0] },
    });
    const viewport = engine.getViewport(viewportId) as Types.IStackViewport;
    const group = ToolGroupManager.createToolGroup(viewportId)!;
    Object.values(toolClasses).forEach((t) =>
      group.addTool(
        t.toolName,
        t === toolClasses.arrow
          ? arrowTextConfiguration(host)
          : t === toolClasses.magnify
            ? { magnifySize: 2, magnifyWidth: 160, magnifyHeight: 160 }
            : undefined,
      ),
    );
    group.addViewport(viewportId, engine.id);
    configureToolGroup(viewportId, toolRef.current);
    const update = () => {
      if (!alive) return;
      setError('');
      setIndex(viewport.getCurrentImageIdIndex());
      const range = viewport.getProperties().voiRange;
      if (range) {
        const next = {
          width: Math.round(range.upper - range.lower),
          level: Math.round((range.upper + range.lower) / 2),
        };
        setVoi((old) => (old.width === next.width && old.level === next.level ? old : next));
      }
    };
    const failed = () => {
      if (alive) setError('This image could not be decoded. Try another slice or series.');
    };
    const loadFailed = (event: Event) => {
      const id = (event as CustomEvent<{ imageId?: string }>).detail?.imageId;
      if (id && framesRef.current.some((frame) => frame.imageId === id)) failed();
    };
    host.addEventListener(Enums.Events.IMAGE_RENDERED, update);
    host.addEventListener(Enums.Events.STACK_NEW_IMAGE, update);
    eventTarget.addEventListener(Enums.Events.IMAGE_LOAD_ERROR, loadFailed);
    let lastWidth = 0,
      lastHeight = 0;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width === lastWidth && height === lastHeight) return;
      lastWidth = width;
      lastHeight = height;
      if (alive && ready && width > 0 && height > 0) scheduleEngineResize(engine);
    });
    observer.observe(host);
    let queue = Promise.resolve();
    let revision = 0;
    updateStack.current = () => {
      const requested = ++revision;
      queue = queue
        .then(async () => {
          if (!alive || requested !== revision) return;
          const nextSeries = seriesRef.current!;
          const ids = framesRef.current.map((frame) => frame.imageId);
          const previousId = ready ? viewport.getCurrentImageId() : undefined;
          const camera = ready ? viewport.getCamera() : undefined;
          const properties = ready ? viewport.getProperties() : undefined;
          await viewport.setStack(ids, Math.max(0, previousId ? ids.indexOf(previousId) : 0));
          if (!alive) return;
          if (camera) viewport.setCamera(camera);
          if (properties) viewport.setProperties(properties);
          ready = true;
          scheduleEngineResize(engine);
          viewport.render();
          setLoading(false);
          onReady(slot, { viewport, element: host, series: nextSeries, study: studyRef.current! });
          update();
        })
        .catch(() => {
          if (alive) {
            setLoading(false);
            failed();
          }
        });
    };
    return () => {
      alive = false;
      cancelTextRequest(host);
      releaseMagnifier(group);
      updateStack.current = () => {};
      observer.disconnect();
      host.removeEventListener(Enums.Events.IMAGE_RENDERED, update);
      host.removeEventListener(Enums.Events.STACK_NEW_IMAGE, update);
      eventTarget.removeEventListener(Enums.Events.IMAGE_LOAD_ERROR, loadFailed);
      onReady(slot, null);
      ToolGroupManager.destroyToolGroup(viewportId);
      if (!engine.hasBeenDestroyed) engine.disableElement(viewportId);
    };
  }, [engine, onReady, seriesId, slot, viewportId]);
  useEffect(() => {
    updateStack.current();
  }, [frames]);
  useEffect(() => {
    configureToolGroup(viewportId, tool);
  }, [tool, viewportId]);
  async function jump(value: number) {
    if (engine.hasBeenDestroyed) return;
    const viewport = engine.getViewport(viewportId) as Types.IStackViewport;
    if (!viewport) return;
    setError('');
    try {
      await viewport.setImageIdIndex(value);
    } catch {
      setError('This frame could not be decoded. Try another frame.');
    }
  }
  return {
    element,
    loading,
    error,
    index,
    voi,
    frames,
    jump,
    instance: frames[index]?.instance ?? series?.instances[0],
  };
}
