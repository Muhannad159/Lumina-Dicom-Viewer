import type { Layout, LocalInstance, LocalSeries, LocalStudy, ViewportAssignment } from './types';

const compare = (a: string, b: string) => a.localeCompare(b, 'en', { numeric: true });
function normal(orientation: number[]) {
  const [a, b, c, d, e, f] = orientation;
  return [b * f - c * e, c * d - a * f, a * e - b * d];
}
export function sortInstances(instances: LocalInstance[]): LocalInstance[] {
  const orientation = instances[0]?.orientation;
  const spatial =
    orientation?.length === 6 &&
    instances.every(
      (i) =>
        i.position?.length === 3 &&
        i.orientation?.length === 6 &&
        i.orientation.every((v, n) => Math.abs(v - orientation[n]) < 0.001),
    );
  const axis = spatial ? normal(orientation) : null;
  const distance = (i: LocalInstance) => i.position!.reduce((sum, v, n) => sum + v * axis![n], 0);
  return [...instances].sort((a, b) => {
    if (axis && Math.hypot(...axis) > 0.99) {
      const diff = distance(a) - distance(b);
      if (Math.abs(diff) > 0.001) return diff;
    }
    return (a.instanceNumber ?? Infinity) - (b.instanceNumber ?? Infinity) || compare(a.id, b.id);
  });
}
export const seriesKey = (studyUID: string, seriesUID: string) => `${studyUID}|${seriesUID}`;
export function buildCatalog(instances: LocalInstance[]): LocalStudy[] {
  const studies = new Map<string, LocalStudy>();
  const series = new Map<string, LocalSeries>();
  for (const instance of instances) {
    let study = studies.get(instance.studyUID);
    if (!study) {
      study = {
        id: instance.studyUID,
        patientName: instance.patientName,
        patientId: instance.patientId,
        description: instance.studyDescription,
        date: instance.studyDate,
        series: [],
      };
      studies.set(study.id, study);
    }
    const key = seriesKey(instance.studyUID, instance.seriesUID);
    let group = series.get(key);
    if (!group) {
      group = {
        id: key,
        studyUID: study.id,
        description: instance.seriesDescription,
        number: instance.seriesNumber,
        modality: instance.modality,
        instances: [],
        frameCount: 0,
      };
      study.series.push(group);
      series.set(key, group);
    }
    group.instances.push(instance);
    group.frameCount += instance.frames;
  }
  for (const study of studies.values()) {
    study.series.sort(
      (a, b) => (a.number ?? Infinity) - (b.number ?? Infinity) || compare(a.id, b.id),
    );
    study.series.forEach((s) => {
      s.instances = sortInstances(s.instances);
    });
  }
  return [...studies.values()].sort((a, b) => compare(b.date, a.date) || compare(a.id, b.id));
}
export function assignLayout(
  layout: Layout,
  activeSeriesId: string | null,
  studies: LocalStudy[],
): ViewportAssignment[] {
  const [rows, columns] = layout.split('x').map(Number);
  const study =
    studies.find((s) => s.series.some((series) => series.id === activeSeriesId)) ?? studies[0];
  const ids = study?.series.map((s) => s.id) ?? [];
  const ordered =
    activeSeriesId && ids.includes(activeSeriesId)
      ? [activeSeriesId, ...ids.filter((id) => id !== activeSeriesId)]
      : ids;
  return Array.from({ length: rows * columns }, (_, i) => ({
    viewportId: `viewport-${i}`,
    seriesId: ordered[i] ?? null,
  }));
}
export function formatDate(value: string) {
  return /^\d{8}$/.test(value)
    ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
    : value || 'Unknown date';
}
