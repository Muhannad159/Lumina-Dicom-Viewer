import { useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { collectEntries, selectedFiles } from '../dicom/importer';
import type { DiscoverFiles } from './useDicomImport';

export function useFileSelection(
  importFiles: (discover: DiscoverFiles) => Promise<void>,
  notify: (message: string) => void,
) {
  const filesInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const dragCount = useRef(0);
  const [dragging, setDragging] = useState(false);
  const chooseFiles = () => filesInput.current?.click();
  const chooseFolder = () => {
    if (folderInput.current && 'webkitdirectory' in folderInput.current)
      folderInput.current.click();
    else {
      notify(
        'Folder selection is unavailable in this browser. Select multiple DICOM files instead.',
      );
      chooseFiles();
    }
  };
  const openPicked = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? selectedFiles(event.target.files) : [];
    event.target.value = '';
    if (files.length) void importFiles(async () => files);
  };
  const dragBindings = {
    onDragEnter(event: DragEvent) {
      if (event.dataTransfer.types.includes('Files')) {
        event.preventDefault();
        dragCount.current++;
        setDragging(true);
      }
    },
    onDragLeave() {
      dragCount.current = Math.max(0, dragCount.current - 1);
      if (!dragCount.current) setDragging(false);
    },
    onDragOver(event: DragEvent) {
      if (event.dataTransfer.types.includes('Files')) event.preventDefault();
    },
    onDrop(event: DragEvent) {
      if (!event.dataTransfer.types.includes('Files')) return;
      event.preventDefault();
      dragCount.current = 0;
      setDragging(false);
      // Capture browser entries before the drop event's protected data store closes.
      const entries = Array.from(event.dataTransfer.items)
        .map((item) => item.webkitGetAsEntry?.())
        .filter((entry): entry is FileSystemEntry => Boolean(entry));
      const fallback = selectedFiles(event.dataTransfer.files);
      void importFiles((signal) =>
        entries.length ? collectEntries(entries, signal) : Promise.resolve(fallback),
      );
    },
  };
  return { filesInput, folderInput, dragging, chooseFiles, chooseFolder, openPicked, dragBindings };
}
