import { lazy, Suspense } from 'react';
import { useSession } from '../features/session/SessionProvider';
import { useFileImport } from '../features/import/FileImportProvider';
import { useHashRoute } from '../hooks/useHashRoute';
import { cn } from '../lib/classes';
import HomePage from '../features/home/HomePage';
import ImportFeedback from '../features/import/ImportFeedback';
import AppHeader from './AppHeader';
import Notification from './Notification';
import StatusMessage from './StatusMessage';
const Viewer = lazy(() => import('../features/viewer/Viewer'));
export default function AppShell() {
  const { studies, notify } = useSession();
  const { dragBindings } = useFileImport();
  const viewer = useHashRoute(studies.length > 0);
  return (
    <div
      data-testid="app-shell"
      className={cn(viewer ? 'flex h-dvh min-h-0 flex-col overflow-hidden' : 'min-h-dvh')}
      {...dragBindings}
    >
      <AppHeader viewer={viewer} />
      {viewer ? (
        <Suspense fallback={<StatusMessage>Opening workspace…</StatusMessage>}>
          <Viewer studies={studies} onNotice={notify} />
        </Suspense>
      ) : (
        <HomePage />
      )}
      <ImportFeedback viewer={viewer} />
      <Notification />
    </div>
  );
}
