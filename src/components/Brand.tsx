import LuminaLogo from './LuminaLogo';
import { cn } from '../lib/classes';
import { appPath, navigate } from '../lib/navigation';
export default function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <a
      href={appPath('/')}
      onClick={(event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
          return;
        event.preventDefault();
        navigate('/');
      }}
      aria-label="Lumina home"
      className={cn(
        'flex shrink-0 items-center font-bold tracking-tight',
        compact ? 'gap-2 text-[13px] sm:text-base' : 'gap-3 text-base sm:text-xl',
      )}
    >
      <span
        className={cn(
          'grid shrink-0 place-items-center rounded-xl border border-line bg-accent-soft text-accent',
          compact ? 'size-8' : 'size-10',
        )}
      >
        <LuminaLogo className={compact ? 'size-7' : 'size-9'} />
      </span>
      <span>
        Lumina
        <small
          className={cn(
            'mt-1 block font-medium text-muted',
            compact ? 'text-[5px] tracking-[1.5px] sm:text-[6px]' : 'text-[7px] tracking-[2.5px]',
          )}
        >
          DICOM WORKSPACE
        </small>
      </span>
    </a>
  );
}
