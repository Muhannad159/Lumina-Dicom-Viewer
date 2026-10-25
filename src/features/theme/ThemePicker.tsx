import { Check, ChevronDown } from 'lucide-react';
import Popover from '../../components/Popover';
import { themes, useTheme } from './ThemeProvider';
import { cn } from '../../lib/classes';
import type { Theme } from '../dicom/types';
const swatches: Record<Theme, string> = {
  dark: 'bg-[#52636e]',
  light: 'bg-[#e6ede9]',
  blue: 'bg-[#6daeff]',
  green: 'bg-[#97c66e]',
};
function Swatch({ theme }: { theme: Theme }) {
  return (
    <span
      className={cn(
        'inline-block size-3 shrink-0 rounded-full border-2 border-white/35',
        swatches[theme],
      )}
    />
  );
}
export default function ThemePicker({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  return (
    <Popover
      label="Choose theme"
      width={165}
      className="border border-line"
      trigger={
        <>
          <Swatch theme={theme} />
          <span className={cn('capitalize', compact && 'hidden sm:inline')}>{theme}</span>
          <ChevronDown size={13} />
        </>
      }
    >
      {(close) =>
        themes.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={value === theme}
            className="flex min-h-10 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-sm capitalize hover:bg-accent-soft"
            onClick={() => {
              setTheme(value);
              close();
            }}
          >
            <Swatch theme={value} />
            <span className="flex-1">{value}</span>
            {value === theme && <Check size={14} />}
          </button>
        ))
      }
    </Popover>
  );
}
