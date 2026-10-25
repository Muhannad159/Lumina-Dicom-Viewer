import { Pause, Play } from 'lucide-react';
import type { Layout } from '../../dicom/types';
import IconButton from '../../../components/IconButton';
import Select from '../../../components/Select';
import type { Availability } from '../availability';
export interface PlaybackControlsProps {
  layout: Layout;
  onLayout: (layout: Layout) => void;
  playing: boolean;
  onPlay: () => void;
  fps: number;
  onFps: (fps: number) => void;
  cine: Availability;
}
export default function PlaybackControls({
  layout,
  onLayout,
  playing,
  onPlay,
  fps,
  onFps,
  cine,
}: PlaybackControlsProps) {
  return (
    <div
      role="group"
      aria-label="Layout and playback"
      className="flex shrink-0 items-center gap-1 border-r border-line pr-2 sm:pr-3"
    >
      <Select
        aria-label="Viewport layout"
        value={layout}
        onChange={(event) => onLayout(event.target.value as Layout)}
      >
        <option value="1x1">▣ 1 × 1</option>
        <option value="1x2">◫ 1 × 2</option>
        <option value="2x1">⊟ 2 × 1</option>
        <option value="2x2">⊞ 2 × 2</option>
      </Select>
      <IconButton
        label={playing ? 'Pause cine' : 'Play cine'}
        active={playing}
        disabled={!cine.enabled}
        title={cine.reason}
        aria-description={cine.reason}
        onClick={onPlay}
      >
        {playing ? <Pause size={18} /> : <Play size={18} />}
      </IconButton>
      <Select
        aria-label="Cine speed"
        title={cine.reason}
        aria-description={cine.reason}
        value={fps}
        disabled={!cine.enabled}
        onChange={(event) => onFps(Number(event.target.value))}
      >
        {[5, 10, 15, 24, 30].map((n) => (
          <option key={n} value={n}>
            {n} fps
          </option>
        ))}
      </Select>
    </div>
  );
}
