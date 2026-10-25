import { X } from 'lucide-react';
import { useSession } from '../features/session/SessionProvider';
import IconButton from './IconButton';
export default function Notification() {
  const { notice, dismiss } = useSession();
  if (!notice) return null;
  return (
    <div
      role="status"
      className="fixed bottom-11 left-1/2 z-50 flex max-w-[90vw] -translate-x-1/2 items-center gap-3 rounded-xl border border-line bg-raised py-2 pr-2 pl-4 text-xs shadow-xl"
    >
      <span>{notice}</span>
      <IconButton label="Dismiss notification" onClick={dismiss}>
        <X size={16} />
      </IconButton>
    </div>
  );
}
