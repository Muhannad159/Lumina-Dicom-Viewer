import { useCallback, useEffect, useRef, useState } from 'react';
import type { ImportFile, ImportProgress, ImportResult, LocalStudy } from '../dicom/types';
import { parseFiles } from '../dicom/importer';
import { buildCatalog } from '../dicom/catalog';

export type DiscoverFiles = (signal: AbortSignal) => Promise<ImportFile[]>;
export function useDicomImport({
  knownIds,
  blocked,
  commit,
  notify,
}: {
  knownIds: Set<string>;
  blocked: boolean;
  commit: (studies: LocalStudy[]) => void;
  notify: (message: string) => void;
}) {
  const [progress, setProgress] = useState<ImportProgress>();
  const [report, setReport] = useState<ImportResult>();
  const [showReport, setShowReport] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const cancel = useCallback(() => controller.current?.abort(), []);
  useEffect(() => cancel, [cancel]);
  const resetReport = () => {
    setReport(undefined);
    setShowReport(false);
  };
  async function importFiles(discover: DiscoverFiles) {
    if (controller.current || blocked) return;
    const abort = new AbortController();
    controller.current = abort;
    setProgress({ phase: 'Discovering', completed: 0, total: 0 });
    try {
      const files = await discover(abort.signal);
      if (!files.length) {
        notify('No files were found. Choose a folder containing DICOM images.');
        return;
      }
      setProgress({ phase: 'Reading', completed: 0, total: files.length });
      const { parsed, result } = await parseFiles(files, knownIds, abort.signal, setProgress);
      if (abort.signal.aborted) return;
      if (parsed.length) {
        setProgress({ phase: 'Preparing', completed: files.length, total: files.length });
        const runtime = await import('../viewer/runtime');
        await runtime.initializeCornerstone();
        if (abort.signal.aborted) return;
        runtime.registerFiles(parsed);
        commit(buildCatalog([...runtime.instances.values()]));
      }
      setReport(result);
      if (!result.imported) setShowReport(true);
      else
        notify(
          `${result.imported} ${result.imported === 1 ? 'file' : 'files'} imported${result.issues.length ? ` · ${result.issues.length} skipped — see Import details` : ''}.`,
        );
    } catch (error) {
      notify(
        abort.signal.aborted
          ? 'Import cancelled. Your existing session is unchanged.'
          : error instanceof Error
            ? error.message
            : 'The import could not be completed.',
      );
    } finally {
      if (controller.current === abort) {
        controller.current = null;
        setProgress(undefined);
      }
    }
  }
  return { progress, report, showReport, setShowReport, resetReport, importFiles, cancel };
}
