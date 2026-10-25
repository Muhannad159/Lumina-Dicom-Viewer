import { parseDicom, unreadableDicomReason } from './parse.ts';
import type { ParseResult } from './types';

// Most headers fit in the first read. Grow for long sequences/private tags;
// deflated datasets and unusual headers can fall back to the complete file.
export async function readMetadata(file: File, relativePath: string): Promise<ParseResult> {
  let length = Math.min(file.size, 64 * 1024);
  while (true) {
    const bytes = new Uint8Array(await file.slice(0, length).arrayBuffer());
    const result = parseDicom(bytes, file.name, relativePath, file.size);
    if (
      'instance' in result ||
      result.kind !== 'failed' ||
      result.reason !== unreadableDicomReason ||
      length === file.size
    )
      return result;
    if (bytes.length >= 132 && String.fromCharCode(...bytes.subarray(128, 132)) !== 'DICM')
      return result;
    length = Math.min(file.size, length * 4);
  }
}
