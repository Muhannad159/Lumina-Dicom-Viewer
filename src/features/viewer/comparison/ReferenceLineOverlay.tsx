import { useEffect, useState } from 'react';
import { Enums, utilities, type Types } from '@cornerstonejs/core';
import type { ViewportHandle } from '../types';
import { framesFor } from '../runtime';
import { dot, intersectPlane, normal, sameSpace } from './geometry';
export default function ReferenceLineOverlay({
  source,
  target,
}: {
  source?: ViewportHandle;
  target?: ViewportHandle;
}) {
  const [line, setLine] = useState<number[]>();
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      if (!source || !target || source === target) {
        setLine(undefined);
        return;
      }
      const a = framesFor(source.series)[source.viewport.getCurrentImageIdIndex()]?.instance;
      const b = framesFor(target.series)[target.viewport.getCurrentImageIdIndex()]?.instance;
      const an = a && normal(a),
        bn = b && normal(b);
      if (
        !a ||
        !b ||
        a.frames !== 1 ||
        b.frames !== 1 ||
        !an ||
        !bn ||
        !a.position ||
        !b.position ||
        !sameSpace(a, b) ||
        Math.abs(dot(an, bn)) > 0.999
      ) {
        setLine(undefined);
        return;
      }
      const corners = utilities.getViewportImageCornersInWorld(target.viewport);
      const intersection = intersectPlane(
        [corners[0], corners[1], corners[3], corners[2]],
        a.position,
        an,
      );
      setLine(
        intersection?.flatMap((point) => target.viewport.worldToCanvas(point as Types.Point3)),
      );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const elements = [
      ...new Set(
        [source?.element, target?.element].filter((element): element is HTMLDivElement =>
          Boolean(element),
        ),
      ),
    ];
    const events = [
      Enums.Events.STACK_NEW_IMAGE,
      Enums.Events.CAMERA_MODIFIED,
      Enums.Events.IMAGE_RENDERED,
    ];
    elements.forEach((element) =>
      events.forEach((event) => element.addEventListener(event, schedule)),
    );
    const observer = new ResizeObserver(schedule);
    elements.forEach((element) => observer.observe(element));
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      elements.forEach((element) =>
        events.forEach((event) => element.removeEventListener(event, schedule)),
      );
    };
  }, [source, target]);
  return line ? (
    <svg
      aria-label="Active viewport reference line"
      className="pointer-events-none absolute inset-0 size-full overflow-hidden text-accent"
    >
      <line
        data-testid="reference-line"
        x1={line[0]}
        y1={line[1]}
        x2={line[2]}
        y2={line[3]}
        stroke="currentColor"
        strokeWidth={1.5}
        strokeDasharray="8 4"
      />
    </svg>
  ) : null;
}
