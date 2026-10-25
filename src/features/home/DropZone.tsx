import { ScanLine, ShieldCheck, Upload } from 'lucide-react';
import { useFileImport } from '../import/FileImportProvider';
import { useSession } from '../session/SessionProvider';
import { cn } from '../../lib/classes';
export default function DropZone() {
  const { chooseFiles, dragging } = useFileImport();
  const { busy } = useSession();
  return (
    <section
      aria-label="Import DICOM images"
      className="relative z-10 mx-auto mt-9 max-w-[770px] rounded-2xl border border-line bg-panel p-3.5 shadow-xl shadow-theme sm:mt-10 sm:p-4.5"
    >
      <button
        type="button"
        data-testid="import-drop-zone"
        disabled={busy}
        onClick={chooseFiles}
        className={cn(
          'flex min-h-56 w-full flex-col items-center rounded-lg border border-dashed bg-accent-soft px-3 py-5 hover:border-accent disabled:opacity-40',
          dragging ? 'border-accent' : 'border-line',
        )}
      >
        <div aria-hidden="true" className="relative mt-1 h-[61px] w-[71px]">
          <div className="absolute top-0 left-1.5 h-[54px] w-[45px] -rotate-13 rounded-md border border-line bg-raised" />
          <div className="absolute top-1 left-5 flex h-[54px] w-[45px] rotate-8 flex-col items-center justify-center rounded-md border border-line bg-raised text-accent">
            <ScanLine size={32} strokeWidth={1.2} />
            <span className="mt-px text-[6px] tracking-widest">DICOM</span>
          </div>
          <span className="absolute -right-0.5 -bottom-0.5 grid size-7 place-items-center rounded-full border-3 border-panel bg-accent text-accent-ink">
            <Upload size={17} />
          </span>
        </div>
        <h2 className="mt-4 mb-2 text-lg font-medium tracking-tight">Drop your images here</h2>
        <p className="text-xs text-muted">Drag in DICOM files or an entire folder.</p>
      </button>
      <div className="mt-3.5 flex items-center justify-center gap-1.5 text-[9px] text-muted sm:text-[10px]">
        <ShieldCheck size={16} className="text-accent" />
        <span>Files stay on your device. Nothing is uploaded.</span>
      </div>
    </section>
  );
}
