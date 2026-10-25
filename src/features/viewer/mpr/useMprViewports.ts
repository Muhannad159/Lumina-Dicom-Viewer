import { useEffect, useRef, useState } from 'react';
import { Enums, utilities, type RenderingEngine, type Types } from '@cornerstonejs/core';
import {
  Enums as ToolEnums,
  ToolGroupManager,
  PanTool,
  ZoomTool,
  WindowLevelTool,
} from '@cornerstonejs/tools';
import { scheduleEngineResize } from '../resizeEngine';
import type { MprTool } from './MprToolbar';
import { planes } from './planes';

const tools = [PanTool, ZoomTool, WindowLevelTool];
export function useMprViewports(
  engine: RenderingEngine,
  volumeId: string | undefined,
  tool: MprTool,
) {
  const elements = useRef<(HTMLDivElement | null)[]>([]);
  const [viewports, setViewports] = useState<Types.IVolumeViewport[]>([]);
  const [error, setError] = useState('');
  const [slices, setSlices] = useState<{ index: number; total: number }[]>([]);
  useEffect(() => {
    if (!volumeId || engine.hasBeenDestroyed) return;
    let alive = true;
    const ids = planes.map(() => `mpr-${crypto.randomUUID()}`);
    const created: Types.IVolumeViewport[] = [];
    const listeners: Array<() => void> = [];
    const observer = new ResizeObserver(() => scheduleEngineResize(engine));
    const setup = async () => {
      for (let i = 0; i < planes.length; i++) {
        const host = elements.current[i]!;
        engine.enableElement({
          viewportId: ids[i],
          type: Enums.ViewportType.ORTHOGRAPHIC,
          element: host,
          defaultOptions: { orientation: planes[i].orientation, background: [0, 0, 0] },
        });
        observer.observe(host);
        created.push(engine.getViewport(ids[i]) as Types.IVolumeViewport);
      }
      await Promise.all(created.map((viewport) => viewport.setVolumes([{ volumeId }])));
      if (!alive) return;
      created.forEach((viewport, index) => {
        const group = ToolGroupManager.createToolGroup(viewport.id)!;
        tools.forEach((item) => group.addTool(item.toolName));
        group.addViewport(viewport.id, engine.id);
        const update = () => {
          if (!alive) return;
          const value = { index: viewport.getSliceIndex(), total: viewport.getNumberOfSlices() };
          setSlices((previous) => {
            if (previous[index]?.index === value.index && previous[index]?.total === value.total)
              return previous;
            const next = [...previous];
            next[index] = value;
            return next;
          });
        };
        const host = viewport.element;
        host.addEventListener(Enums.Events.CAMERA_MODIFIED, update);
        const wheel = (event: WheelEvent) => {
          if (event.target instanceof Element && event.target.closest('input, button')) return;
          event.preventDefault();
          event.stopPropagation();
          utilities.scroll(viewport, { volumeId, delta: Math.sign(event.deltaY) });
        };
        const panel = host.parentElement!;
        panel.addEventListener('wheel', wheel, { passive: false });
        listeners.push(() => {
          host.removeEventListener(Enums.Events.CAMERA_MODIFIED, update);
          panel.removeEventListener('wheel', wheel);
        });
        update();
        viewport.render();
      });
      scheduleEngineResize(engine);
      setViewports(created);
    };
    void setup().catch(() => {
      if (alive) setError('The MPR view could not be started for this series.');
    });
    return () => {
      alive = false;
      observer.disconnect();
      listeners.forEach((remove) => remove());
      ids.forEach((id) => {
        ToolGroupManager.destroyToolGroup(id);
        if (!engine.hasBeenDestroyed && engine.getViewport(id)) engine.disableElement(id);
      });
    };
  }, [engine, volumeId]);
  useEffect(() => {
    const mouse = ToolEnums.MouseBindings;
    viewports.forEach((viewport) => {
      const group = ToolGroupManager.getToolGroup(viewport.id);
      if (!group) return;
      tools.forEach((item) => group.setToolPassive(item.toolName, { removeAllBindings: true }));
      const selected =
        tool === 'pan'
          ? PanTool
          : tool === 'zoom'
            ? ZoomTool
            : tool === 'window'
              ? WindowLevelTool
              : undefined;
      if (selected)
        group.setToolActive(selected.toolName, {
          bindings: [{ mouseButton: mouse.Primary }, { numTouchPoints: 1 }],
        });
      if (selected !== ZoomTool)
        group.setToolActive(ZoomTool.toolName, { bindings: [{ mouseButton: mouse.Secondary }] });
      group.setToolActive(PanTool.toolName, {
        bindings: [{ mouseButton: mouse.Auxiliary }, { numTouchPoints: 2 }],
      });
    });
  }, [viewports, tool]);
  const scrollTo = (index: number, value: number) => {
    const viewport = viewports[index];
    if (viewport && volumeId)
      utilities.scroll(viewport, { volumeId, delta: value - viewport.getSliceIndex() });
  };
  const reset = () =>
    viewports.forEach((viewport) => {
      viewport.resetCamera();
      viewport.resetProperties();
      viewport.render();
    });
  return { elements, viewports, slices, scrollTo, reset, error, ready: viewports.length === 3 };
}
