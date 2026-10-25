import { LoaderCircle } from 'lucide-react';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import { useSession } from '../session/SessionProvider';
export default function ImportProgressDialog() {
  const { progress, cancel, clearing } = useSession();
  if (!progress && !clearing) return null;
  return (
    <Modal
      title={clearing ? 'Clearing session' : 'Opening local images'}
      onClose={cancel}
      dismissible={!clearing}
    >
      <div className="flex flex-col items-center gap-4 py-4 text-center text-sm">
        <LoaderCircle size={30} className="animate-spin text-accent motion-reduce:animate-none" />
        {progress ? (
          <>
            <h3 className="text-lg font-medium">{progress.phase}…</h3>
            <p className="text-muted">
              {progress.total
                ? `${progress.completed} of ${progress.total} files`
                : 'Looking inside your folders'}
            </p>
            <progress
              className="h-1.5 w-full accent-accent"
              max={progress.total || 1}
              value={progress.total ? progress.completed : undefined}
            />
            <p className="text-xs text-muted">Your images stay in this browser session.</p>
            <Button onClick={cancel}>Cancel import</Button>
          </>
        ) : (
          <p className="text-muted">Releasing local images…</p>
        )}
      </div>
    </Modal>
  );
}
