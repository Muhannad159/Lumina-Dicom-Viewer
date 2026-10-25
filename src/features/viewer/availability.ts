import { annotation } from '@cornerstonejs/tools';
import type { ViewportHandle, ViewerAction } from './types';
import { framesFor, toolClasses, type ToolName } from './runtime';
import { dot, nearestSlice, normal, sameSpace } from './comparison/geometry';
import type { ViewportLinks } from './comparison/useViewportLinks';
import { getMprEligibility } from './mpr/eligibility';

export interface Availability {
  enabled: boolean;
  reason?: string;
}
const ready: Availability = { enabled: true };
const unavailable = (reason: string): Availability => ({ enabled: false, reason });

export interface ViewerAvailability {
  tools: Record<ToolName, Availability>;
  actions: Record<ViewerAction, Availability>;
  presets: Record<string, Availability>;
  cine: Availability;
  mpr: Availability;
  sync: Availability;
  syncOptions: Record<keyof ViewportLinks, Availability>;
}

export function getViewerAvailability(
  handle: ViewportHandle | undefined,
  handles: Map<string, ViewportHandle>,
  active: string,
  mprLimits: Availability | { maxTextureSize: number } = {
    maxTextureSize: Number.MAX_SAFE_INTEGER,
  },
): ViewerAvailability {
  const image =
    handle && framesFor(handle.series)[handle.viewport.getCurrentImageIdIndex()]?.instance;
  const imageStatus = image ? ready : unavailable('Open an image first');
  const multipleFrames = imageStatus.enabled && handle!.viewport.getImageIds().length > 1;
  const frameStatus = multipleFrames ? ready : unavailable('Requires more than one image or frame');
  const tools = Object.fromEntries(
    Object.keys(toolClasses).map((name) => [name, imageStatus]),
  ) as Record<ToolName, Availability>;
  tools.scroll = frameStatus;

  const imageIds = new Set(handle ? framesFor(handle.series).map((frame) => frame.imageId) : []);
  const seriesAnnotations = (handle ? annotation.state.getAllAnnotations() : []).filter((item) =>
    imageIds.has(item.metadata?.referencedImageId ?? ''),
  );
  const selected = new Set(handle ? annotation.selection.getAnnotationsSelected() : []);
  const hasSelection = seriesAnnotations.some(
    (item) => item.annotationUID && selected.has(item.annotationUID),
  );
  const actions: Record<ViewerAction, Availability> = {
    rotate: imageStatus,
    flipH: imageStatus,
    flipV: imageStatus,
    invert: imageStatus,
    reset: imageStatus,
    screenshot: imageStatus,
    metadata: imageStatus,
    measurements: imageStatus,
    bookmark: imageStatus,
    bookmarks: ready,
    clear: !image
      ? imageStatus
      : seriesAnnotations.length
        ? ready
        : unavailable('No measurements in this series'),
    delete: !image
      ? imageStatus
      : hasSelection
        ? ready
        : unavailable('Select a measurement in this series'),
    fullscreen:
      typeof document !== 'undefined' &&
      ('fullscreenElement' in document || 'requestFullscreen' in Element.prototype)
        ? ready
        : unavailable('Fullscreen is unavailable in this browser'),
  };
  const ctStatus = !image
    ? imageStatus
    : handle!.series.modality === 'CT'
      ? ready
      : unavailable('Requires a CT image');
  const presets: Record<string, Availability> = {
    default: imageStatus,
    soft: ctStatus,
    lung: ctStatus,
    bone: ctStatus,
    brain: ctStatus,
  };

  const peers = [...handles].filter(([slot]) => slot !== active).map(([, target]) => target);
  const sync = image && peers.length ? ready : unavailable('Requires two loaded viewports');
  const sameModality =
    image && peers.some((target) => target.series.modality === handle!.series.modality);
  const spatial = image && peers.some((target) => nearestSlice(image, target.series) !== undefined);
  const sourceNormal = image && normal(image);
  const references =
    image &&
    sourceNormal &&
    peers.some((target) => {
      const targetImage = framesFor(target.series)[target.viewport.getCurrentImageIdIndex()]
        ?.instance;
      const targetNormal = targetImage && normal(targetImage);
      return Boolean(
        targetImage &&
        targetImage.frames === 1 &&
        image.frames === 1 &&
        image.position &&
        targetImage.position &&
        targetNormal &&
        sameSpace(image, targetImage) &&
        Math.abs(dot(sourceNormal, targetNormal)) < 0.999,
      );
    });
  const syncOptions: Record<keyof ViewportLinks, Availability> = {
    windowLevel: !sync.enabled
      ? sync
      : sameModality
        ? ready
        : unavailable('Requires matching modalities'),
    zoomPan: sync,
    slices: !sync.enabled
      ? sync
      : spatial
        ? ready
        : unavailable('Requires compatible spatial stacks'),
    referenceLines: !sync.enabled
      ? sync
      : references
        ? ready
        : unavailable('Requires intersecting image planes'),
  };
  const mpr =
    'enabled' in mprLimits
      ? (mprLimits as Availability)
      : getMprEligibility(handle?.series, mprLimits);
  return { tools, actions, presets, cine: frameStatus, mpr, sync, syncOptions };
}
