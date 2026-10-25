import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Theme } from '../dicom/types';

export const themes: Theme[] = ['dark', 'light', 'blue', 'green'];
const ThemeContext = createContext<{ theme: Theme; setTheme: (theme: Theme) => void } | null>(null);
function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem('dicom-theme') as Theme;
    return themes.includes(saved) ? saved : 'dark';
  } catch {
    return 'dark';
  }
}
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState(initialTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('dicom-theme', theme);
    } catch {
      /* Preferences are optional. */
    }
  }, [theme]);
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme requires ThemeProvider');
  return context;
}
