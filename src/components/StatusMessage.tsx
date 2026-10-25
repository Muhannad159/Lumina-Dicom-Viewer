import type { ReactNode } from 'react';
export default function StatusMessage({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <div
      role={error ? 'alert' : 'status'}
      className="flex min-h-60 flex-1 items-center justify-center gap-3 p-6 text-muted"
    >
      {children}
    </div>
  );
}
