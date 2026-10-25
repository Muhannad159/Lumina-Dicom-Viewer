// Generated test images contain invented identifiers and anatomy-like geometric shapes only.
const uidRoot = '1.2.826.0.1.3680043.10.543';
function element(group, tag, vr, value) {
  let data;
  if (Buffer.isBuffer(value)) data = value;
  else if (vr === 'US') {
    data = Buffer.alloc(2);
    data.writeUInt16LE(value);
  } else if (vr === 'UL') {
    data = Buffer.alloc(4);
    data.writeUInt32LE(value);
  } else {
    data = Buffer.from(String(value), 'ascii');
    if (data.length % 2) data = Buffer.concat([data, Buffer.from([vr === 'UI' ? 0 : 32])]);
  }
  const long = ['OB', 'OW', 'SQ', 'UN', 'UT'].includes(vr);
  const header = Buffer.alloc(long ? 12 : 8);
  header.writeUInt16LE(group, 0);
  header.writeUInt16LE(tag, 2);
  header.write(vr, 4);
  if (long) header.writeUInt32LE(data.length, 8);
  else header.writeUInt16LE(data.length, 6);
  return Buffer.concat([header, data]);
}
function item(data, tag = 0xe000) {
  const header = Buffer.alloc(8);
  header.writeUInt16LE(0xfffe);
  header.writeUInt16LE(tag, 2);
  header.writeUInt32LE(data.length, 4);
  return Buffer.concat([header, data]);
}
function rleFrame(pixels) {
  const header = Buffer.alloc(64);
  header.writeUInt32LE(1);
  header.writeUInt32LE(64, 4);
  const chunks = [header];
  for (let i = 0; i < pixels.length; i += 128) {
    const chunk = pixels.subarray(i, i + 128);
    chunks.push(Buffer.from([chunk.length - 1]), chunk);
  }
  const result = Buffer.concat(chunks);
  return result.length % 2 ? Buffer.concat([result, Buffer.alloc(1)]) : result;
}
export function dicomFixture({
  study = 1,
  series = 1,
  instance = 1,
  frames = 1,
  compressed = false,
  corruptPixels = false,
  missingUID = false,
  syntax,
  size = 128,
  headerPadding = 0,
  position,
  orientation = '1\\0\\0\\0\\1\\0',
  modality = compressed ? 'OT' : 'CT',
  frameOfReference = `${uidRoot}.${study}.888`,
} = {}) {
  const sop = `${uidRoot}.${study}.${series}.${instance}`;
  const sopClass = frames > 1 ? '1.2.840.10008.5.1.4.1.1.7.2' : '1.2.840.10008.5.1.4.1.1.2';
  const transferSyntax = syntax ?? (compressed ? '1.2.840.10008.1.2.5' : '1.2.840.10008.1.2.1');
  const meta = Buffer.concat([
    element(2, 1, 'OB', Buffer.from([0, 1])),
    element(2, 2, 'UI', sopClass),
    element(2, 3, 'UI', sop),
    element(2, 0x10, 'UI', transferSyntax),
    element(2, 0x12, 'UI', `${uidRoot}.999`),
  ]);
  const tags = [
    element(8, 0x16, 'UI', sopClass),
    element(8, 0x18, 'UI', sop),
    element(8, 0x20, 'DA', '20260901'),
    element(8, 0x30, 'TM', '120000'),
    element(8, 0x60, 'CS', modality),
    element(8, 0x1030, 'LO', study === 1 ? 'Synthetic head study' : 'Synthetic comparison'),
    element(
      8,
      0x103e,
      'LO',
      compressed
        ? 'RLE compressed image'
        : frames > 1
          ? 'Multiframe sequence'
          : `Axial series ${series}`,
    ),
    element(0x10, 0x10, 'PN', study === 1 ? 'DEMO^PATIENT^ONE' : 'DEMO^PATIENT^TWO'),
    element(0x10, 0x20, 'LO', `SYNTHETIC-${study}`),
    element(0x10, 0x40, 'CS', 'O'),
    ...(headerPadding ? [element(0x11, 0x1010, 'OB', Buffer.alloc(headerPadding))] : []),
    element(0x20, 0x0d, 'UI', missingUID ? '' : `${uidRoot}.${study}`),
    element(0x20, 0x0e, 'UI', `${uidRoot}.${study}.${series}`),
    element(0x20, 0x11, 'IS', series),
    element(0x20, 0x13, 'IS', instance),
    element(0x20, 0x32, 'DS', position ?? `0\\0\\${instance * 2}`),
    element(0x20, 0x37, 'DS', orientation),
    element(0x20, 0x52, 'UI', frameOfReference),
    element(0x28, 2, 'US', 1),
    element(0x28, 4, 'CS', 'MONOCHROME2'),
    ...(frames > 1 ? [element(0x28, 8, 'IS', frames)] : []),
    element(0x28, 0x10, 'US', size),
    element(0x28, 0x11, 'US', size),
    element(0x28, 0x30, 'DS', '1\\1'),
    element(0x28, 0x100, 'US', compressed ? 8 : 16),
    element(0x28, 0x101, 'US', compressed ? 8 : 16),
    element(0x28, 0x102, 'US', compressed ? 7 : 15),
    element(0x28, 0x103, 'US', 0),
    element(0x28, 0x1050, 'DS', compressed ? '128' : '40'),
    element(0x28, 0x1051, 'DS', compressed ? '256' : '400'),
    element(0x28, 0x1052, 'DS', compressed ? '0' : '-1024'),
    element(0x28, 0x1053, 'DS', '1'),
  ];
  const pixels = Buffer.alloc(size * size * frames * (compressed ? 1 : 2));
  for (let f = 0; f < frames; f++)
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const nx = (x - size / 2) / (size * 0.34),
          ny = (y - size / 2) / (size * 0.42);
        const r = nx * nx + ny * ny;
        let value =
          r > 1
            ? 0
            : r > 0.85
              ? 1600
              : 1050 + 45 * Math.sin(x * 0.18 + f + instance) * Math.cos(y * 0.16);
        if (r < 0.85 && Math.abs(nx) < 0.13 && ny > -0.25 && ny < 0.25) value = 1010;
        if (compressed) pixels[f * size * size + y * size + x] = Math.min(255, value / 6);
        else pixels.writeUInt16LE(Math.round(value), (f * size * size + y * size + x) * 2);
      }
  let pixelElement;
  if (compressed) {
    const header = Buffer.alloc(12);
    header.writeUInt16LE(0x7fe0);
    header.writeUInt16LE(0x10, 2);
    header.write('OB', 4);
    header.writeUInt32LE(0xffffffff, 8);
    pixelElement = Buffer.concat([
      header,
      item(Buffer.alloc(0)),
      item(corruptPixels ? Buffer.alloc(2) : rleFrame(pixels)),
      item(Buffer.alloc(0), 0xe0dd),
    ]);
  } else pixelElement = element(0x7fe0, 0x10, 'OW', pixels);
  return Buffer.concat([
    Buffer.alloc(128),
    Buffer.from('DICM'),
    element(2, 0, 'UL', meta.length),
    meta,
    ...tags,
    pixelElement,
  ]);
}
export function sampleFiles() {
  const files = [];
  for (let series = 1; series <= 3; series++)
    for (let instance = 1; instance <= 5; instance++) {
      files.push({
        name: `study1-series${series}-image${instance}${instance % 2 ? '.dcm' : ''}`,
        mimeType: 'application/dicom',
        buffer: dicomFixture({ series, instance }),
      });
    }
  files.push({
    name: 'multiframe.dcm',
    mimeType: 'application/dicom',
    buffer: dicomFixture({ study: 2, frames: 8 }),
  });
  files.push({
    name: 'compressed.dcm',
    mimeType: 'application/dicom',
    buffer: dicomFixture({ study: 2, series: 2, compressed: true }),
  });
  return files;
}
