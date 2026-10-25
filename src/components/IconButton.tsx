import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/classes';
import { useTouchButton } from '../hooks/useTouchButton';
export default function IconButton({
  label,
  children,
  active,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
  active?: boolean;
}) {
  const touch = useTouchButton();
  return (
    <button
      {...touch}
      type="button"
      className={cn(
        'inline-flex size-10 shrink-0 items-center justify-center rounded-md transition-colors disabled:cursor-default disabled:opacity-40',
        active
          ? 'bg-accent-soft text-accent ring-1 ring-inset ring-line'
          : 'text-muted hover:bg-raised hover:text-foreground',
        className,
      )}
      title={label}
      aria-label={label}
      aria-pressed={active === undefined ? undefined : active}
      {...props}
    >
      {children}
    </button>
  );
}
