import type { MeasurementRow } from './model';
import type { ImageFrame, LocalSeries } from '../../dicom/types';

// Neutralize spreadsheet formulas in user labels before escaping CSV fields.
export function csvCell(value: string | number | boolean) {
  const text = String(value);
  const safe = /^[\s]*[=+@-]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}
export function serializeMeasurements(
  format: 'csv' | 'json',
  rows: MeasurementRow[],
  series: LocalSeries,
  frames: ImageFrame[],
) {
  const entries = rows.map((row) => ({
    annotationId: row.id,
    studyInstanceUID: series.studyUID,
    seriesInstanceUID: series.instances[0]?.seriesUID ?? '',
    sopInstanceUID: frames[row.frameIndex]?.instance.id ?? '',
    frameNumber: frames[row.frameIndex]?.frame ?? 1,
    tool: row.tool,
    label: row.label,
    visible: row.visible,
    measurements: row.details,
    values: row.values,
  }));
  if (format === 'json')
    return JSON.stringify({ application: 'Lumina', version: 1, annotations: entries }, null, 2);
  const columns = [
    'annotationId',
    'studyInstanceUID',
    'seriesInstanceUID',
    'sopInstanceUID',
    'frameNumber',
    'tool',
    'label',
    'visible',
    'measurements',
  ] as const;
  return [
    columns.map(csvCell).join(','),
    ...entries.map((entry) => columns.map((key) => csvCell(entry[key])).join(',')),
  ].join('\r\n');
}
