import Modal from '../../components/Modal';
import { useSession } from '../session/SessionProvider';
export default function ImportReportDialog() {
  const { report, showReport, setShowReport } = useSession();
  if (!showReport || !report) return null;
  return (
    <Modal title="Import details" onClose={() => setShowReport(false)} wide>
      <div className="my-6 grid grid-cols-4 gap-3">
        {[
          [report.imported, 'Imported'],
          [report.duplicates, 'Duplicates'],
          [report.unsupported, 'Unsupported'],
          [report.failed, 'Unreadable'],
        ].map(([value, label]) => (
          <span key={label} className="flex flex-col gap-2 text-[11px] text-muted">
            <strong className="text-3xl font-normal text-accent">{value}</strong>
            {label}
          </span>
        ))}
      </div>
      {report.issues.length ? (
        <div className="max-h-[45dvh] overflow-auto">
          {report.issues.map((issue, index) => (
            <div
              key={index}
              className="grid gap-1.5 border-t border-line py-3 text-xs wrap-anywhere"
            >
              <strong className="font-normal">{issue.fileName}</strong>
              <span className="text-[11px] text-muted">{issue.reason}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted">All selected files were imported successfully.</p>
      )}
      <p className="mt-4 text-xs leading-6 text-muted">
        Images are available until you refresh, close this tab, or clear the session.
      </p>
    </Modal>
  );
}
