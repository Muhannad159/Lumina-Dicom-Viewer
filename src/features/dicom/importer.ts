import type { ImportFile, ImportProgress, ImportResult, ParsedFile, ParseResult } from './types';

export const abortError = () => new DOMException('Import cancelled', 'AbortError');
function check(signal: AbortSignal) {
  if (signal.aborted) throw abortError();
}

export async function collectEntries(
  entries: FileSystemEntry[],
  signal: AbortSignal,
): Promise<ImportFile[]> {
  const files: ImportFile[] = [];
  async function visit(entry: FileSystemEntry) {
    check(signal);
    if (entry.isFile) {
      const file = await new Promise<File>((resolve, reject) =>
        (entry as FileSystemFileEntry).file(resolve, reject),
      );
      files.push({ file, relativePath: entry.fullPath });
    } else if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      // Chromium delivers directory entries in batches; keep reading until empty.
      while (true) {
        check(signal);
        const batch = await new Promise<FileSystemEntry[]>((resolve, reject) =>
          reader.readEntries(resolve, reject),
        );
        if (!batch.length) break;
        for (const child of batch) await visit(child);
      }
    }
  }
  for (const entry of entries) await visit(entry);
  check(signal);
  return files;
}
export function selectedFiles(files: FileList | File[]): ImportFile[] {
  return Array.from(files).map((file) => ({
    file,
    relativePath: file.webkitRelativePath || file.name,
  }));
}
export async function parseFiles(
  files: ImportFile[],
  existing: Set<string>,
  signal: AbortSignal,
  onProgress: (progress: ImportProgress) => void,
): Promise<{ parsed: ParsedFile[]; result: ImportResult }> {
  check(signal);
  const ordered = [...files].sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  const results: ParseResult[] = new Array(ordered.length);
  let cursor = 0,
    completed = 0;
  const count = Math.min(3, Math.max(1, (navigator.hardwareConcurrency || 2) - 1), ordered.length);
  const workers: Worker[] = [];
  const abort = () => workers.forEach((w) => w.terminate());
  signal.addEventListener('abort', abort, { once: true });
  try {
    await Promise.all(
      Array.from({ length: count }, async () => {
        const worker = new Worker(new URL('./metadata.worker.ts', import.meta.url), {
          type: 'module',
        });
        workers.push(worker);
        while (cursor < ordered.length) {
          check(signal);
          const index = cursor++;
          results[index] = await new Promise<ParseResult>((resolve, reject) => {
            const cancel = () => reject(abortError());
            signal.addEventListener('abort', cancel, { once: true });
            worker.onmessage = (event) => {
              signal.removeEventListener('abort', cancel);
              resolve(event.data);
            };
            worker.onerror = () => {
              signal.removeEventListener('abort', cancel);
              reject(
                new Error(
                  'The metadata worker could not start. Reload the application and try again.',
                ),
              );
            };
            worker.postMessage(ordered[index]);
          });
          onProgress({ phase: 'Reading', completed: ++completed, total: ordered.length });
        }
      }),
    );
    check(signal);
    const result: ImportResult = {
      imported: 0,
      duplicates: 0,
      unsupported: 0,
      failed: 0,
      issues: [],
    };
    const parsed: ParsedFile[] = [];
    const seen = new Set(existing);
    results.forEach((item, index) => {
      if ('instance' in item) {
        if (seen.has(item.instance.id)) {
          result.duplicates++;
          result.issues.push({
            fileName: ordered[index].relativePath,
            kind: 'duplicate',
            reason: 'SOP Instance UID already imported.',
          });
        } else {
          seen.add(item.instance.id);
          result.imported++;
          parsed.push({ instance: item.instance, file: ordered[index].file });
        }
      } else {
        result[item.kind]++;
        result.issues.push({ fileName: ordered[index].relativePath, ...item });
      }
    });
    return { parsed, result };
  } finally {
    signal.removeEventListener('abort', abort);
    workers.forEach((w) => w.terminate());
  }
}
