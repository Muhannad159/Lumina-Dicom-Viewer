import { useEffect } from 'react';
import type { ToolName } from '../runtime';
import type { ViewerAction } from '../types';
import type { ViewerAvailability } from '../availability';
const shortcuts: Record<string, ToolName> = {
  s: 'scroll',
  w: 'window',
  p: 'pan',
  z: 'zoom',
  l: 'length',
  i: 'probe',
  m: 'magnify',
  a: 'arrow',
  b: 'bidirectional',
};
export function useViewerShortcuts(
  selectTool: (tool: ToolName) => void,
  action: (name: ViewerAction) => Promise<void>,
  toggleCine: () => void,
  availability: ViewerAvailability,
) {
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        document.querySelector('dialog[open], [role="dialog"]') ||
        (event.target instanceof HTMLElement &&
          (/INPUT|SELECT|TEXTAREA|BUTTON/.test(event.target.tagName) ||
            event.target.isContentEditable))
      )
        return;
      const key = event.key.toLowerCase();
      if (shortcuts[key]) {
        event.preventDefault();
        if (availability.tools[shortcuts[key]].enabled) selectTool(shortcuts[key]);
      } else if (key === 'r') {
        event.preventDefault();
        if (availability.actions.reset.enabled) void action('reset');
      } else if (key === 'delete' || key === 'backspace') {
        event.preventDefault();
        if (availability.actions.delete.enabled) void action('delete');
      } else if (key === ' ') {
        event.preventDefault();
        if (availability.cine.enabled) toggleCine();
      }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [selectTool, action, toggleCine, availability]);
}
