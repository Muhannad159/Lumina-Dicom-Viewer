import type { LocalInstance } from '../../dicom/types';

// Fallback only while constructing MPR. The loader's complete metadata takes
// precedence once an image has been read; enhanced multiframe is not inferred.
export function indexedMetadata(type: string, image: LocalInstance) {
  if (image.frames !== 1) return;
  switch (type) {
    case 'imagePlaneModule':
      return {
        rows: image.rows,
        columns: image.columns,
        frameOfReferenceUID: image.frameOfReferenceUID,
        imagePositionPatient: image.position,
        imageOrientationPatient: image.orientation,
        rowCosines: image.orientation?.slice(0, 3),
        columnCosines: image.orientation?.slice(3),
        pixelSpacing: image.pixelSpacing,
        rowPixelSpacing: image.pixelSpacing?.[0],
        columnPixelSpacing: image.pixelSpacing?.[1],
      };
    case 'imagePixelModule':
      return {
        rows: image.rows,
        columns: image.columns,
        bitsAllocated: image.bitsAllocated,
        bitsStored: image.bitsStored,
        highBit: image.highBit,
        pixelRepresentation: image.pixelRepresentation,
        samplesPerPixel: image.samplesPerPixel,
        photometricInterpretation: image.photometricInterpretation,
      };
    case 'generalSeriesModule':
      return {
        modality: image.modality,
        seriesInstanceUID: image.seriesUID,
        studyInstanceUID: image.studyUID,
      };
    case 'modalityLutModule':
      return {
        rescaleSlope: image.rescaleSlope ?? 1,
        rescaleIntercept: image.rescaleIntercept ?? 0,
      };
    case 'voiLutModule':
      if (image.windowWidth && image.windowCenter !== undefined)
        return { windowWidth: [image.windowWidth], windowCenter: [image.windowCenter] };
      return;
    case 'transferSyntax':
      return { transferSyntaxUID: image.transferSyntax };
  }
}
