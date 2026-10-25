import { useCallback, useState } from 'react';
export interface KeyImage {
  id: string;
  seriesId: string;
  instanceId: string;
  frame: number;
  label: string;
  patient: string;
  series: string;
}
export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<KeyImage[]>([]);
  const addBookmark = useCallback(
    (item: KeyImage) =>
      setBookmarks((previous) =>
        previous.some((entry) => entry.id === item.id) ? previous : [...previous, item],
      ),
    [],
  );
  const removeBookmark = useCallback(
    (id: string) => setBookmarks((previous) => previous.filter((entry) => entry.id !== id)),
    [],
  );
  const clearBookmarks = useCallback(() => setBookmarks([]), []);
  return { bookmarks, addBookmark, removeBookmark, clearBookmarks };
}
