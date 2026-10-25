import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../lib/classes';
import { useTouchButton } from '../hooks/useTouchButton';

interface PopoverProps {
  label: string;
  trigger: ReactNode;
  children: (close: () => void) => ReactNode;
  className?: string;
  width?: number;
  disabled?: boolean;
  disabledReason?: string;
}
export default function Popover({
  label,
  trigger,
  children,
  className,
  width = 260,
  disabled = false,
  disabledReason,
}: PopoverProps) {
  const touch = useTouchButton();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width, maxHeight: 600 });
  const button = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const id = useId();
  const close = () => setOpen(false);

  useLayoutEffect(() => {
    if (!open || !button.current || !popup.current) return;
    const reposition = () => {
      if (!button.current || !popup.current) return;
      const bounds = button.current.getBoundingClientRect();
      const popupWidth = Math.min(width, window.innerWidth - 24);
      const below = window.innerHeight - bounds.bottom - 20;
      const above = bounds.top - 20;
      const placeBelow = below >= Math.min(popup.current.scrollHeight, 240) || below >= above;
      const maxHeight = Math.max(60, placeBelow ? below : above);
      const height = Math.min(popup.current.scrollHeight, maxHeight);
      setPosition({
        width: popupWidth,
        maxHeight,
        left: Math.max(
          12,
          Math.min(bounds.right - popupWidth, window.innerWidth - popupWidth - 12),
        ),
        top: Math.max(12, placeBelow ? bounds.bottom + 8 : bounds.top - height - 8),
      });
    };
    reposition();
    window.addEventListener('resize', reposition);
    document.addEventListener('scroll', reposition, true);
    popup.current
      .querySelector<HTMLElement>('button, select, input, [tabindex="0"]')
      ?.focus({ preventScroll: true });
    return () => {
      window.removeEventListener('resize', reposition);
      document.removeEventListener('scroll', reposition, true);
    };
  }, [open, width]);

  useEffect(() => {
    if (disabled && open) setOpen(false);
  }, [disabled, open]);

  useEffect(() => {
    if (!open) return;
    const outside = (event: Event) => {
      if (
        event.target instanceof Node &&
        !popup.current?.contains(event.target) &&
        !button.current?.contains(event.target)
      )
        close();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        close();
        button.current?.focus({ preventScroll: true });
      }
    };
    const resize = () => close();
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape, true);
    document.addEventListener('fullscreenchange', resize);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape, true);
      document.removeEventListener('fullscreenchange', resize);
    };
  }, [open]);

  return (
    <>
      <button
        {...touch}
        ref={button}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-haspopup="dialog"
        disabled={disabled}
        title={disabled ? (disabledReason ?? label) : label}
        aria-description={disabled ? disabledReason : undefined}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-3 text-xs text-muted hover:bg-raised disabled:cursor-default disabled:opacity-40',
          open && 'bg-raised text-accent',
          className,
        )}
      >
        {trigger}
      </button>
      {open &&
        createPortal(
          <div
            ref={popup}
            id={id}
            role="dialog"
            aria-label={`${label} options`}
            style={position}
            className="fixed z-50 max-h-[calc(100dvh-24px)] overflow-y-auto overscroll-contain rounded-xl border border-line bg-raised p-2 text-foreground shadow-xl"
          >
            {children(close)}
          </div>,
          document.fullscreenElement ?? document.body,
        )}
    </>
  );
}
