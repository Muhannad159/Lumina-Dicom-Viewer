import { Camera, RotateCcw, Box } from 'lucide-react';
import type { ToolName } from './runtime';
import type { ViewerAction } from './types';
import IconButton from '../../components/IconButton';
import ImagingTools from './toolbar/ImagingTools';
import PlaybackControls from './toolbar/PlaybackControls';
import type { PlaybackControlsProps } from './toolbar/PlaybackControls';
import MoreTools from './toolbar/MoreTools';
import ComparisonControls, { type ComparisonControlsProps } from './comparison/ComparisonControls';
import type { ViewerAvailability } from './availability';
interface ToolbarProps extends PlaybackControlsProps, ComparisonControlsProps {
  tool: ToolName;
  onTool: (tool: ToolName) => void;
  onAction: (action: ViewerAction) => void;
  onPreset: (value: string) => void;
  toolAvailability: ViewerAvailability;
  onMpr: () => void;
}
export default function Toolbar({
  tool,
  onTool,
  onAction,
  onPreset,
  links,
  onToggleLink,
  availability,
  options,
  toolAvailability,
  onMpr,
  ...playback
}: ToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Viewer tools"
      data-testid="viewer-toolbar"
      className="w-full min-w-0 shrink-0 overflow-x-auto overscroll-x-contain border-b border-line bg-panel px-2 py-2"
    >
      <div
        data-testid="toolbar-controls"
        className="mx-auto flex w-max flex-nowrap items-center gap-2 sm:gap-3"
      >
        <ImagingTools tool={tool} onTool={onTool} availability={toolAvailability.tools} />
        <PlaybackControls {...playback} />
        <ComparisonControls
          links={links}
          onToggleLink={onToggleLink}
          availability={availability}
          options={options}
        />
        <IconButton
          label="Open MPR"
          disabled={!toolAvailability.mpr.enabled}
          title={toolAvailability.mpr.reason ?? 'Open MPR'}
          aria-description={toolAvailability.mpr.reason}
          onClick={onMpr}
        >
          <Box size={18} />
        </IconButton>
        <div role="group" aria-label="View actions" className="flex shrink-0 items-center gap-1">
          <IconButton
            label="Reset view (R)"
            disabled={!toolAvailability.actions.reset.enabled}
            title={toolAvailability.actions.reset.reason ?? 'Reset view (R)'}
            aria-description={toolAvailability.actions.reset.reason}
            onClick={() => onAction('reset')}
          >
            <RotateCcw size={18} />
          </IconButton>
          <IconButton
            label="Screenshot and crop"
            disabled={!toolAvailability.actions.screenshot.enabled}
            title={toolAvailability.actions.screenshot.reason ?? 'Screenshot and crop'}
            aria-description={toolAvailability.actions.screenshot.reason}
            onClick={() => onAction('screenshot')}
          >
            <Camera size={18} />
          </IconButton>
          <MoreTools
            tool={tool}
            onTool={onTool}
            onAction={onAction}
            onPreset={onPreset}
            availability={toolAvailability}
          />
        </div>
      </div>
    </div>
  );
}
