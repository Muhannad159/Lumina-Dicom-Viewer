import { Upload } from 'lucide-react';
import { useSession } from '../session/SessionProvider';
import { useFileImport } from './FileImportProvider';
import ImportProgressDialog from './ImportProgressDialog';
import ImportReportDialog from './ImportReportDialog';
import { cn } from '../../lib/classes';
export default function ImportFeedback({ viewer }: { viewer: boolean }) {
  const { report, setShowReport } = useSession();
  const { dragging } = useFileImport();
  return (
    <>
      {report && (
        <button
          className={cn(
            'fixed right-3 z-30 rounded border border-line bg-panel px-2.5 text-[10px] text-accent',
            viewer ? 'bottom-1 py-0.5' : 'bottom-2 py-1.5',
          )}
          onClick={() => setShowReport(true)}
        >
          Import details{report.issues.length ? ` · ${report.issues.length} skipped` : ''}
        </button>
      )}
      {dragging && (
        <div className="pointer-events-none fixed inset-2.5 z-40 flex flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed border-accent bg-panel/95 text-accent">
          <Upload size={36} />
          <strong className="text-xl font-normal">Drop to add to your workspace</strong>
          <span className="text-muted">Files and folders are welcome</span>
        </div>
      )}
      <ImportProgressDialog />
      <ImportReportDialog />
    </>
  );
}
