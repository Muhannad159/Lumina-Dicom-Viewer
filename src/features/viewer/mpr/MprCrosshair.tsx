import type { PointerEvent } from 'react';
import type { Types } from '@cornerstonejs/core';
import type { CrosshairOverlay } from './useMprCrosshairs';
import { planes } from './planes';

export default function MprCrosshair({
  overlay,
  active,
  plane,
  onLocate,
}: {
  overlay: CrosshairOverlay;
  active: boolean;
  plane: number;
  onLocate: (point: Types.Point2) => void;
}) {
  const locate = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    onLocate([event.clientX - rect.left, event.clientY - rect.top]);
  };
  return (
    <svg
      data-testid="mpr-crosshair"
      aria-label={`Locate in ${planes[plane].name} view`}
      role={active ? 'application' : undefined}
      aria-hidden={!active}
      tabIndex={active ? 0 : undefined}
      className={`absolute inset-0 size-full overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${active ? 'touch-none cursor-crosshair' : 'pointer-events-none'}`}
      onPointerDown={(event) => {
        if (!active || event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.focus();
        event.currentTarget.setPointerCapture(event.pointerId);
        locate(event);
      }}
      onPointerMove={(event) => {
        if (active && event.currentTarget.hasPointerCapture(event.pointerId)) locate(event);
      }}
      onPointerUp={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId))
          event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onKeyDown={(event) => {
        const directions: Record<string, Types.Point2> = {
          ArrowLeft: [-1, 0],
          ArrowRight: [1, 0],
          ArrowUp: [0, -1],
          ArrowDown: [0, 1],
        };
        const direction = directions[event.key];
        if (!direction) return;
        event.preventDefault();
        event.stopPropagation();
        const step = event.shiftKey ? 10 : 2;
        onLocate([
          overlay.center[0] + direction[0] * step,
          overlay.center[1] + direction[1] * step,
        ]);
      }}
    >
      {overlay.lines.map((line) => (
        <line
          key={line.plane}
          x1={line.start[0]}
          y1={line.start[1]}
          x2={line.end[0]}
          y2={line.end[1]}
          stroke={planes[line.plane].color}
          strokeWidth="1"
          opacity="0.85"
        />
      ))}
      <circle
        cx={overlay.center[0]}
        cy={overlay.center[1]}
        r="4"
        fill="none"
        stroke="white"
        strokeWidth="1.5"
      />
    </svg>
  );
}
