import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../lib/classes';
import { useTouchButton } from '../hooks/useTouchButton';

const variants = {
  primary: 'border-transparent bg-accent text-accent-ink shadow-sm',
  secondary: 'border-line bg-panel text-foreground hover:bg-raised',
  ghost: 'border-transparent bg-transparent text-muted hover:bg-raised hover:text-foreground',
};
const sizes = {
  sm: 'min-h-10 gap-2 px-3 text-xs',
  md: 'min-h-11 gap-2.5 px-4 text-sm',
  lg: 'min-h-12 gap-2.5 px-6 text-sm',
};
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}
export default function Button({
  variant = 'secondary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  const touch = useTouchButton();
  return (
    <button
      {...touch}
      type={type}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-lg border font-medium transition-colors disabled:cursor-default disabled:opacity-40 [&_svg]:shrink-0',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
