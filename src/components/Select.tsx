import type { SelectHTMLAttributes } from 'react';
import { cn } from '../lib/classes';
export default function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'min-h-10 rounded-md border border-line bg-raised px-2 text-xs text-foreground disabled:opacity-40',
        className,
      )}
      {...props}
    />
  );
}
