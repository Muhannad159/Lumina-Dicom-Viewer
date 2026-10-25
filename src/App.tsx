import AppShell from './components/AppShell';
import { ThemeProvider } from './features/theme/ThemeProvider';
import { SessionProvider } from './features/session/SessionProvider';
import { FileImportProvider } from './features/import/FileImportProvider';

export default function App() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <FileImportProvider>
          <AppShell />
        </FileImportProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
