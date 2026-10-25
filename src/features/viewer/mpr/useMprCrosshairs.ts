import { useCallback, useEffect, useRef, useState } from 'react';
import { cache, Enums, type Types } from '@cornerstonejs/core';

export interface CrosshairLine {
  start: Types.Point2;
  end: Types.Point2;
  plane: number;
}
export interface CrosshairOverlay {
  center: Types.Point2;
  lines: CrosshairLine[];
}
const dot = (a: number[], b: number[]) =>
  a.reduce((sum, value, index) => sum + value * b[index], 0);
const samePoint = (a: Types.Point2, b: Types.Point2) => a[0] === b[0] && a[1] === b[1];

export function useMprCrosshairs(viewports: Types.IVolumeViewport[], volumeId?: string) {
  const center = useRef<Types.Point3 | undefined>(undefined);
  const moving = useRef(false);
  const [overlays, setOverlays] = useState<CrosshairOverlay[]>([]);
  const redraw = useCallback(() => {
    const point = center.current;
    if (!point) return;
    const next = viewports.map((viewport, index) => {
      if (!viewport.element.clientWidth || !viewport.element.clientHeight)
        return { center: [0, 0] as Types.Point2, lines: [] };
      const n = viewport.getCamera().viewPlaneNormal!;
      const lines = viewports.flatMap((other, plane) => {
        if (plane === index) return [];
        const m = other.getCamera().viewPlaneNormal!;
        const direction = [
          n[1] * m[2] - n[2] * m[1],
          n[2] * m[0] - n[0] * m[2],
          n[0] * m[1] - n[1] * m[0],
        ];
        return [
          {
            plane,
            start: viewport.worldToCanvas(
              point.map((v, i) => v - direction[i] * 10000) as Types.Point3,
            ),
            end: viewport.worldToCanvas(
              point.map((v, i) => v + direction[i] * 10000) as Types.Point3,
            ),
          },
        ];
      });
      return { center: viewport.worldToCanvas(point), lines };
    });
    // Image loading causes renders even when the crosshair hasn't moved.
    setOverlays((previous) =>
      previous.length === next.length &&
      previous.every(
        (overlay, index) =>
          samePoint(overlay.center, next[index].center) &&
          overlay.lines.length === next[index].lines.length &&
          overlay.lines.every(
            (line, i) =>
              samePoint(line.start, next[index].lines[i].start) &&
              samePoint(line.end, next[index].lines[i].end),
          ),
      )
        ? previous
        : next,
    );
  }, [viewports]);

  useEffect(() => {
    if (viewports.length !== 3) return;
    center.current = [...viewports[0].getCamera().focalPoint!] as Types.Point3;
    let frame = 0;
    const schedule = () => {
      if (!frame)
        frame = requestAnimationFrame(() => {
          frame = 0;
          redraw();
        });
    };
    const remove = viewports.map((viewport) => {
      const cameraChanged = () => {
        if (!moving.current && center.current) {
          const { focalPoint, viewPlaneNormal: normal } = viewport.getCamera();
          const distance = dot(
            focalPoint!.map((v, i) => v - center.current![i]),
            normal!,
          );
          center.current = center.current.map((v, i) => v + normal![i] * distance) as Types.Point3;
        }
        schedule();
      };
      viewport.element.addEventListener(Enums.Events.CAMERA_MODIFIED, cameraChanged);
      viewport.element.addEventListener(Enums.Events.IMAGE_RENDERED, schedule);
      return () => {
        viewport.element.removeEventListener(Enums.Events.CAMERA_MODIFIED, cameraChanged);
        viewport.element.removeEventListener(Enums.Events.IMAGE_RENDERED, schedule);
      };
    });
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      remove.forEach((fn) => fn());
    };
  }, [viewports, redraw]);

  const locate = (index: number, canvasPoint: Types.Point2) => {
    const source = viewports[index];
    const volume = volumeId ? cache.getVolume(volumeId) : undefined;
    if (!source || !volume?.imageData) return;
    const world = source.canvasToWorld(canvasPoint);
    const ijk = volume.imageData.worldToIndex(world);
    const clamped = ijk.map((value, axis) =>
      Math.max(0, Math.min(volume.dimensions[axis] - 1, value)),
    ) as Types.Point3;
    const point = volume.imageData.indexToWorld(clamped) as Types.Point3;
    center.current = point;
    moving.current = true;
    try {
      viewports.forEach((viewport) => {
        const { focalPoint, position, viewPlaneNormal: normal } = viewport.getCamera();
        const distance = dot(
          point.map((v, i) => v - focalPoint![i]),
          normal!,
        );
        const shift = (p: Types.Point3) =>
          p.map((v, i) => v + normal![i] * distance) as Types.Point3;
        viewport.setCamera({ focalPoint: shift(focalPoint!), position: shift(position!) });
        viewport.render();
      });
    } finally {
      moving.current = false;
    }
    redraw();
  };
  return { overlays, locate };
}
