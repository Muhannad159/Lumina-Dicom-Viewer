import type { LocalInstance, LocalSeries } from '../../dicom/types';
function spaceUID(image: LocalInstance) {
  return (
    image.frameOfReferenceUID ||
    Object.entries(image.tags).find(([key]) => key.startsWith('0020,0052'))?.[1] ||
    ''
  );
}
export const dot = (a: number[], b: number[]) => a.reduce((sum, value, i) => sum + value * b[i], 0);
export const subtract = (a: number[], b: number[]) => a.map((v, i) => v - b[i]);
export function normal(instance: LocalInstance) {
  const v = instance.orientation;
  if (!v || v.length !== 6 || !v.every(Number.isFinite)) return;
  const n = [v[1] * v[5] - v[2] * v[4], v[2] * v[3] - v[0] * v[5], v[0] * v[4] - v[1] * v[3]];
  const length = Math.hypot(...n);
  return length > 0.00001 ? n.map((value) => value / length) : undefined;
}
export function sameSpace(a: LocalInstance, b: LocalInstance) {
  return (
    Boolean(spaceUID(a)) &&
    spaceUID(a) === spaceUID(b) &&
    (!a.patientId || !b.patientId || a.patientId === b.patientId)
  );
}
export function nearestSlice(source: LocalInstance, series: LocalSeries): number | undefined {
  const sourceNormal = normal(source);
  if (source.frames !== 1 || !source.position || !sourceNormal) return;
  let best: number | undefined,
    distance = Infinity;
  for (let i = 0; i < series.instances.length; i++) {
    const candidate = series.instances[i],
      targetNormal = normal(candidate);
    // Match usable frames only. Missing geometry in another image must not
    // disable spatial linking for the whole target series.
    if (
      candidate.frames !== 1 ||
      !candidate.position ||
      !targetNormal ||
      !sameSpace(source, candidate) ||
      Math.abs(dot(sourceNormal, targetNormal)) < 0.999
    )
      continue;
    const current = Math.abs(dot(subtract(candidate.position, source.position), sourceNormal));
    if (current < distance) {
      distance = current;
      best = i;
    }
  }
  return best;
}
export function intersectPlane(corners: number[][], point: number[], planeNormal: number[]) {
  const hits: number[][] = [];
  for (let i = 0; i < corners.length; i++) {
    const a = corners[i],
      b = corners[(i + 1) % corners.length];
    const da = dot(subtract(a, point), planeNormal),
      db = dot(subtract(b, point), planeNormal);
    if (Math.abs(da) < 1e-6) hits.push(a);
    else if (da * db < 0) hits.push(a.map((value, j) => value + (da / (da - db)) * (b[j] - value)));
  }
  const distinct = hits.filter(
    (hit, i) => !hits.slice(0, i).some((other) => Math.hypot(...subtract(hit, other)) < 1e-5),
  );
  return distinct.length === 2 ? distinct : undefined;
}
