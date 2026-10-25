import { ArrowLeft, Trash2 } from 'lucide-react';
import Brand from './Brand';
import IconButton from './IconButton';
import ThemePicker from '../features/theme/ThemePicker';
import ImportButtons from '../features/import/ImportButtons';
import { useSession } from '../features/session/SessionProvider';
import { cn } from '../lib/classes';
import { navigate } from '../lib/navigation';
export default function AppHeader({ viewer }: { viewer: boolean }) {
  const { studies, busy, clearSession } = useSession();
  return (
    <header
      className={cn(
        'relative z-30 flex shrink-0 items-center justify-between gap-2 border-b border-line bg-background',
        viewer ? 'h-16 px-2 sm:px-5 max-sm:h-14' : 'h-20 px-5 sm:h-22 sm:px-[5%]',
      )}
    >
      <Brand compact={viewer} />
      {!viewer && (
        <span className="hidden pl-12 text-xs text-faint lg:inline">
          Your images. Your workspace.
        </span>
      )}
      <div className="flex items-center gap-1 sm:gap-3">
        {viewer && (
          <>
            <IconButton
              label="Back to home"
              onClick={() => navigate('/')}
              className="max-sm:hidden"
            >
              <ArrowLeft size={18} />
            </IconButton>
            <ImportButtons compact />
          </>
        )}
        {!viewer && (
          <span className="mr-3 hidden items-center gap-2 text-xs text-muted sm:flex">
            <i className="size-1.5 rounded-full bg-accent" />
            100% local
          </span>
        )}
        <ThemePicker compact={viewer} />
        {studies.length > 0 && (
          <IconButton label="Clear session" disabled={busy} onClick={clearSession}>
            <Trash2 size={17} />
          </IconButton>
        )}
      </div>
    </header>
  );
}
