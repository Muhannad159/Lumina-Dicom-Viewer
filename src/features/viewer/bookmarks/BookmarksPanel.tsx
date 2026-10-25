import { Bookmark, Trash2, X } from 'lucide-react';
import IconButton from '../../../components/IconButton';
import Button from '../../../components/Button';
import { useSession } from '../../session/SessionProvider';
import type { KeyImage } from './useBookmarks';
export default function BookmarksPanel({
  onClose,
  onJump,
  onAdd,
  disabled,
}: {
  onClose: () => void;
  onJump: (item: KeyImage) => void;
  onAdd: () => void;
  disabled: boolean;
}) {
  const { bookmarks, removeBookmark } = useSession();
  return (
    <aside
      aria-label="Key-image bookmarks"
      className="absolute top-20 right-3 bottom-9 z-20 flex w-80 max-w-[calc(100%-24px)] flex-col rounded-xl border border-line bg-panel shadow-xl compact:top-auto compact:max-h-[45%]"
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
      }}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-line px-3 py-1">
        <h2 className="flex items-center gap-2 text-sm">
          <Bookmark size={16} className="text-accent" />
          Key images · {bookmarks.length}
        </h2>
        <IconButton label="Close bookmarks" onClick={onClose}>
          <X size={17} />
        </IconButton>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
        {bookmarks.length ? (
          <ul className="grid gap-2">
            {bookmarks.map((item) => (
              <li
                key={item.id}
                className="flex items-center rounded-lg border border-line bg-background p-1"
              >
                <button
                  type="button"
                  className="grid min-h-14 min-w-0 flex-1 gap-1 rounded px-2 py-2 text-left text-xs hover:bg-accent-soft"
                  onClick={() => onJump(item)}
                >
                  <strong className="truncate">{item.patient}</strong>
                  <span className="truncate text-muted">
                    {item.series} · {item.label}
                  </span>
                </button>
                <IconButton
                  label={`Remove bookmark ${item.label}`}
                  onClick={() => removeBookmark(item.id)}
                >
                  <Trash2 size={15} />
                </IconButton>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-4 text-center text-xs leading-5 text-muted">
            Bookmark important images from any series. They stay available until you clear this
            session.
          </p>
        )}
      </div>
      <div className="border-t border-line p-2">
        <Button size="sm" disabled={disabled} onClick={onAdd}>
          Bookmark current image
        </Button>
      </div>
    </aside>
  );
}
