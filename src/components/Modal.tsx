import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import IconButton from './IconButton';
import { cn } from '../lib/classes';
export default function Modal({
  title,
  children,
  onClose,
  wide = false,
  dismissible = true,
  className,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  dismissible?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      className={cn(
        'm-auto max-h-[90dvh] rounded-2xl border border-line bg-panel p-5 text-foreground shadow-2xl backdrop:bg-black/85 backdrop:backdrop-blur-sm sm:p-6',
        wide ? 'w-[min(800px,calc(100vw-24px))]' : 'w-[min(480px,calc(100vw-24px))]',
        className,
      )}
      onCancel={(event) => {
        event.preventDefault();
        if (dismissible) onClose();
      }}
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-medium">{title}</h2>
        {dismissible && (
          <IconButton label="Close dialog" onClick={onClose}>
            <X size={18} />
          </IconButton>
        )}
      </div>
      {children}
    </dialog>
  );
}
