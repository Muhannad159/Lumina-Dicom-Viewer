import type { LocalInstance, LocalSeries } from '../../dicom/types';
import type { Availability } from '../availability';
import { dot, normal, subtract } from '../comparison/geometry.ts';

const orientationTolerance = 0.01;
const spacingTolerance = 0.2;
const minimumSliceSpacing = 0.01;
const unavailable = (reason: string): Availability => ({ enabled: false, reason });

export function getMprEligibility(
  series: LocalSeries | undefined,
  limits: { maxTextureSize?: number } = {},
): Availability {
  if (!series) return unavailable('Choose a series first');
  const images = series.instances;
  if (images.some((image) => image.frames !== 1))
    return unavailable('Multiframe MPR needs per-frame spatial metadata');
  if (images.length < 2) return unavailable('Requires at least two spatial slices');
  const first = images[0];
  if (
    !first.frameOfReferenceUID ||
    images.some((image) => image.frameOfReferenceUID !== first.frameOfReferenceUID)
  )
    return unavailable('Requires one consistent Frame of Reference');
  if (images.some((image) => image.rows !== first.rows || image.columns !== first.columns))
    return unavailable('Image dimensions vary within this series');
  if (
    images.some(
      (image) =>
        image.samplesPerPixel !== 1 ||
        !['MONOCHROME1', 'MONOCHROME2'].includes(image.photometricInterpretation ?? ''),
    )
  )
    return unavailable('Requires a grayscale image stack');
  if (images.some((image) => ![8, 16, 32].includes(image.bitsAllocated ?? 0)))
    return unavailable('Pixel format is unsupported for MPR');
  if (images.some((image) => !validGeometry(image)))
    return unavailable('Requires image position, orientation, and pixel spacing for every slice');
  const orientation = first.orientation!;
  const spacing = first.pixelSpacing!;
  if (
    images.some((image) =>
      image.orientation!.some(
        (value, index) => Math.abs(value - orientation[index]) > orientationTolerance,
      ),
    )
  )
    return unavailable('Slice orientations vary within this series');
  if (
    images.some((image) =>
      image.pixelSpacing!.some(
        (value, index) => Math.abs(value - spacing[index]) > spacing[index] * 0.01,
      ),
    )
  )
    return unavailable('Pixel spacing varies within this series');
  const axis = normal(first)!;
  const row = orientation.slice(0, 3);
  const column = orientation.slice(3);
  const sorted = [...images].sort((a, b) => dot(a.position!, axis) - dot(b.position!, axis));
  const distances = sorted.slice(1).map((image, index) => {
    const delta = subtract(image.position!, sorted[index].position!);
    const drift = Math.hypot(dot(delta, row), dot(delta, column));
    return { through: dot(delta, axis), drift };
  });
  if (distances.some(({ through }) => through < minimumSliceSpacing))
    return unavailable('Slices have no distinct depth or contain duplicate positions');
  if (distances.some(({ drift }) => drift > Math.max(1, Math.min(...spacing))))
    return unavailable('Slices are sheared or shifted outside one volume grid');
  const median = [...distances.map(({ through }) => through)].sort((a, b) => a - b)[
    Math.floor(distances.length / 2)
  ];
  if (distances.some(({ through }) => Math.abs(through - median) > median * spacingTolerance))
    return unavailable('Irregular or missing slice spacing');
  if (
    limits.maxTextureSize &&
    Math.max(first.rows, first.columns, images.length) > limits.maxTextureSize
  )
    return unavailable('This volume exceeds the browser’s 3D texture limit');
  return { enabled: true };
}

function validGeometry(image: LocalInstance) {
  if (
    !image.position?.every(Number.isFinite) ||
    image.position.length !== 3 ||
    !image.orientation?.every(Number.isFinite) ||
    image.orientation.length !== 6 ||
    !image.pixelSpacing?.every((value) => Number.isFinite(value) && value > 0) ||
    image.pixelSpacing.length !== 2
  )
    return false;
  const row = image.orientation.slice(0, 3);
  const column = image.orientation.slice(3);
  return (
    Math.abs(Math.hypot(...row) - 1) < orientationTolerance &&
    Math.abs(Math.hypot(...column) - 1) < orientationTolerance &&
    Math.abs(dot(row, column)) < orientationTolerance &&
    Boolean(normal(image))
  );
}

export function browserMprLimits(): Availability | { maxTextureSize: number } {
  const gl = document.createElement('canvas').getContext('webgl2');
  if (!gl) return unavailable('MPR requires WebGL2 support');
  const maxTextureSize = gl.getParameter(gl.MAX_3D_TEXTURE_SIZE) as number;
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return { maxTextureSize };
}
