import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useSession } from '../session/SessionProvider';
import { useFileSelection } from './useFileSelection';

const FileImportContext = createContext<ReturnType<typeof useFileSelection> | null>(null);
export function FileImportProvider({ children }: { children: ReactNode }) {
  const { importFiles, notify } = useSession();
  const selection = useFileSelection(importFiles, notify);
  return (
    <FileImportContext.Provider value={selection}>
      <input
        ref={selection.filesInput}
        type="file"
        multiple
        hidden
        onChange={selection.openPicked}
        aria-label="Open DICOM files"
      />
      <input
        ref={selection.folderInput}
        type="file"
        multiple
        hidden
        {...{ webkitdirectory: '' }}
        onChange={selection.openPicked}
        aria-label="Open DICOM folder"
      />
      {children}
    </FileImportContext.Provider>
  );
}
export function useFileImport() {
  const context = useContext(FileImportContext);
  if (!context) throw new Error('useFileImport requires FileImportProvider');
  return context;
}
