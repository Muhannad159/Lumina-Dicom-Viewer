import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useNotification } from '../../hooks/useNotification';
import { useLocalSession } from './useLocalSession';
import { useDicomImport } from '../import/useDicomImport';
import { useBookmarks } from '../viewer/bookmarks/useBookmarks';

function useSessionController() {
  const notifications = useNotification();
  const session = useLocalSession(notifications.notify);
  const bookmarks = useBookmarks();
  const imports = useDicomImport({
    knownIds: session.knownIds,
    blocked: session.clearing,
    commit: session.commit,
    notify: notifications.notify,
  });
  const busy = Boolean(imports.progress) || session.clearing;
  const clearSession = () => {
    if (!busy) {
      imports.resetReport();
      bookmarks.clearBookmarks();
      session.clear();
    }
  };
  return { ...session, ...imports, ...notifications, ...bookmarks, busy, clearSession };
}
const SessionContext = createContext<ReturnType<typeof useSessionController> | null>(null);
export function SessionProvider({ children }: { children: ReactNode }) {
  const value = useSessionController();
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession requires SessionProvider');
  return context;
}
