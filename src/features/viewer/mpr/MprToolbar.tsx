import { Contrast, Crosshair, LogOut, Move, RotateCcw, ZoomIn } from 'lucide-react';
import IconButton from '../../../components/IconButton';

export type MprTool = 'crosshairs' | 'pan' | 'zoom' | 'window';
const tools = [
  ['crosshairs', 'Crosshairs', Crosshair],
  ['pan', 'Pan', Move],
  ['zoom', 'Zoom', ZoomIn],
  ['window', 'Window / level', Contrast],
] as const;

export default function MprToolbar({
  tool,
  onTool,
  onReset,
  onExit,
  ready,
}: {
  tool: MprTool;
  onTool: (tool: MprTool) => void;
  onReset: () => void;
  onExit: () => void;
  ready: boolean;
}) {
  return (
    <div
      role="toolbar"
      aria-label="MPR tools"
      className="flex shrink-0 items-center justify-center gap-2 overflow-x-auto border-b border-line bg-panel px-3 py-2"
    >
      {tools.map(([name, label, Icon]) => (
        <IconButton
          key={name}
          label={label}
          active={tool === name}
          disabled={!ready}
          onClick={() => onTool(name)}
        >
          <Icon size={18} />
        </IconButton>
      ))}
      <IconButton label="Reset MPR views" disabled={!ready} onClick={onReset}>
        <RotateCcw size={18} />
      </IconButton>
      <IconButton label="Exit MPR" onClick={onExit}>
        <LogOut size={18} />
      </IconButton>
    </div>
  );
}
