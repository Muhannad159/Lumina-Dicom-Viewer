import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDicom } from '../src/features/dicom/parse.ts';
import { buildCatalog, sortInstances, assignLayout } from '../src/features/dicom/catalog.ts';
import { collectEntries, parseFiles } from '../src/features/dicom/importer.ts';
import { dicomFixture, sampleFiles } from './fixtures.mjs';
import { nearestSlice, intersectPlane } from '../src/features/viewer/comparison/geometry.ts';
import { getMprEligibility } from '../src/features/viewer/mpr/eligibility.ts';
import { readMetadata } from '../src/features/dicom/readMetadata.ts';
import { indexedMetadata } from '../src/features/viewer/mpr/indexedMetadata.ts';
import { validVolumeImage } from '../src/features/viewer/mpr/validVolumeImage.ts';
import { csvCell, serializeMeasurements } from '../src/features/viewer/measurements/export.ts';

Object.defineProperty(globalThis, 'navigator', {
  value: { hardwareConcurrency: 4 },
  configurable: true,
});

const parse = (options) =>
  parseDicom(new Uint8Array(dicomFixture(options)), 'image', 'folder/image');
test('metadata reads stop before large pixel payloads and grow for long headers', async () => {
  for (const headerPadding of [0, 180000]) {
    const file = new File([dicomFixture({ size: 1024, headerPadding })], 'extensionless');
    let bytesRead = 0;
    const slice = file.slice.bind(file);
    file.slice = (start, end) => {
      bytesRead += end - start;
      return slice(start, end);
    };
    const result = await readMetadata(file, file.name);
    assert.ok('instance' in result);
    assert.equal(result.instance.rows, 1024);
    assert.ok(bytesRead < file.size / 4, `read ${bytesRead} of ${file.size}`);
    assert.equal(indexedMetadata('modalityLutModule', result.instance).rescaleIntercept, -1024);
    assert.equal(indexedMetadata('imagePixelModule', result.instance).bitsStored, 16);
  }
});
test('header reading preserves compressed/multiframe metadata and rejects invalid input', async () => {
  for (const options of [{ compressed: true }, { frames: 10 }]) {
    const file = new File([dicomFixture(options)], 'image');
    assert.deepEqual(
      await readMetadata(file, 'image'),
      parseDicom(new Uint8Array(await file.arrayBuffer()), 'image', 'image'),
    );
  }
  assert.equal((await readMetadata(new File(['bad'], 'bad'), 'bad')).kind, 'failed');
  assert.equal((await readMetadata(new File([], 'empty'), 'empty')).kind, 'failed');
  const truncated = new File([dicomFixture().subarray(0, 1600)], 'truncated');
  assert.match((await readMetadata(truncated, 'truncated')).reason, /Truncated pixel data/);
});
test('spatial links match compatible planes and reject unregistered or unpositioned stacks', () => {
  const source = parse({ instance: 2 }).instance;
  const target = buildCatalog([
    parse({ series: 2, instance: 1 }).instance,
    parse({ series: 2, instance: 3 }).instance,
  ]).at(0).series[0];
  assert.equal(nearestSlice(source, target), 0);
  assert.equal(nearestSlice(parse({ study: 2 }).instance, target), undefined);
  assert.equal(nearestSlice({ ...source, orientation: undefined }, target), undefined);
  assert.equal(nearestSlice({ ...source, frames: 2 }, target), undefined);
  assert.equal(
    nearestSlice({ ...source, frameOfReferenceUID: undefined, tags: {} }, target),
    undefined,
  );
  const reversed = { ...source, orientation: [-1, 0, 0, 0, 1, 0] };
  assert.equal(nearestSlice(reversed, target), 0);
  const partial = {
    ...target,
    instances: [{ ...target.instances[0], position: undefined }, target.instances[1]],
  };
  assert.equal(nearestSlice(source, partial), 1);
  const sharedSpace = { ...source, studyUID: '1.2.3.999' };
  assert.equal(nearestSlice(sharedSpace, target), 0);
});
test('MPR rejects empty decoded buffers and mismatched dimensions while accepting black images', () => {
  const instance = parse({ size: 64 }).instance;
  const image = { rows: 64, columns: 64, getPixelData: () => new Uint16Array(64 * 64) };
  assert.equal(validVolumeImage(image, instance), true);
  assert.equal(
    validVolumeImage({ ...image, getPixelData: () => new Uint16Array(0) }, instance),
    false,
  );
  assert.equal(validVolumeImage({ ...image, columns: 32 }, instance), false);
});
test('MPR eligibility accepts regular spatial stacks and explains invalid geometry', () => {
  const images = [1, 2, 3].map((instance) => parse({ instance }).instance);
  const series = buildCatalog(images)[0].series[0];
  assert.equal(getMprEligibility(series).enabled, true);
  assert.match(
    getMprEligibility({ ...series, instances: [images[0]] }).reason,
    /two spatial slices/,
  );
  assert.match(
    getMprEligibility({ ...series, instances: [{ ...images[0], frames: 3 }] }).reason,
    /Multiframe/,
  );
  assert.match(
    getMprEligibility({
      ...series,
      instances: [images[0], { ...images[1], pixelSpacing: undefined }],
    }).reason,
    /pixel spacing/,
  );
  assert.match(
    getMprEligibility({
      ...series,
      instances: [images[0], { ...images[1], orientation: [0, 1, 0, 1, 0, 0] }],
    }).reason,
    /orientations vary/,
  );
  assert.match(
    getMprEligibility({
      ...series,
      instances: [images[0], { ...images[1], position: images[0].position }],
    }).reason,
    /distinct depth/,
  );
  assert.match(getMprEligibility(series, { maxTextureSize: 2 }).reason, /texture limit/);
  assert.match(
    getMprEligibility({
      ...series,
      instances: [images[0], images[1], { ...images[2], position: [0, 0, 40] }],
    }).reason,
    /Irregular or missing slice spacing/,
  );
  const largeSeries = {
    ...series,
    instances: Array.from({ length: 200 }, (_, index) => ({
      ...images[0],
      rows: 1024,
      columns: 1024,
      position: [0, 0, index * 10],
    })),
  };
  assert.equal(getMprEligibility(largeSeries, { maxTextureSize: 2048 }).enabled, true);
});
test('reference line intersections handle crossing, parallel and outside planes', () => {
  const corners = [
    [0, 0, 0],
    [10, 0, 0],
    [10, 10, 0],
    [0, 10, 0],
  ];
  assert.deepEqual(intersectPlane(corners, [0, 5, 0], [0, 1, 0]), [
    [10, 5, 0],
    [0, 5, 0],
  ]);
  assert.equal(intersectPlane(corners, [0, 15, 0], [0, 1, 0]), undefined);
  assert.equal(intersectPlane(corners, [0, 0, 1], [0, 0, 1]), undefined);
});
test('measurement export preserves UIDs and frames and escapes spreadsheet formulas, quotes and line breaks', () => {
  assert.equal(csvCell('=SUM(A1)'), '"\'=SUM(A1)"');
  assert.equal(csvCell('a,"b"\nc'), '"a,""b""\nc"');
  const instance = parse({ frames: 8 }).instance;
  const series = buildCatalog([instance])[0].series[0];
  const row = {
    id: 'test',
    label: '=danger',
    tool: 'Length',
    frameIndex: 0,
    visible: true,
    selected: false,
    details: 'Length: 3 mm',
    values: { length: 3, unit: 'mm' },
  };
  const result = JSON.parse(
    serializeMeasurements('json', [row], series, [{ instance, frame: 4, imageId: 'local' }]),
  );
  assert.equal(result.annotations[0].sopInstanceUID, instance.id);
  assert.equal(result.annotations[0].frameNumber, 4);
  assert.equal(result.annotations[0].values.length, 3);
  assert.ok(serializeMeasurements('csv', [row], series, []).includes("'=danger"));
});
test('indexes extensionless images and separates patients, studies and series by UID', () => {
  const instances = sampleFiles().map(
    (f) => parseDicom(new Uint8Array(f.buffer), f.name, f.name).instance,
  );
  assert.ok(instances.every(Boolean));
  const catalog = buildCatalog(instances);
  assert.equal(catalog.length, 2);
  assert.equal(catalog[0].series.length, 3);
  assert.equal(catalog[1].series[0].frameCount, 8);
  assert.notEqual(catalog[0].patientId, catalog[1].patientId);
});
test('accepts RLE and multiframe metadata without decoding pixels', () => {
  assert.equal(parse({ compressed: true }).instance.transferSyntax, '1.2.840.10008.1.2.5');
  assert.equal(parse({ frames: 8 }).instance.frames, 8);
});
test('reports unsupported syntax, missing identifiers and corrupt files', () => {
  assert.equal(parse({ syntax: '1.2.840.10008.1.2.4.100' }).kind, 'unsupported');
  assert.equal(parse({ missingUID: true }).kind, 'failed');
  assert.equal(parseDicom(new Uint8Array([0, 1, 2]), 'bad.txt', 'bad.txt').kind, 'failed');
});
test('spatial ordering takes precedence; incompatible orientations use instance numbers', () => {
  const a = parse({ instance: 1 }).instance,
    b = parse({ instance: 2 }).instance;
  a.position = [0, 0, 10];
  b.position = [0, 0, -10];
  assert.deepEqual(
    sortInstances([a, b]).map((i) => i.id),
    [b.id, a.id],
  );
  b.orientation = [0, 1, 0, 1, 0, 0];
  assert.deepEqual(
    sortInstances([b, a]).map((i) => i.id),
    [a.id, b.id],
  );
  a.instanceNumber = undefined;
  b.instanceNumber = undefined;
  assert.deepEqual(
    sortInstances([b, a]).map((i) => i.id),
    [a.id, b.id],
  );
});
test('layouts place active series first, stay within study and leave excess cells empty', () => {
  const catalog = buildCatalog(
    sampleFiles().map((f) => parseDicom(new Uint8Array(f.buffer), f.name, f.name).instance),
  );
  const active = catalog[0].series[1].id;
  const assignments = assignLayout('2x2', active, catalog);
  assert.equal(assignments[0].seriesId, active);
  assert.equal(assignments[3].seriesId, null);
  assert.equal(new Set(assignments.filter((a) => a.seriesId).map((a) => a.seriesId)).size, 3);
  for (const layout of ['1x1', '1x2', '2x1'])
    assert.equal(assignLayout(layout, active, catalog).length, layout === '1x1' ? 1 : 2);
});
test('recursive directory reading drains every batch, including nested folders', async () => {
  const file = (name) => ({
    isFile: true,
    fullPath: `/nested/${name}`,
    file: (resolve) => resolve(new File(['data'], name)),
  });
  let calls = 0;
  const nested = {
    isDirectory: true,
    createReader: () => ({
      readEntries: (callback) =>
        callback(calls++ === 0 ? [file('one'), file('two')] : calls === 2 ? [file('three')] : []),
    }),
  };
  const result = await collectEntries([nested], new AbortController().signal);
  assert.equal(result.length, 3);
  assert.equal(calls, 3);
  assert.equal(result[2].relativePath, '/nested/three');
});
test('directory traversal aborts without returning partial results', async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(() => collectEntries([], controller.signal), { name: 'AbortError' });
});
// Worker stand-in runs the actual parser while exercising orchestration and cancellation.
class TestWorker {
  terminated = false;
  async postMessage(data) {
    const bytes = new Uint8Array(await data.file.arrayBuffer());
    setTimeout(() => {
      if (!this.terminated)
        this.onmessage({ data: parseDicom(bytes, data.file.name, data.relativePath) });
    }, 5);
  }
  terminate() {
    this.terminated = true;
  }
}
test('imports deduplicate within batch and against session without mutating session IDs', async () => {
  globalThis.Worker = TestWorker;
  const bytes = dicomFixture();
  const files = ['first', 'duplicate'].map((name) => ({
    file: new File([bytes], name),
    relativePath: name,
  }));
  const seen = new Set();
  const result = await parseFiles(files, seen, new AbortController().signal, () => {});
  assert.equal(result.result.imported, 1);
  assert.equal(result.result.duplicates, 1);
  assert.equal(seen.size, 0);
  const next = await parseFiles(
    files,
    new Set([result.parsed[0].instance.id]),
    new AbortController().signal,
    () => {},
  );
  assert.equal(next.result.imported, 0);
  assert.equal(next.result.duplicates, 2);
});
test('aborting workers rejects import transaction before files can be committed', async () => {
  globalThis.Worker = TestWorker;
  const controller = new AbortController();
  const result = parseFiles(
    [{ file: new File([dicomFixture()], 'one'), relativePath: 'one' }],
    new Set(),
    controller.signal,
    () => {},
  );
  controller.abort();
  await assert.rejects(result, { name: 'AbortError' });
});
