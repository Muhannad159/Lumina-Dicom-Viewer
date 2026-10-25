import { PlanarFreehandROITool, type Types } from '@cornerstonejs/tools';

/** Cornerstone 4 can clear invalidation during the final contour draw before
 * statistics run. Ensure each completed contour gets one statistics update. */
export default class FreehandROITool extends PlanarFreehandROITool {
  private completedContours = new WeakMap<Types.Annotation, unknown>();

  protected renderAnnotationInstance(context: Types.AnnotationRenderContext): boolean {
    const { annotation } = context;
    if (!this.isDrawing && !this.isEditingClosed && !this.isEditingOpen) {
      const points = annotation.data.contour?.polyline;
      if (points && this.completedContours.get(annotation) !== points) {
        annotation.invalidated = true;
        this.completedContours.set(annotation, points);
      }
    }
    return super.renderAnnotationInstance(context);
  }
}
