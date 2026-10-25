import { ArrowUpRight, FilePlus2, FolderOpen } from 'lucide-react';
import Button from '../../components/Button';
import { useFileImport } from './FileImportProvider';
import { useSession } from '../session/SessionProvider';
import { cn } from '../../lib/classes';
export default function ImportButtons({ compact = false }: { compact?: boolean }) {
  const { chooseFiles, chooseFolder } = useFileImport();
  const { busy } = useSession();
  return (
    <div className={cn('flex items-center justify-center', compact ? 'gap-1 sm:gap-2' : 'gap-3')}>
      <Button
        variant={compact ? 'secondary' : 'primary'}
        size={compact ? 'sm' : 'lg'}
        disabled={busy}
        onClick={chooseFiles}
        aria-label={compact ? 'Add Files' : 'Open File'}
        className={compact ? 'max-sm:px-2' : undefined}
      >
        <FilePlus2 size={compact ? 16 : 19} />
        <span className={compact ? 'hidden sm:inline' : undefined}>
          {compact ? 'Add Files' : 'Open File'}
        </span>
        {!compact && <ArrowUpRight size={17} />}
      </Button>
      <Button
        size={compact ? 'sm' : 'lg'}
        disabled={busy}
        onClick={chooseFolder}
        aria-label={compact ? 'Add Folder' : 'Open Folder'}
        className={compact ? 'max-sm:px-2' : undefined}
      >
        <FolderOpen size={compact ? 16 : 19} />
        <span className={compact ? 'hidden sm:inline' : undefined}>
          {compact ? 'Add Folder' : 'Open Folder'}
        </span>
      </Button>
    </div>
  );
}
