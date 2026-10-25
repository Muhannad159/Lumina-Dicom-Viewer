import type { RenderingEngine } from '@cornerstonejs/core';
import { annotation } from '@cornerstonejs/tools';
import type { ViewerAction, ViewportHandle } from './types';
import { framesFor } from './runtime';

export function applyViewportAction(
  name: ViewerAction,
  target: ViewportHandle,
  engine?: RenderingEngine,
) {
  const vp = target.viewport;
  switch (name) {
    case 'rotate':
      vp.setViewPresentation({ rotation: (vp.getRotation() + 90) % 360 });
      break;
    case 'flipH':
      vp.setCamera({ flipHorizontal: !vp.getCamera().flipHorizontal });
      break;
    case 'flipV':
      vp.setCamera({ flipVertical: !vp.getCamera().flipVertical });
      break;
    case 'invert':
      vp.setProperties({ invert: !vp.getProperties().invert });
      break;
    case 'reset':
      vp.resetProperties();
      vp.resetCamera();
      vp.setCamera({ flipHorizontal: false, flipVertical: false });
      vp.setViewPresentation({ rotation: 0 });
      break;
    case 'clear':
    case 'delete': {
      const ids = new Set(framesFor(target.series).map((f) => f.imageId));
      const selected = new Set(annotation.selection.getAnnotationsSelected());
      for (const item of annotation.state.getAllAnnotations()) {
        if (
          item.annotationUID &&
          ids.has(item.metadata?.referencedImageId || '') &&
          (name === 'clear' || selected.has(item.annotationUID))
        )
          annotation.state.removeAnnotation(item.annotationUID);
      }
      engine?.render();
      break;
    }
  }
  vp.render();
}
export function applyWindowPreset(value: string, handle?: ViewportHandle) {
  if (!handle) return;
  const ranges: Record<string, [number, number]> = {
    soft: [400, 40],
    lung: [1500, -600],
    bone: [2000, 400],
    brain: [80, 40],
  };
  if (value === 'default') handle.viewport.resetProperties();
  else if (ranges[value]) {
    const [width, center] = ranges[value];
    handle.viewport.setProperties({
      voiRange: { lower: center - width / 2, upper: center + width / 2 },
    });
  }
  handle.viewport.render();
}
