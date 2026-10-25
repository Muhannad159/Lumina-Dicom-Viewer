import { useRef } from 'react';
import type { MouseEvent, PointerEvent } from 'react';

/** Some browsers suppress the compatibility click immediately after a canvas
 * drag. Activate a completed touch tap directly, preserving toolbar swipes. */
export function useTouchButton() {
  const touch = useRef<{ x: number; y: number } | null>(null);
  const handled = useRef(-Infinity);
  return {
    onPointerDown(event: PointerEvent<HTMLButtonElement>) {
      touch.current = event.pointerType === 'touch' ? { x: event.clientX, y: event.clientY } : null;
    },
    onPointerMove(event: PointerEvent<HTMLButtonElement>) {
      const start = touch.current;
      if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8)
        touch.current = null;
    },
    onPointerCancel() {
      touch.current = null;
    },
    onPointerUp(event: PointerEvent<HTMLButtonElement>) {
      const tapped = touch.current;
      touch.current = null;
      if (!tapped || event.currentTarget.disabled || event.pointerType !== 'touch') return;
      handled.current = performance.now();
      event.currentTarget.click();
      event.preventDefault();
    },
    onClickCapture(event: MouseEvent<HTMLButtonElement>) {
      // The programmatic tap and keyboard activation have detail=0. Ignore
      // only a subsequent compatibility click, so each tap fires once.
      if (event.detail > 0 && performance.now() - handled.current < 700) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
  };
}
