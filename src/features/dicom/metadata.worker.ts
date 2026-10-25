import { readMetadata } from './readMetadata';
import type { ImportFile } from './types';
self.onmessage = async ({ data }: MessageEvent<ImportFile>) => {
  try {
    self.postMessage(await readMetadata(data.file, data.relativePath));
  } catch {
    self.postMessage({ kind: 'failed', reason: 'The browser could not read this file.' });
  }
};
