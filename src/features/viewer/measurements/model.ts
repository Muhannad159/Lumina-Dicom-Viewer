import type { Types } from '@cornerstonejs/tools';

export interface MeasurementRow {
  id: string;
  label: string;
  tool: string;
  frameIndex: number;
  details: string;
  visible: boolean;
  selected: boolean;
  values: Record<string, string | number>;
}
const toolLabels: Record<string, string> = {
  Length: 'Length',
  RectangleROI: 'Rectangle ROI',
  EllipticalROI: 'Ellipse ROI',
  Angle: 'Angle',
  Probe: 'Pixel probe',
  ArrowAnnotate: 'Arrow annotation',
  Bidirectional: 'Bidirectional',
  CobbAngle: 'Cobb angle',
  PlanarFreehandROI: 'Freehand ROI',
  SplineROI: 'Spline ROI',
};
const metrics = [
  ['length', 'Length', 'unit'],
  ['width', 'Width', 'widthUnit'],
  ['angle', 'Angle', '°'],
  ['area', 'Area', 'areaUnit'],
  ['mean', 'Mean', 'modalityUnit'],
  ['stdDev', 'SD', 'modalityUnit'],
  ['value', 'Value', 'modalityUnit'],
] as const;
export function measurementDetails(item: Types.Annotation): string {
  const stats = Object.values(item.data.cachedStats ?? {}).find(
    (value) => value && typeof value === 'object',
  ) as Record<string, unknown> | undefined;
  if (!stats) return '';
  return metrics
    .flatMap(([key, name, unitKey]) => {
      const value = stats[key];
      if (typeof value !== 'number' || !Number.isFinite(value)) return [];
      const unit = unitKey === '°' ? '°' : stats[unitKey];
      return `${name}: ${Number(value.toFixed(2))}${typeof unit === 'string' ? ` ${unit}` : ''}`;
    })
    .join(' · ');
}
export function measurementRow(item: Types.Annotation, frameIndex: number): MeasurementRow {
  const tool =
    toolLabels[item.metadata?.toolName ?? ''] ?? item.metadata?.toolName ?? 'Measurement';
  return {
    id: item.annotationUID!,
    label: item.data.label || tool,
    tool,
    frameIndex,
    details: measurementDetails(item),
    visible: item.isVisible !== false,
    selected: Boolean(item.isSelected),
    values: Object.fromEntries(
      Object.entries(
        (Object.values(item.data.cachedStats ?? {}).find(
          (value) => value && typeof value === 'object',
        ) ?? {}) as Record<string, unknown>,
      ).filter(
        (entry): entry is [string, string | number] =>
          typeof entry[1] === 'string' ||
          (typeof entry[1] === 'number' && Number.isFinite(entry[1])),
      ),
    ),
  };
}
