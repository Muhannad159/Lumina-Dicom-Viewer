export interface InstanceScrollbarProps {
  currentIndex: number;
  totalImages: number;
  onChange: (index: number) => void;
  disabled?: boolean;
}
export default function InstanceScrollbar({
  currentIndex,
  totalImages,
  onChange,
  disabled = false,
}: InstanceScrollbarProps) {
  if (totalImages <= 1) return null;
  const index = Math.max(0, Math.min(currentIndex, totalImages - 1));
  return (
    <div
      data-testid="instance-scrollbar"
      className="absolute top-20 right-0 bottom-16 z-10 flex w-8 justify-center sm:w-9"
      onPointerDown={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
      onWheel={(event) => event.stopPropagation()}
    >
      <input
        type="range"
        min={0}
        max={totalImages - 1}
        step={1}
        value={index}
        disabled={disabled}
        aria-label="Image slice"
        aria-orientation="vertical"
        aria-valuetext={`Image ${index + 1} of ${totalImages}`}
        className="h-full w-full cursor-pointer touch-none accent-accent [direction:ltr] [writing-mode:vertical-lr] disabled:cursor-default disabled:opacity-40"
        onChange={(event) => onChange(Number(event.target.value))}
        onKeyDown={(event) => {
          const values: Record<string, number> = {
            ArrowDown: index + 1,
            ArrowUp: index - 1,
            ArrowRight: index + 1,
            ArrowLeft: index - 1,
            Home: 0,
            End: totalImages - 1,
            PageDown: index + 10,
            PageUp: index - 10,
          };
          if (event.key in values) {
            event.preventDefault();
            event.stopPropagation();
            onChange(Math.max(0, Math.min(totalImages - 1, values[event.key])));
          }
        }}
      />
    </div>
  );
}
