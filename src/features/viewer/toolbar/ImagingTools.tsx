import {
  Circle,
  Contrast,
  Layers,
  Move,
  RectangleHorizontal,
  Ruler,
  Triangle,
  ZoomIn,
} from 'lucide-react';
import IconButton from '../../../components/IconButton';
import type { ToolName } from '../runtime';
import type { Availability } from '../availability';
const tools = [
  ['scroll', 'Scroll (S)', Layers],
  ['window', 'Window / level (W)', Contrast],
  ['pan', 'Pan (P)', Move],
  ['zoom', 'Zoom (Z)', ZoomIn],
  ['length', 'Length (L)', Ruler],
  ['rectangle', 'Rectangle ROI', RectangleHorizontal],
  ['ellipse', 'Elliptical ROI', Circle],
  ['angle', 'Angle', Triangle],
] as const;
export default function ImagingTools({
  tool,
  onTool,
  availability,
}: {
  tool: ToolName;
  onTool: (tool: ToolName) => void;
  availability: Record<ToolName, Availability>;
}) {
  return (
    <div
      role="group"
      aria-label="Imaging tools"
      className="flex shrink-0 items-center gap-1 border-r border-line pr-2 sm:pr-3"
    >
      {tools.map(([name, label, Icon]) => (
        <IconButton
          key={name}
          label={label}
          active={tool === name}
          disabled={!availability[name].enabled}
          title={availability[name].reason ?? label}
          aria-description={availability[name].reason}
          onClick={() => onTool(name)}
          className="flex-col gap-1 xl:min-h-12 xl:min-w-14"
        >
          <Icon size={19} />
          <span className="hidden text-[8px] whitespace-nowrap xl:inline">
            {label.split(' (')[0]}
          </span>
        </IconButton>
      ))}
    </div>
  );
}
