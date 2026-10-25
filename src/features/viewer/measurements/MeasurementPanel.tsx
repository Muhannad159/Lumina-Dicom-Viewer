import { useState } from 'react';
import type { RenderingEngine } from '@cornerstonejs/core';
import { List, X } from 'lucide-react';
import IconButton from '../../../components/IconButton';
import AnnotationLabelDialog from '../annotations/AnnotationLabelDialog';
import type { ViewportHandle } from '../types';
import type { MeasurementRow } from './model';
import { useMeasurements } from './useMeasurements';
import MeasurementItem from './MeasurementItem';
import Button from '../../../components/Button';
import { downloadText } from '../../../lib/download';
import { serializeMeasurements } from './export';
import { framesFor } from '../runtime';

export default function MeasurementPanel({
  handle,
  engine,
  onClose,
  onSelect,
  onNotice,
}: {
  handle?: ViewportHandle;
  engine: RenderingEngine;
  onClose: () => void;
  onSelect: () => void;
  onNotice: (message: string) => void;
}) {
  const measurements = useMeasurements(handle, engine);
  const [editing, setEditing] = useState<MeasurementRow>();
  return (
    <aside
      aria-label="Measurements"
      className="absolute top-20 right-3 bottom-9 z-20 flex w-80 max-w-[calc(100%-24px)] flex-col rounded-xl border border-line bg-panel shadow-xl compact:top-auto compact:max-h-[40%]"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-line px-3 py-1">
        <h2 className="flex items-center gap-2 text-sm font-medium">
          <List size={16} className="text-accent" />
          Measurements <span className="text-muted">{measurements.rows.length}</span>
        </h2>
        <IconButton label="Close measurements" onClick={onClose}>
          <X size={17} />
        </IconButton>
      </div>
      <div className="border-b border-line px-3 py-2 text-xs">
        <p className="truncate">{handle?.study.patientName ?? 'Choose a series'}</p>
        <p className="mt-1 truncate text-[10px] text-muted">
          {handle?.series.description} · Active viewport
        </p>
      </div>
      <div className="min-h-0 overflow-y-auto overscroll-contain p-2">
        {measurements.rows.length ? (
          <ul className="grid gap-2">
            {measurements.rows.map((row) => (
              <MeasurementItem
                key={row.id}
                row={row}
                onSelect={() => {
                  onSelect();
                  void measurements
                    .select(row)
                    .catch(() => onNotice('This measurement’s image could not be opened.'));
                }}
                onRename={() => setEditing(row)}
                onToggle={() => measurements.toggle(row)}
                onDelete={() => measurements.remove(row.id)}
              />
            ))}
          </ul>
        ) : (
          <p className="px-2 py-6 text-center text-xs leading-5 text-muted">
            Draw a measurement or annotation in this series to see it here.
          </p>
        )}
      </div>
      <div className="flex shrink-0 gap-2 border-t border-line p-2">
        {(['csv', 'json'] as const).map((format) => (
          <Button
            key={format}
            size="sm"
            disabled={!handle || !measurements.rows.length}
            onClick={() => {
              if (handle)
                downloadText(
                  serializeMeasurements(
                    format,
                    measurements.rows,
                    handle.series,
                    framesFor(handle.series),
                  ),
                  `lumina-measurements.${format}`,
                  format === 'json' ? 'application/json' : 'text/csv;charset=utf-8',
                );
            }}
          >
            Export {format.toUpperCase()}
          </Button>
        ))}
      </div>
      {editing && (
        <AnnotationLabelDialog
          initialValue={editing.label}
          onSave={(label) => {
            measurements.rename(editing.id, label);
            setEditing(undefined);
          }}
          onCancel={() => setEditing(undefined)}
        />
      )}
    </aside>
  );
}
