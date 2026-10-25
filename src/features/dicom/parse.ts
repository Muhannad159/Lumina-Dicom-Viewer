import dicomParser from 'dicom-parser';
import type { ParseResult } from './types';

const syntaxes = new Set([
  '1.2.840.10008.1.2',
  '1.2.840.10008.1.2.1',
  '1.2.840.10008.1.2.2',
  '1.2.840.10008.1.2.1.99',
  '1.2.840.10008.1.2.5',
  ...[50, 51, 57, 70, 80, 81, 90, 91, 201, 202, 203].map((n) => `1.2.840.10008.1.2.4.${n}`),
]);
const labels: Record<string, string> = {
  x00080005: 'Specific Character Set',
  x00080016: 'SOP Class UID',
  x00080018: 'SOP Instance UID',
  x00080020: 'Study Date',
  x00080030: 'Study Time',
  x00080060: 'Modality',
  x00081030: 'Study Description',
  x0008103e: 'Series Description',
  x00100010: 'Patient Name',
  x00100020: 'Patient ID',
  x00100030: 'Birth Date',
  x00100040: 'Sex',
  x00101010: 'Age',
  x00180050: 'Slice Thickness',
  x0020000d: 'Study Instance UID',
  x0020000e: 'Series Instance UID',
  x00200011: 'Series Number',
  x00200013: 'Instance Number',
  x00200032: 'Image Position',
  x00200037: 'Image Orientation',
  x00200052: 'Frame of Reference UID',
  x00280004: 'Photometric Interpretation',
  x00280002: 'Samples per Pixel',
  x00280008: 'Number of Frames',
  x00280030: 'Pixel Spacing',
  x00280100: 'Bits Allocated',
  x00281050: 'Window Center',
  x00281051: 'Window Width',
  x00281052: 'Rescale Intercept',
  x00281053: 'Rescale Slope',
};
export const unreadableDicomReason = 'Not a readable DICOM Part 10 file, or the file is damaged.';
export function parseDicom(
  bytes: Uint8Array,
  fileName: string,
  relativePath: string,
  fileSize = bytes.length,
): ParseResult {
  try {
    // Stop at pixel data: metadata indexing never decompresses the image payload.
    const data = dicomParser.parseDicom(bytes, { untilTag: 'x7fe00010' });
    const characterSet = data.string('x00080005')?.trim() || '';
    const encodings: Record<string, string> = {
      ISO_IR_192: 'utf-8',
      ISO_IR_100: 'iso-8859-1',
      ISO_IR_101: 'iso-8859-2',
      ISO_IR_144: 'iso-8859-5',
      ISO_IR_127: 'iso-8859-6',
      ISO_IR_126: 'iso-8859-7',
      ISO_IR_138: 'iso-8859-8',
      ISO_IR_148: 'iso-8859-9',
      GB18030: 'gb18030',
      GBK: 'gbk',
    };
    const encoding = encodings[characterSet.replace(/ /g, '_')];
    const decoder = encoding ? new TextDecoder(encoding) : null;
    const str = (tag: string) => {
      const element = data.elements[tag];
      const value =
        decoder && element
          ? decoder.decode(
              data.byteArray.subarray(element.dataOffset, element.dataOffset + element.length),
            )
          : data.string(tag);
      return value?.replace(/\0/g, '').trim() || '';
    };
    const num = (tag: string) => {
      const value = str(tag);
      return value && Number.isFinite(Number(value)) ? Number(value) : undefined;
    };
    const vector = (tag: string, length: number) => {
      const values = str(tag).split('\\').map(Number);
      return values.length === length && values.every(Number.isFinite) ? values : undefined;
    };
    const sopClass = str('x00080016');
    if (sopClass === '1.2.840.10008.1.3.10')
      return {
        kind: 'unsupported',
        reason: 'DICOMDIR index; image files in the folder are imported separately.',
      };
    const studyUID = str('x0020000d'),
      seriesUID = str('x0020000e'),
      id = str('x00080018');
    if (![studyUID, seriesUID, id].every((uid) => uid.length <= 64 && /^\d+(\.\d+)+$/.test(uid))) {
      return { kind: 'failed', reason: 'Missing or malformed Study, Series, or SOP Instance UID.' };
    }
    const rows = data.uint16('x00280010') ?? 0,
      columns = data.uint16('x00280011') ?? 0;
    if (!rows || !columns || !data.elements.x7fe00010)
      return {
        kind: 'unsupported',
        reason:
          'No supported image pixel data (for example a report, presentation state, or segmentation object).',
      };
    // Structured derived objects need dedicated rendering, even when they contain pixels.
    if (['SEG', 'RTDOSE', 'RTSTRUCT', 'SR', 'PR'].includes(str('x00080060')))
      return {
        kind: 'unsupported',
        reason: `Dedicated ${str('x00080060')} rendering is not included.`,
      };
    const transferSyntax = str('x00020010');
    const pixelData = data.elements.x7fe00010;
    // Deflated dataset offsets refer to inflated bytes, not on-disk file size.
    if (
      transferSyntax !== '1.2.840.10008.1.2.1.99' &&
      pixelData.length !== 0xffffffff &&
      pixelData.dataOffset + pixelData.length > fileSize
    )
      return {
        kind: 'failed',
        reason: 'Truncated pixel data: the file ends before its declared image payload.',
      };
    if (!syntaxes.has(transferSyntax))
      return {
        kind: 'unsupported',
        reason: `Unsupported transfer syntax: ${transferSyntax || 'not specified'}.`,
      };
    const frames = num('x00280008') ?? 1;
    if (!Number.isInteger(frames) || frames < 1 || frames > 1000000)
      return { kind: 'failed', reason: 'Invalid frame count.' };
    const tags: Record<string, string> = {};
    for (const [tag, label] of Object.entries(labels)) {
      const value = str(tag);
      if (value) tags[`${tag.slice(1, 5)},${tag.slice(5)} · ${label}`] = value;
    }
    tags['0002,0010 · Transfer Syntax'] = transferSyntax;
    tags['0028,0010 · Rows'] = String(rows);
    tags['0028,0011 · Columns'] = String(columns);
    return {
      instance: {
        id,
        studyUID,
        seriesUID,
        fileName,
        relativePath,
        rows,
        columns,
        frames,
        transferSyntax,
        instanceNumber: num('x00200013'),
        position: vector('x00200032', 3),
        orientation: vector('x00200037', 6),
        pixelSpacing: vector('x00280030', 2),
        frameOfReferenceUID: str('x00200052'),
        bitsAllocated: data.uint16('x00280100'),
        bitsStored: data.uint16('x00280101'),
        highBit: data.uint16('x00280102'),
        pixelRepresentation: data.uint16('x00280103'),
        rescaleSlope: data.floatString('x00281053'),
        rescaleIntercept: data.floatString('x00281052'),
        windowCenter: data.floatString('x00281050'),
        windowWidth: data.floatString('x00281051'),
        samplesPerPixel: data.uint16('x00280002'),
        photometricInterpretation: str('x00280004'),
        patientName: str('x00100010').replace(/\^/g, ' ') || 'Unknown patient',
        patientId: str('x00100020'),
        patientSex: str('x00100040'),
        patientAge: str('x00101010'),
        studyDate: str('x00080020'),
        studyDescription: str('x00081030') || 'Untitled study',
        seriesDescription: str('x0008103e') || 'Untitled series',
        seriesNumber: num('x00200011'),
        modality: str('x00080060') || 'OT',
        tags,
      },
    };
  } catch {
    return { kind: 'failed', reason: unreadableDicomReason };
  }
}
