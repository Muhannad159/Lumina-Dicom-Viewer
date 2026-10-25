import { Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import IconButton from '../../../components/IconButton';
import type { MeasurementRow } from './model';

export default function MeasurementItem({
  row,
  onSelect,
  onRename,
  onToggle,
  onDelete,
}: {
  row: MeasurementRow;
  onSelect: () => void;
  onRename: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <li data-testid="measurement-row" className="rounded-lg border border-line bg-background p-2">
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={row.selected}
        className="grid min-h-11 w-full gap-1 rounded px-1 text-left text-xs aria-pressed:text-accent"
      >
        <strong className="break-words">{row.label}</strong>
        <span className="text-[10px] text-muted">
          {row.tool} · Image {row.frameIndex + 1}
          {!row.visible && ' · Hidden'}
        </span>
        {row.details && <span className="text-[10px] leading-4 text-muted">{row.details}</span>}
      </button>
      <div className="mt-1 flex justify-end gap-1">
        <IconButton label={`Rename ${row.label}`} onClick={onRename}>
          <Pencil size={15} />
        </IconButton>
        <IconButton label={`${row.visible ? 'Hide' : 'Show'} ${row.label}`} onClick={onToggle}>
          {row.visible ? <Eye size={15} /> : <EyeOff size={15} />}
        </IconButton>
        <IconButton label={`Delete ${row.label}`} onClick={onDelete}>
          <Trash2 size={15} />
        </IconButton>
      </div>
    </li>
  );
}
