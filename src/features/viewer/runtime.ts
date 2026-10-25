import {
  init as initCore,
  cache,
  imageLoadPoolManager,
  imageRetrievalPoolManager,
  getRenderingEngine,
  Enums,
} from '@cornerstonejs/core';
import { init as initLoader, wadouri } from '@cornerstonejs/dicom-image-loader';
import {
  init as initTools,
  addTool,
  annotation,
  ToolGroupManager,
  cancelActiveManipulations,
  WindowLevelTool,
  PanTool,
  ZoomTool,
  StackScrollTool,
  LengthTool,
  RectangleROITool,
  EllipticalROITool,
  AngleTool,
  ProbeTool,
  MagnifyTool,
  ArrowAnnotateTool,
  BidirectionalTool,
  CobbAngleTool,
  SplineROITool,
  WindowLevelRegionTool,
  Enums as ToolEnums,
} from '@cornerstonejs/tools';
import type { ImageFrame, LocalInstance, LocalSeries, ParsedFile } from '../dicom/types';
import { releaseMagnifier } from './tools/releaseMagnifier';
import FreehandROITool from './tools/FreehandROITool';

export const toolClasses = {
  scroll: StackScrollTool,
  window: WindowLevelTool,
  pan: PanTool,
  zoom: ZoomTool,
  length: LengthTool,
  rectangle: RectangleROITool,
  ellipse: EllipticalROITool,
  angle: AngleTool,
  probe: ProbeTool,
  magnify: MagnifyTool,
  arrow: ArrowAnnotateTool,
  bidirectional: BidirectionalTool,
  cobb: CobbAngleTool,
  freehand: FreehandROITool,
  spline: SplineROITool,
  windowRegion: WindowLevelRegionTool,
};
export type ToolName = keyof typeof toolClasses;
let initialization: Promise<void> | null = null;
const fileIds = new Map<string, string>();
let frameCache = new WeakMap<LocalSeries, ImageFrame[]>();
export const instances = new Map<string, LocalInstance>();
export const thumbnailCache = new Map<string, string>();
const pendingTasks = new Set<Promise<unknown>>();
let sessionGeneration = 0;
export const getSessionGeneration = () => sessionGeneration;
export function trackTask<T>(promise: Promise<T>): Promise<T> {
  pendingTasks.add(promise);
  void promise.then(
    () => pendingTasks.delete(promise),
    () => pendingTasks.delete(promise),
  );
  return promise;
}

export function initializeCornerstone(): Promise<void> {
  if (!initialization)
    initialization = (async () => {
      await initCore();
      initLoader({
        maxWebWorkers: Math.min(3, Math.max(1, (navigator.hardwareConcurrency || 2) - 1)),
      });
      initTools();
      Object.values(toolClasses).forEach(addTool);
      cache.setMaxCacheSize(384 * 1024 * 1024);
      // A shared FrameOfReferenceUID must not join measurements from different series.
      const manager = annotation.state.getAnnotationManager();
      const defaultGroupKey = manager.getGroupKey.bind(manager);
      manager.getGroupKey = (selector: string | HTMLDivElement) =>
        typeof selector !== 'string' && selector.dataset.annotationGroup
          ? selector.dataset.annotationGroup
          : defaultGroupKey(selector);
      annotation.config.style.setDefaultToolStyles({
        global: {
          ...annotation.config.style.getDefaultToolStyles().global,
          textBoxFontSize: '14px',
          lineWidth: '1.5',
          color: 'rgb(108, 228, 197)',
          colorSelected: 'rgb(255, 210, 115)',
        },
      });
    })().catch((error) => {
      initialization = null;
      throw error;
    });
  return initialization;
}
export function registerFiles(parsed: ParsedFile[]) {
  // Commit only after parsing completes; cancellation cannot modify an existing session.
  for (const { file, instance } of parsed) {
    if (instances.has(instance.id)) continue;
    fileIds.set(instance.id, wadouri.fileManager.add(file));
    instances.set(instance.id, instance);
  }
}
export function framesFor(series: LocalSeries): ImageFrame[] {
  const cached = frameCache.get(series);
  if (cached) return cached;
  const frames = series.instances.flatMap((instance) => {
    const base = fileIds.get(instance.id);
    if (!base) return [];
    return Array.from({ length: instance.frames }, (_, i) => ({
      imageId: instance.frames > 1 ? `${base}?frame=${i + 1}` : base,
      instance,
      frame: i + 1,
    }));
  });
  frameCache.set(series, frames);
  return frames;
}
export function configureToolGroup(id: string, name: ToolName) {
  const group = ToolGroupManager.getToolGroup(id);
  if (!group) return;
  if (name !== 'magnify') releaseMagnifier(group);
  group.getViewportsInfo().forEach(({ renderingEngineId, viewportId }) => {
    const element = getRenderingEngine(renderingEngineId)?.getViewport(viewportId)?.element;
    if (element) cancelActiveManipulations(element);
  });
  for (const tool of Object.values(toolClasses))
    group.setToolPassive(tool.toolName, { removeAllBindings: true });
  const { MouseBindings: M } = ToolEnums;
  group.setToolActive(toolClasses[name].toolName, {
    bindings: [{ mouseButton: M.Primary }, { numTouchPoints: 1 }],
  });
  group.setToolActive(StackScrollTool.toolName, { bindings: [{ mouseButton: M.Wheel }] });
  group.setToolActive(PanTool.toolName, {
    bindings: [{ mouseButton: M.Auxiliary }, { numTouchPoints: 2 }],
  });
  group.setToolActive(ZoomTool.toolName, { bindings: [{ mouseButton: M.Secondary }] });
}
export async function clearSessionResources() {
  sessionGeneration++;
  annotation.state.removeAllAnnotations();
  annotation.selection.deselectAnnotation();
  for (const type of Object.values(Enums.RequestType)) {
    imageLoadPoolManager.clearRequestStack(type);
    imageRetrievalPoolManager.clearRequestStack(type);
  }
  // Let ongoing file reads finish before resetting the loader's numeric file IDs.
  // New imports remain disabled during this short teardown.
  const loads = [...instances.values()].flatMap((instance) => {
    const base = fileIds.get(instance.id);
    return Array.from({ length: instance.frames }, (_, i) => {
      const id = instance.frames > 1 ? `${base}?frame=${i + 1}` : base!;
      return cache.getImageLoadObject(id)?.promise;
    }).filter((promise): promise is NonNullable<typeof promise> => Boolean(promise));
  });
  await Promise.allSettled([...pendingTasks, ...loads]);
  cache.purgeCache();
  wadouri.dataSetCacheManager.purge();
  wadouri.fileManager.purge();
  getRenderingEngine('thumbnail-engine')?.destroy();
  instances.clear();
  fileIds.clear();
  frameCache = new WeakMap();
  thumbnailCache.forEach((url) => URL.revokeObjectURL(url));
  thumbnailCache.clear();
}
