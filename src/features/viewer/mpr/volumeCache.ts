import { cache } from '@cornerstonejs/core';
import type { LocalSeries } from '../../dicom/types';

const reservations = new Map<string, number>();
let baseline: number | undefined;

// Reserve capacity for resident volume images without adding an eligibility cap.
export function reserveVolumeCache(id: string, series: LocalSeries) {
  baseline ??= cache.getMaxCacheSize();
  const bytes = series.instances.reduce((sum, image) => sum + image.rows * image.columns * 4, 0);
  reservations.set(id, bytes);
  const resize = () =>
    cache.setMaxCacheSize(baseline! + [...reservations.values()].reduce((a, b) => a + b, 0));
  resize();
  return () => {
    if (!reservations.delete(id)) return;
    resize();
    if (!reservations.size) baseline = undefined;
    cache.decacheIfNecessaryUntilBytesAvailable(0);
  };
}
