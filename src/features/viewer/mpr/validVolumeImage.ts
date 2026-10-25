import type { Types } from '@cornerstonejs/core';
import type { LocalInstance } from '../../dicom/types';

// Some codec failures resolve with an empty buffer instead of rejecting.
// Validate before the volume uploads a slice to its texture.
export function validVolumeImage(
  image: Pick<Types.IImage, 'rows' | 'columns' | 'getPixelData'>,
  instance: LocalInstance,
) {
  try {
    return (
      image.rows === instance.rows &&
      image.columns === instance.columns &&
      image.getPixelData().length >= instance.rows * instance.columns
    );
  } catch {
    return false;
  }
}
