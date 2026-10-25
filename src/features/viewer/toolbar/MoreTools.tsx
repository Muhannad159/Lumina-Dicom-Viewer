import {
  Eraser,
  FlipHorizontal2,
  FlipVertical2,
  Info,
  Maximize,
  RotateCw,
  SlidersHorizontal,
  SunMoon,
  Trash2,
  Crosshair,
  Search,
  MoveUpRight,
  MoveDiagonal2,
  List,
  Spline,
  PencilLine,
  Ruler,
  Scan,
  BookmarkPlus,
  Bookmark,
} from 'lucide-react';
import type { ViewerAction } from '../types';
import Popover from '../../../components/Popover';
import Select from '../../../components/Select';
import type { ToolName } from '../runtime';
import type { ViewerAvailability } from '../availability';
const additionalTools = [
  ['probe', 'Pixel probe (I)', Crosshair],
  ['magnify', 'Magnifier (M)', Search],
  ['arrow', 'Arrow annotation (A)', MoveUpRight],
  ['bidirectional', 'Bidirectional measurement (B)', MoveDiagonal2],
  ['cobb', 'Cobb angle', Ruler],
  ['freehand', 'Freehand ROI', PencilLine],
  ['spline', 'Spline ROI', Spline],
  ['windowRegion', 'Regional window / level', Scan],
] as const;
const actions = [
  ['rotate', 'Rotate 90°', RotateCw],
  ['flipH', 'Flip horizontal', FlipHorizontal2],
  ['flipV', 'Flip vertical', FlipVertical2],
  ['invert', 'Invert', SunMoon],
  ['delete', 'Delete selected measurement', Eraser],
  ['clear', 'Clear series measurements', Trash2],
  ['metadata', 'Image metadata', Info],
  ['measurements', 'Measurements', List],
  ['bookmark', 'Bookmark current image', BookmarkPlus],
  ['bookmarks', 'Key-image bookmarks', Bookmark],
  ['fullscreen', 'Fullscreen', Maximize],
] as const;
export default function MoreTools({
  onAction,
  onPreset,
  availability,
  tool,
  onTool,
}: {
  onAction: (action: ViewerAction) => void;
  onPreset: (value: string) => void;
  availability: ViewerAvailability;
  tool: ToolName;
  onTool: (tool: ToolName) => void;
}) {
  const additional = additionalTools.find(([name]) => name === tool);
  return (
    <Popover
      label="More tools"
      className={additional ? 'bg-accent-soft text-accent' : undefined}
      trigger={
        <>
          <SlidersHorizontal size={18} />
          <span>{additional ? additional[1].replace(/ \([A-Z]\)$/, '') : 'More'}</span>
        </>
      }
    >
      {(close) => (
        <>
          <div
            role="group"
            aria-label="Additional imaging tools"
            className="mb-2 border-b border-line pb-2"
          >
            {additionalTools.map(([name, label, Icon]) => (
              <button
                key={name}
                type="button"
                aria-pressed={tool === name}
                disabled={!availability.tools[name].enabled}
                title={availability.tools[name].reason ?? label}
                aria-description={availability.tools[name].reason}
                className="flex min-h-11 w-full items-center gap-2.5 rounded-md px-2 text-left text-xs hover:bg-accent-soft aria-pressed:bg-accent-soft aria-pressed:text-accent disabled:opacity-40"
                onClick={() => {
                  onTool(name);
                  close();
                }}
              >
                <Icon size={17} />
                {label}
              </button>
            ))}
          </div>
          <label className="mb-1 grid gap-2 border-b border-line p-2 pb-3 text-xs text-muted">
            Window preset
            <Select
              aria-label="Window preset"
              defaultValue=""
              disabled={!availability.presets.default.enabled}
              title={availability.presets.default.reason}
              aria-description={availability.presets.default.reason}
              onChange={(event) => {
                onPreset(event.target.value);
                event.target.value = '';
              }}
            >
              <option value="" disabled>
                Select preset
              </option>
              <option value="default">DICOM default</option>
              <option
                value="soft"
                disabled={!availability.presets.soft.enabled}
                title={availability.presets.soft.reason}
              >
                CT · Soft tissue
              </option>
              <option
                value="lung"
                disabled={!availability.presets.lung.enabled}
                title={availability.presets.lung.reason}
              >
                CT · Lung
              </option>
              <option
                value="bone"
                disabled={!availability.presets.bone.enabled}
                title={availability.presets.bone.reason}
              >
                CT · Bone
              </option>
              <option
                value="brain"
                disabled={!availability.presets.brain.enabled}
                title={availability.presets.brain.reason}
              >
                CT · Brain
              </option>
            </Select>
          </label>
          {actions.map(([action, label, Icon]) => (
            <button
              type="button"
              key={action}
              disabled={!availability.actions[action].enabled}
              title={availability.actions[action].reason ?? label}
              aria-description={availability.actions[action].reason}
              className="flex min-h-11 w-full items-center gap-2.5 rounded-md px-2 text-left text-xs hover:bg-accent-soft disabled:opacity-40"
              onClick={() => {
                if (
                  ['metadata', 'fullscreen', 'measurements', 'bookmark', 'bookmarks'].includes(
                    action,
                  )
                )
                  close();
                onAction(action);
              }}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </>
      )}
    </Popover>
  );
}
